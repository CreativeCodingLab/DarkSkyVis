import sys
import json
import numpy as np
import sdfpy as sdf
import os.path as op
from glob import glob
import thingking as tk
import StringIO as sio

RAW = "http://darksky.slac.stanford.edu/scivis2015/data/ds14_scivis_0128"

def l2a(l):
    return np.array(l)


def addHalo(data):
    """
    Create a dictionary object with the halo attributes, for easy json parsing
    later
    """
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

def extractTreeFromForest(fileName, target):
    """
    Given a Forest dataset, ie tree_0_0_0.dat
    and a target, ie 681184

    extract the halos that fall undert that root tree,
    return as a string, which can then be passed to StringIO
    and later np.loadtxt (which tk.loadtxt calls under the hood)
    and parse as a json file.
    """
    print fileName, target
    with open(fileName) as fp:
        while(True):
            try:
                line = fp.next()
            except StopIteration, e:
                return
            if line.startswith("#tree"):
                treeID = int(line.split()[1])
                print "treeID is" , treeID
                if treeID == target:
                    print "they match"
                    buf = ""
                    line = fp.next()
                    while(not line.startswith("#")):
                        print "so far so good"
                        buf += line
                        # In case we reach the end of the file object
                        try:
                            line = fp.next()
                        except StopIteration, e:
                            return buf
                    return buf

def main():
    # 677521
    # for the time being, assume we are using tree_parse_test.dat
    if len(sys.argv) > 1:
        target = int(sys.argv[1])
    else:
        raise Exception
    buff = extractTreeFromForest("../data/rockstar/tree/tree_0_0_0.dat", target)
    treeFP = sio.StringIO(buff)  # np.loadtxt treats StringIO objects as File objects

    halos = list()
    for h in np.loadtxt(treeFP):
        # _halo = addHalo(h)
        # # Just take what we need from the halos and leave the rest for now
        # entry = {
        #     'id': _halo['id'],
        #     'position':_halo['position'],
        #     'velocity':_halo['velocity'],
        #     'rvir': _halo["rvir"],
        #     'mvir': _halo["mvir"],
        #     'rs': _halo["rs"]
        # }
        # halos.append(entry)
        halos.append(addHalo(h))

    # halos = [addHalo(halo) for halo in tk.loadtxt(HALO)]
    varName = "_".join( ["tree", str(target)] )
    outFN = op.join("../javascript/js/assets", varName + ".json")
    with open(outFN, 'w') as haloFP:
        print outFN, len(halos)
        haloFP.write( json.dumps( halos ) )


if __name__ == '__main__':
    main()
