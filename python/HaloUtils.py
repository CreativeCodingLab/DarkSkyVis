import json
import numpy as np
import sdfpy as sdf
import os.path as op
from glob import glob
import thingking as tk


def l2a(l):
    return np.array(l)



def addHalo(data):

    return {
        "scale": data[0], #Scale: Scale factor of halo.,
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
        "velocity": list([float(data[20]), float(data[21]), float(data[22])]), #VX/VY/VZ: Halo velocity (km/s physical).,
        "angVel": list([float(data[23]), float(data[24]), float(data[25])]), #JX/JY/JZ: Halo angular momenta ((Msun/h) * (Mpc/h) * km/s (physical)).,
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
        "Macc": data[56],
        "Mpeak": data[57],
        "Vacc": data[58],
        "Vpeak": data[59],

        "Halfmass_Scale": data[60],
        "Acc_Rate_Inst": data[61],
        "Acc_Rate_100Myr": data[62],
        "Acc_Rate_Tdyn": data[63],

        "clients": {},
        "positions": [],

        "rootHaloID": -1,
        "nextDesc_id": -1,

        "trackedPos": list(np.empty(0)),
        "trackedVel": list(np.empty(0))
    }

class Halo(object):
    """
    Convenience class to wrap all these damn variables...
    input assumes something along the lines of the following
    loadtxt(prefix+"rockstar/hlists/hlist_1.00000.list", unpack=True)
    """
    def __init__(self, data):
        # self.time = time; # The timepoint at which the halo exists
        self.scale = data[0] #Scale: Scale factor of halo.
        self.id = int(data[1]) #ID: ID of halo (unique across entire simulation).
        self.desc_scale = data[2] #Desc_Scale: Scale of descendant halo, if applicable.
        self.desc_id = int(data[3]) #Descid: ID of descendant halo, if applicable.
        self.num_prog = int(data[4]) #Num_prog: Number of progenitors.
        self.pid = int(data[5]) #Pid: Host halo ID (-1 if distinct halo).
        self.upid = int(data[6]) #Upid: Most massive host halo ID (only different from Pid in cases of sub-subs, or sub-sub-subs, etc.).
        self.desc_pid = data[7] #Desc_pid: Pid of descendant halo (if applicable).
        self.phantom = data[8] #Phantom: Nonzero for halos interpolated across timesteps.
        self.sam_mvir = data[9] #SAM_Mvir: Halo mass, smoothed across accretion history; always greater than sum of halo masses of contributing progenitors (Msun/h).  Only for use with select semi-analytic models.
        self.mvir = data[10] #Mvir: Halo mass (Msun/h).
        self.rvir = data[11] #Rvir: Halo radius (kpc/h comoving).
        self.rs = data[12] #Rs: Scale radius (kpc/h comoving).
        self.vrms = data[13] #Vrms: Velocity dispersion (km/s physical).
        self.mmp = data[14] #mmp?: whether the halo is the most massive progenitor or not.
        self.scale_of_last_MM = data[15] #scale_of_last_MM: scale factor of the last major merger (Mass ratio > 0.3).
        self.vmax = data[16] #Vmax: Maxmimum circular velocity (km/s physical).
        self.position = list([float(data[17]), float(data[18]), float(data[19])]) #X/Y/Z: Halo position (Mpc/h comoving).
        self.velocity = list([float(data[20]), float(data[21]), float(data[22])]) #VX/VY/VZ: Halo velocity (km/s physical).
        self.angVel = list([float(data[23]), float(data[24]), float(data[25])]) #JX/JY/JZ: Halo angular momenta ((Msun/h) * (Mpc/h) * km/s (physical)).
        self.Spin = data[26] #Spin: Halo spin parameter.
        self.Breadth_first_ID = data[27] #Breadth_first_ID: breadth-first ordering of halos within a tree.
        self.Depth_first_ID = data[28] #Depth_first_ID: depth-first ordering of halos within a tree.
        self.Tree_root_ID = data[29] #Tree_root_ID: ID of the halo at the last timestep in the tree.
        self.Orig_halo_ID = data[30] #Orig_halo_ID: Original halo ID from halo finder.
        self.Snap_num = data[31] #Snap_num: Snapshot number from which halo originated.
        self.Next_coprogenitor_depthfirst_ID = data[32] #Next_coprogenitor_depthfirst_ID: Depthfirst ID of next coprogenitor.
        self.Last_progenitor_depthfirst_ID = data[33] #Last_progenitor_depthfirst_ID: Depthfirst ID of last progenitor.
        self.Rs_Klypin = data[34] #Rs_Klypin: Scale radius determined using Vmax and Mvir (see Rockstar paper)
        self.M_all = data[35] #M_all: Mass enclosed within the specified overdensity, including unbound particles (Msun/h)
        self.M200b = data[36] #M200b--M2500c: Mass enclosed within specified overdensities (Msun/h)
        self.M200c = data[37]
        self.M500c = data[38]
        self.M2500c = data[39]
        self.Xoff = data[40] #Xoff: Offset of density peak from average particle position (kpc/h comoving)
        self.Voff = data[41] #Voff: Offset of density peak from average particle velocity (km/s physical)
        self.Spin_Bullock = data[42] #Spin_Bullock: Bullock spin parameter (J/(sqrt(2)*GMVR))
        self.b_to_a = data[43] #b_to_a, c_to_a: Ratio of second and third largest shape ellipsoid axes (B and C) to largest shape ellipsoid axis (A) (dimensionless).
        self.c_to_a = data[44] #  Shapes are determined by the method in Allgood et al. (2006). #  (500c) indicates that only particles within R500c are considered.
        self.a = [data[45], data[46], data[47]] #A[x],A[y],A[z]: Largest shape ellipsoid axis (kpc/h
        self.b_to_a500c = data[48]
        self.c_to_a500c = data[49]
        self.a500c = [data[50], data[51] , data[52]]
        self.kinToPotRatio = data[53] #T/|U|: ratio of kinetic to potential energies
        self.M_pe_Behroozi = data[54]
        self.M_pe_Diemer = data[55]
        self.Macc = data[56]
        self.Mpeak = data[57]
        self.Vacc = data[58]
        self.Vpeak = data[59]
        self.Halfmass_Scale = data[60]
        self.Acc_Rate_Inst = data[61]
        self.Acc_Rate_100Myr = data[62]
        self.Acc_Rate_Tdyn = data[63]

        self.clients = {}
        self.positions = []
        self.rootHaloID = -1

        self.nextDesc_id = -1

        self.trackedPos = np.empty(0)
        self.trackedVel = np.empty(0)


def main():
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


if __name__ == '__main__':
    main()


