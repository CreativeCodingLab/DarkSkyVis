import json
import numpy as np
import sdfpy as sdf
import os.path as op
from glob import glob
import thingking as tk
from HaloUtils import addHalo


RAW = "http://darksky.slac.stanford.edu/scivis2015/data/ds14_scivis_0128"


def l2a(l):
    return np.array(l)


def getDomainWidth(sdfPosition):
    print "\tgetDomainWidth"
    rmin = l2a([sdfPosition[:, 0].min(),
                sdfPosition[:, 1].min(),
                sdfPosition[:, 2].min()])

    rmax = l2a([sdfPosition[:, 0].max(),
                sdfPosition[:, 1].max(),
                sdfPosition[:, 2].max()])

    # true_domain_left = rmin.copy()
    # true_domain_right = rmax.copy()
    true_domain_width = rmax - rmin
    return true_domain_width


def shift_periodic(pos, left, right, domain_width):
    """
    Periodically shift positions that are right of left+domain_width to
    the left, and those left of right-domain_width to the right.
    """
    print "\tshift_periodic"
    for i in range(3):
        mask = pos[:, i] >= left[i] + domain_width[i]
        pos[mask, i] -= domain_width[i]
        mask = pos[:, i] < right[i] - domain_width[i]
        pos[mask, i] += domain_width[i]
    return


def alignParticlesToHalos(time, particles, halo_xyz_mins):
    print "\talignParticlesToHalos:"
    h_100 = particles.parameters['h_100']
    width = particles.parameters['L0']
    cosmo_a = particles.parameters['a']
    kpc_to_Mpc = 1. / 1000
    sl = slice(0, None)

    convert_to_cMpc = lambda proper: ((proper + width) * h_100 * kpc_to_Mpc / cosmo_a)

    x_min = convert_to_cMpc(particles['x'][sl]).min()
    y_min = convert_to_cMpc(particles['y'][sl]).min()
    z_min = convert_to_cMpc(particles['z'][sl]).min()

    x_offset = abs(halo_xyz_mins[0] - x_min);
    y_offset = abs(halo_xyz_mins[1] - y_min);
    z_offset = abs(halo_xyz_mins[2] - z_min);

    if time == "0.13":
        print "\ttime is", time
        print "\tOld offsets were,", x_offset, y_offset, z_offset
        x_offset, y_offset, z_offset = 449.188867109, 449.153197109, 449.131007109
    elif time == "0.12":
        print "\ttime is", time
        print "\tOld offsets were,", x_offset, y_offset, z_offset
        x_offset, y_offset, z_offset = 489.276994541, 489.276994541, 489.276994541
    else:
        pass

    print "\t\toffsets are", x_offset, y_offset, z_offset
    positions = np.dstack([
        convert_to_cMpc(particles['x'][sl]) - x_offset,
        convert_to_cMpc(particles['y'][sl]) - y_offset,
        convert_to_cMpc(particles['z'][sl]) - z_offset
    ])[0]  # fyi, dstack spits out a tuple with an extra dimension. We need to decouple it
    print "\t\t", positions.shape
    return positions


def filter_sphere(time, center, radius, xyz_mins):
    """
    Filter data by masking out data outside of a sphere defined
    by a center and radius. Account for periodicity of data, allowing
    left/right to be outside of the domain.
    """
    print "filter_sphere", time, center, radius, xyz_mins

    # Load relevant particle data file
    pfn = op.join(RAW, "ds14_scivis_0128_e4_dt04_" + time + "00")
    particles = sdf.load_sdf(pfn)

    # Get left/right for periodicity considerations
    left = center - radius
    right = center + radius

    # Align the particle data with the halo data
    positions = alignParticlesToHalos(time, particles, xyz_mins)

    # Determine the domain width
    domain_width = getDomainWidth(positions)

    # Account for periodicity of the particle data...I guess?
    shift_periodic(positions, left, right, domain_width)

    # Now get all particles that are within the sphere
    mask = ((positions - center) ** 2).sum(axis=1) ** 0.5 < radius
    print "\tFiltering particles, returning %i out of %i" % (mask.sum(), mask.shape[0])

    if not np.any(mask):
        pass
    print "\tmask is", mask, mask.size

    # Build a dictionary with each axis as a key
    filtered = {ax: list(positions[:, i][mask]) for i, ax in enumerate('xyz')}
    print "\tfiltered Before: {x}", len(filtered['x'])

    # add the particles ID to the dictionary, mosly so that we have it
    filtered["id"] = list(particles['ident'][mask])
    filtered = [{'x': float(ax[0]), 'y': float(ax[1]), 'z': float(ax[2]), 'id': ax[3]} for ax in
                zip(filtered["x"], filtered["y"], filtered["z"], filtered["id"])]
    print "\tfiltered After", filtered[:3]
    return filtered


def getHaloMinMaxXYZ(Halos):
    '''
    Loads the Halo file, extracts the x,y,z coords for all halos, then computes
    the min of each axis. Used for scaling the dark matter particles
    '''
    # Load the a=1 Rockstar hlist file. The header of the file lists the useful
    # units/information.
    x_min = l2a([hl['x'] for hl in Halos]).min()
    y_min = l2a([hl['y'] for hl in Halos]).min()
    z_min = l2a([hl['z'] for hl in Halos]).min()
    return (x_min, y_min, z_min)


