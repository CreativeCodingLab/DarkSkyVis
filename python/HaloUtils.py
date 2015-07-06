import json
import numpy as np
import sdfpy as sdf
import os.path as op
from glob import glob
import thingking as tk


RAW = "http://darksky.slac.stanford.edu/scivis2015/data/ds14_scivis_0128"

def l2a(l):
    return np.array(l)


def addHalo(data):

    return {
        "scale": str(data[0] + 0.000000000000000001), #Scale: Scale factor of halo.,
        "id": int(data[1]), #ID: ID of halo (unique across entire simulation).,
        "desc_scale": data[2], #Desc_Scale: Scale of descendant halo, if applicable.,
        "desc_id": int(data[3]), #Descid: ID of descendant halo, if applicable.,
        "num_prog": int(data[4]), #Num_prog: Number of progenitors.,

        "pid": int(data[5]), #Pid: Host halo ID (-1 if distinct halo).,
        "upid": int(data[6]), #Upid: Most massive host halo ID (only different from Pid in cases of sub-subs, or sub-sub-subs, etc.).,
        "desc_pid": data[7], #Desc_pid: Pid of descendant halo (if applicable).,
        "phantom": data[8], #Phantom: Nonzero for halos interpolated across timesteps.,

        "sam_mvir": data[9], #SAM_Mvir: Halo mass, smoothed across accretion history; always greater than sum of halo masses of contributing progenitors (Msun/h).  Only for use with select semi-analytic models.,
        "mvir": data[10], #Mvir: Halo mass (Msun/h).,
        "rvir": data[11], #Rvir: Halo radius (kpc/h comoving).,
        "rs": data[12], #Rs: Scale radius (kpc/h comoving).,
        "vrms": data[13], #Vrms: Velocity dispersion (km/s physical).,

        "mmp": data[14], #mmp?: whether the halo is the most massive progenitor or not.,
        "scale_of_last_MM": data[15], #scale_of_last_MM: scale factor of the last major merger (Mass ratio > 0.3).,

        "vmax": data[16], #Vmax: Maxmimum circular velocity (km/s physical).,

        "position": list([float(data[17]), float(data[18]), float(data[19])]), #X/Y/Z: Halo position (Mpc/h comoving).,
        "x": float(data[17]), #X/Y/Z: Halo position (Mpc/h comoving).,
        "y": float(data[18]),
        "z": float(data[19]),

        "velocity": list([float(data[20]), float(data[21]), float(data[22])]), #VX/VY/VZ: Halo velocity (km/s physical).,
        "vx": float(data[20]), #VX/VY/VZ: Halo velocity (km/s physical).,
        "vy": float(data[21]),
        "vz": float(data[22]),

        "angVel": list([float(data[23]), float(data[24]), float(data[25])]), #JX/JY/JZ: Halo angular momenta ((Msun/h) * (Mpc/h) * km/s (physical)).,
        "Jx": float(data[23]), #JX/JY/JZ: Halo angular momenta ((Msun/h) * (Mpc/h) * km/s (physical)).,
        "Jy": float(data[24]),
        "Jz": float(data[25]),

        "Spin": data[26], #Spin: Halo spin parameter.,
        "Breadth_first_ID": data[27], #Breadth_first_ID: breadth-first ordering of halos within a tree.,
        "Depth_first_ID": data[28], #Depth_first_ID: depth-first ordering of halos within a tree.,
        "Tree_root_ID": data[29], #Tree_root_ID: ID of the halo at the last timestep in the tree.,
        "Orig_halo_ID": data[30], #Orig_halo_ID: Original halo ID from halo finder.,
        "Snap_num": data[31], #Snap_num: Snapshot number from which halo originated.,
        "Next_coprogenitor_depthfirst_ID": data[32], #Next_coprogenitor_depthfirst_ID: Depthfirst ID of next coprogenitor.,
        "Last_progenitor_depthfirst_ID": data[33], #Last_progenitor_depthfirst_ID: Depthfirst ID of last progenitor.,
        "Rs_Klypin": data[34], #Rs_Klypin: Scale radius determined using Vmax and Mvir (see Rockstar paper),

        "M_all": data[35], #M_all: Mass enclosed within the specified overdensity, including unbound particles (Msun/h),
        "M200b": data[36], #M200b--M2500c: Mass enclosed within specified overdensities (Msun/h),
        "M200c": data[37],
        "M500c": data[38],
        "M2500c": data[39],

        "Xoff": data[40], #Xoff: Offset of density peak from average particle position (kpc/h comoving),
        "Voff": data[41], #Voff: Offset of density peak from average particle velocity (km/s physical),

        "Spin_Bullock": data[42], #Spin_Bullock: Bullock spin parameter (J/(sqrt(2)*GMVR)),

        "b_to_a": data[43], #b_to_a, c_to_a: Ratio of second and third largest shape ellipsoid axes (B and C) to largest shape ellipsoid axis (A) (dimensionless).,
        "c_to_a": data[44], #  Shapes are determined by the method in Allgood et al. (2006). #  (500c) indicates that only particles within R500c are considered.,

        "a": [data[45], data[46], data[47]], #A[x],A[y],A[z]: Largest shape ellipsoid axis (kpc/h,
        "b_to_a500c": data[48],
        "c_to_a500c": data[49],

        "a500c": [data[50], data[51] , data[52]],
        "kinToPotRatio": data[53], #T/|U|: ratio of kinetic to potential energies,
        "M_pe_Behroozi": data[54],
        "M_pe_Diemer": data[55],
        # "Macc": data[56],
        # "Mpeak": data[57],
        # "Vacc": data[58],
        # "Vpeak": data[59],

        # "Halfmass_Scale": data[60],
        # "Acc_Rate_Inst": data[61],
        # "Acc_Rate_100Myr": data[62],
        # "Acc_Rate_Tdyn": data[63],

        "rootHaloID": -1,
        "nextDesc_id": -1,

        "trackedPos": list(np.empty(0)),
        "trackedVel": list(np.empty(0))
    }


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
    pfn = op.join(RAW, "ds14_scivis_0128_e4_dt04_" + time)
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

    pIDs = [1566149, 1565818, 1566042, 1566041, 1565928, 1565822, 1566145, 1565821]

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


