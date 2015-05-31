"""
==============================================================================
Program: useful.py
 Author: Kyle Reese Almryde

 Description: A series of classes and functions that are useful in their own
    right, but dont necessarily belong in the main application program file.

==============================================================================
"""
import numpy as np
import pandas as pd
import thingking as tk


def l2a(l):
    return np.array(l)


class Attribute(object):
    """docstring for Attribute"""
    def __init__(self, detail, value):
        super(Attribute, self).__init__()
        self.detail = detail
        self.value = value

    def __call__(self):
        return self.value

    def __str__(self):
        return self.detail


class HaloWrangler(object):
    """docstring for HaloWrangler"""
    def __init__(self, filename, epoch):
        super(HaloWrangler, self).__init__()
        self.filename = filename
        self.epoch = epoch
        self.initRockStar()

    def initRockStar(self):
        halos = tk.loadtxt(self.filename)
        __data = dict()
        hlist = ["scale", "id", "desc_scale", "desc_id", "num_prog",
                 "pid", "upid", "desc_pid", "phantom", "sam_mvir",
                 "mvir", "rvir", "rs", "vrms", "mmp",
                 "scale_of_last_mm", "vmax", "x", "y", "z",
                 "vx", "vy", "vz", "jx", "jy", "jz", "spin",
                 "breadth_first_id", "depth_first_id", "tree_root_id",
                 "orig_halo_id", "snap_num", "next_coprogenitor_depthfirst_id",
                 "last_progenitor_depthfirst_id", "rs_klypin", "m_all",
                 "m200b", "m200c", "m500c", "m2500c", "xoff", "voff",
                 "spin_bullock", "b_to_a", "c_to_a", "a_x", "a_y", "a_z",
                 "b_to_a_500c", "c_to_a_500c", "a_x_500c", "a_y_500c",
                 "a_z_500c", "t_over_u", "m_pe_behroozi", "m_pe_diemer",
                 "macc", "mpeak", "vacc", "vpeak", "halfmass_scale",
                 "acc_rate_inst", "acc_rate_100myr", "acc_rate_tdyn"
                 ]
        for i, k in enumerate(hlist):
            # create a dictionary where each key in one of the index values
            # above and the Series index is the halo ID
            __data[k] = pd.Series(halos[:, i], index=halos[:, 1])
            # I might remove the index value and let it use the default
            # indexing operation

        self.rsDataFrame = pd.DataFrame(__data)


class SDFLoader(object):
    """docstring for SDFLoader"""
    def __init__(self, cMpc=False):
        super(SDFLoader, self).__init__()
        self.isCoMoving = cMpc

    def __call__(self, filename):
        self.initSDF(filename)
        return self.sdfPosition

    def initSDF(self, filename):
        self.sdfParticles = sdf.load_sdf(filename)
        self.sdfHeader = self.sdfParticles.parameters
        self.sdfPosition = self.sdfGetXYZ()
        self.sdfVelocity = self.sdfGetUVW()
        self.sdfMagnitude = self.sdfGetMagnitude()
        self.sdfAcceleration = self.sdfGetAcceleration()
        self.sdfPhi = self.sdfParticles['phi']
        self.sdfIdent = self.sdfParticles['ident']

    def sdfGetXYZ(self):
        x = self.sdfParticles['x']
        y = self.sdfParticles['y']
        z = self.sdfParticles['z']
        xyz = np.dstack((x, y, z))[0]
        if self.isCoMoving:
            return self.__toCoMoving(xyz)
        else:
            return xyz

    def sdfGetUVW(self):
        u = self.sdfParticles['vx']
        v = self.sdfParticles['vy']
        w = self.sdfParticles['vz']
        return np.dstack((u, v, w))[0]

    def sdfGetMagnitude(self):
        return abs(np.sqrt(self.sdfVelocity[:, 0]**2 +
                           self.sdfVelocity[:, 1]**2 +
                           self.sdfVelocity[:, 2]**+2))

    def sdfGetAcceleration(self):
        a = self.sdfParticles['ax']
        b = self.sdfParticles['ay']
        c = self.sdfParticles['az']
        return np.dstack((a,b,c))[0]

    def sdfSetDomain(self):
        rmin = l2a([self.sdfPosition[:,0].min(),
                    self.sdfPosition[:,1].min(),
                    self.sdfPosition[:,2].min()])

        rmax = l2a([self.sdfPosition[:,0].max(),
                    self.sdfPosition[:,1].max(),
                    self.sdfPosition[:,2].max()])

        self.true_domain_left = rmin.copy()
        self.true_domain_right = rmax.copy()
        self.true_domain_width = rmax - rmin

    def __toCoMoving(self, proper):
        h_100 = self.sdfHeader['h_100']
        width = self.sdfHeader['L0']
        cosmo_a = self.sdfHeader['a']
        kpc_to_Mpc = 1./1000
        return (proper + width/2.) * h_100 * kpc_to_Mpc / cosmo_a

    def __shift_periodic(pos, left, right, domain_width):
        """
        Periodically shift positions that are right of left+domain_width to
        the left, and those left of right-domain_width to the right.
        """
        for i in range(3):
            mask = pos[:,i] >= left[i] + domain_width[i]
            pos[mask, i] -= domain_width[i]
            mask = pos[:,i] < right[i] - domain_width[i]
            pos[mask, i] += domain_width[i]
        return

    def filter_sphere(self, center, radius, myiter):
        """
        Filter data by masking out data outside of a sphere defined
        by a center and radius. Account for periodicity of data, allowing
        left/right to be outside of the domain.
        """

        # Get left/right for periodicity considerations
        left = center - radius
        right = center + radius
        for data in myiter:
            pos = np.array([data['x'].copy(), data['y'].copy(), data['z'].copy()]).T

            DW = self.true_domain_width
            _shift_periodic(pos, left, right, DW)

            # Now get all particles that are within the sphere
            mask = ((pos-center)**2).sum(axis=1)**0.5 < radius

            sdflog.debug("Filtering particles, returning %i out of %i" % (mask.sum(), mask.shape[0]))

            if not np.any(mask):
                continue

            filtered = {ax: pos[:, i][mask] for i, ax in enumerate('xyz')}
            for f in data.keys():
                if f in 'xyz':
                    continue
                filtered[f] = data[f][mask]

            yield filtered


class Particle(object):
    """docstring for Particle"""
    def __init__(self, id, xyz, uvw, acs, phi):
        super(Particle, self).__init__()
        self.id = id
        self.xyz = xyz
        self.uvw = uvw
        self.acs = acs
        self.phi = phi


class Halo(object):
    """
    Convenience class to wrap all these damn variables...
    input assumes something along the lines of the following
    loadtxt(prefix+"rockstar/hlists/hlist_1.00000.list", unpack=True)
    """
    def __init__(self, data):
        self.data = "hello";
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
        self.position = l2a([float(data[17]), float(data[18]), float(data[19])]) #X/Y/Z: Halo position (Mpc/h comoving).
        self.velocity = l2a([float(data[20]), float(data[21]), float(data[22])]) #VX/VY/VZ: Halo velocity (km/s physical).
        self.angVel = l2a([float(data[23]), float(data[24]), float(data[25])]) #JX/JY/JZ: Halo angular momenta ((Msun/h) * (Mpc/h) * km/s (physical)).
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