def intoTheVoid(fileList, TargetID, pID, coords, n):
    """
    The name is silly, but the role it serves in not

    Recursive Halo tracker which follows the parent/descendant Targetid of a Halo
    across a set of Halo-Files/Time Points.

    Returns a set of coordinates of a Halo's position over time
    """
    print len(fileList), TargetID, pID, len(coords), n
    if len(fileList) == 0:
        print "file is empty"
        return coords, n

    hfn = fileList[0]
    time = hfn[-12:-8]
    print hfn
    halosObjs = l2a([addHalo(hl) for hl in tk.loadtxt(hfn)])
    halo_xyz_mins = getHaloMinMaxXYZ(halosObjs)
    haloIDList = l2a([halo['id'] for halo in halosObjs])
    if TargetID is None:
        print TargetID, "is None"
        TargetID = haloIDList[0]
    index = (haloIDList == TargetID).nonzero()[0][0]
    if index < 0 or index is []:
        print "its -1!"
        return coords, n
    elif index > -1:
        tHl = halosObjs[index]
        halo = {
            "time": n,
            "xyz": list(tHl['position']),
            "rvir": tHl['rvir'] * (1. / 1000),  # radius, in mpc rather than kpc
            "rs": tHl['rs'],  # scale radius
            "id": tHl['id'],
            "child": tHl['desc_id'],
            "particles": filter_sphere(
                            time,
                            tHl['position'],
                            tHl['rvir'] * (1. / 1000),
                            halo_xyz_mins
                        )
        }
        coords.append(halo)
        return intoTheVoid(fileList[1:], tHl['desc_id'], tHl['id'], coords, n + 1)


def intoTheAbyss(haloList, objs):
    if haloList is []:
        return objs

    targetHalo = haloList[0]
    print targetHalo
    ROCKSTAR = op.join(RAW, "rockstar", "hlists")
    time = targetHalo['scale'] + "000" if len(targetHalo['scale']) < 4  else targetHalo['scale'] + "00"
    fn = op.join(ROCKSTAR, "hlist_"+time+"0.list")

    print targetHalo['id'], targetHalo['scale'], time, fn

    halosObjs = l2a([addHalo(hl) for hl in tk.loadtxt(fn)])
    halo_xyz_mins = getHaloMinMaxXYZ(halosObjs)

    halo = {
        "time": n,
        "xyz": list(targetHalo['position']),
        "rvir": targetHalo['rvir'] * (1. / 1000),  # radius, in mpc rather than kpc
        "rs": targetHalo['rs'],  # scale radius
        "id": targetHalo['id'],
        "child": targetHalo['desc_id'],
        "particles": filter_sphere(
                        time,
                        targetHalo['position'],
                        targetHalo['rvir'] * (1. / 1000),
                        halo_xyz_mins
                    )
    }
    objs.append(halo)
    return intoTheAbyss(haloList[1:], objs)



def Main_extract_haloPath_and_particles():
    ROCKSTAR = op.join(RAW, "rockstar", "hlists")
    PARTICLES = op.join(RAW, "ds14_scivis_0128")
    HALO_FILES, PARTICLE_FILES = [], []
    HALO_ID_LIST = [257., 259., 260., 263., 265., 129., 131., 132., 133.,
                    228., 224., 248., 335., 135., 125., 184., 121., 113.,
                    318., 300., 75., 76., 5., 340., 80., 82., 245.,
                    178., 169., 37., 226., 65., 64., 102., 284., 289.,
                    286., 126., 62., 22., 174., 163., 341., 342., 69.,
                    72., 151., 321., 137., 31., 78., 79., 4., 180.,
                    74., 179., 272., 283., 247., 36., 71., 199., 290.]


    for t in np.arange(0.12, 1.01, 0.01):
        time = str(t) + "000" if len(str(t)) < 4  else str(t) + "00"
        PARTICLE_FILES.append( op.join(PARTICLES, "ds14_scivis_0128_e4_dt04_"+str(time)) )
        HALO_FILES.append( op.join(ROCKSTAR, "hlist_"+str(time)+"0.list") )

    print HALO_FILES, PARTICLE_FILES

    # Get a list of coordinates starting with a halo at time "zero".

    for i, haloID in enumerate(HALO_ID_LIST[0:1]):  # Limiting our list to just one HALO
        # haloFileIndex = i + 0
        HaloObjs, time = intoTheVoid(HALO_FILES, haloID, -1, [], 0)
        print "\nwe have a total of", len(HaloObjs), "Halos"
        for j, halo in enumerate(HaloObjs):
            print i, halo['id'], haloID
            print "Halo has", len(halo['particles']), "particles"
            outFileName = "_".join(["Halo", str(haloID), 't' + str(j + 12)]) + ".json"
            print "our output file is", outFileName
            with open(outFileName, 'w') as outfile:
                outfile.write(json.dumps(halo))


def main():
    DATA = "../data/dev/miniTreeTest.dat"
    HaloObjs = [ addHalo(h) for h in tk.loadtxt(DATA)]
    objs = intoTheAbyss(HaloObjs, [])
    with open("../data/dev/haloTreeComplete.json", 'w') as haloJSON:
            haloJSON.write( json.dumps( objs ) )


def Main_extract_particle_path():
    HALO_FILES = []
    ROCKSTAR = op.join(RAW, "rockstar", "hlists")
    for t in np.arange(0.12, 1.01, 0.01):
        time = str(t) + "000" if len(str(t)) < 4  else str(t) + "00"
        HALO_FILES.append( op.join(ROCKSTAR, "hlists_"+str(time)+"0.list") )


    for i, fn in enumerate(HALO_FILES):
        halos = tk.loadtxt(fn)
        jsonFN = fn.split('.list')[0] + '.json'
        with open(jsonFN, 'w') as haloJSON:
            haloJSON.write( json.dumps( halos ) )


if __name__ == '__main__':
    main()