def intoTheAbyss(haloList, objs):
    print "\nintoTheAbyss!"
    if len(haloList) <= 0:
        print "All done!"
        return objs

    targetHalo = haloList[0]

    ROCKSTAR = op.join(RAW, "rockstar", "hlists")
    time = targetHalo['scale'] + "000" if len(targetHalo['scale']) < 4  else targetHalo['scale'] + "00"
    fn = op.join(ROCKSTAR, "hlist_"+time+"0.list")

    print targetHalo['id'], targetHalo['scale'], time, fn

    halosObjs = l2a([addHalo(hl) for hl in tk.loadtxt(fn)])
    halo_xyz_mins = getHaloMinMaxXYZ(halosObjs)

    halo = {
        "time": time,
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


def main_toJson():
    # # Load N-body particles from a = 1.0 dataset. Particles have positions with
    # # units of proper kpc, and velocities with units of km/s.
    RAW = "http://darksky.slac.stanford.edu/scivis2015/data/ds14_scivis_0128"

    for time in np.arange(0.12, 1.01, 0.01):
        HALO = op.join(RAW, "rockstar", "hlists", "hlist_" + time + "000.list")
        # PARTICLE = op.join(RAW, "ds14_scivis_0128_e4_dt04_" + time + "00")

        halos = [addHalo(halo) for halo in tk.loadtxt(HALO)]
        jsonFN = fn.split('.list')[0] + ".json"
        with open(jsonFN, 'w') as haloJSON:
            print jsonFN, halos
            haloJSON.write( json.dumps( halos ) )

def main_tree679582():
    DATA = "../data/dev/tree679582.dat"
    HaloObjs = [ addHalo(h) for h in tk.loadtxt(DATA)]
    with open("../data/dev/tree679582.json", 'w') as haloJSON:
        haloJSON.write( json.dumps( HaloObjs ) )


def main():
    RAW = "http://darksky.slac.stanford.edu/scivis2015/data/ds14_scivis_0128"
    HALO = op.join(RAW, "rockstar", "hlists", "hlist_1.00000.list")
        # PARTICLE = op.join(RAW, "ds14_scivis_0128_e4_dt04_" + time + "00")
    halos = list()
    for halo in tk.loadtxt(HALO):
        _halo = addHalo(halo)
        entry = {'id': _halo['id'], 'position':_halo['position'], 'velocity':_halo['velocity'], 'z':_halo['x'], }
        halos.appen(addHalo(halo))

    # halos = [addHalo(halo) for halo in tk.loadtxt(HALO)]
    jsonFN = "hlist_1.0.json"
    with open(jsonFN, 'w') as haloJSON:
        print jsonFN, len(halos)
        haloJSON.write( json.dumps( halos ) )

if __name__ == '__main__':
    main()


# "scale" data[i++]
# "id" data[i++]
# "desc_scale" data[i++]
# "desc_id" data[i++]
# "num_prog" data[i++]
# "pid" data[i++]
# "upid" data[i++]
# "desc_pid" data[i++]
# "phantom" data[i++]
# "sam_mvir" data[i++]
# "mvir" data[i++]
# "rvir" data[i++]
# "rs" data[i++]
# "vrms" data[i++]
# "mmp?" data[i++]
# "scale_of_last_MM" data[i++]
# "vmax" data[i++]
# "x" data[i++]
# "y" data[i++]
# "z" data[i++]
# "vx" data[i++]
# "vy" data[i++]
# "vz" data[i++]
# "Jx" data[i++]
# "Jy" data[i++]
# "Jz" data[i++]
# "Spin" data[i++]
# "Breadth_first_ID" data[i++]
# "Depth_first_ID" data[i++]
# "Tree_root_ID" data[i++]
# "Orig_halo_ID" data[i++]
# "Snap_num" data[i++]
# "Next_coprogenitor_depthfirst_ID" data[i++]
# "Last_progenitor_depthfirst_ID" data[i++]
# "Rs_Klypin" data[i++]
# "M_all" data[i++]
# "M200b" data[i++]
# "M200c" data[i++]
# "M500c" data[i++]
# "M2500c" data[i++]
# "Xoff" data[i++]
# "Voff" data[i++]
# "Spin_Bullock" data[i++]
# "b_to_a" data[i++]
# "c_to_a" data[i++]
# "A[x]" data[i++]
# "A[y]" data[i++]
# "A[z]" data[i++]
# "b_to_a(500c)" data[i++]
# "c_to_a(500c)" data[i++]
# "A[x](500c)" data[i++]
# "A[y](500c)" data[i++]
# "A[z](500c)" data[i++]
# "T/|U|" data[i++]
# "M_pe_Behroozi" data[i++]
# "M_pe_Diemer" data[i++]