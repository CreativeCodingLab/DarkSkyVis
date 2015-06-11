
import json
import numpy as np
import sdfpy as sdf
import os.path as op
from glob import glob
import thingking as tk


def a2l(a):
    return list(a)

def l2a(l):
    return np.array(l)


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


class SDFLoader(object):
    """docstring for SDFLoader"""
    def __init__(self, filename):
        super(SDFLoader, self).__init__()
        self.isCoMoving = True
        self.init(filename)
        self.sdfSetDomain()

        print "what the fuck?"

    def get(self, radius=None, center=None):
        """ Calls the instance of SDFLoader and gets data

        Params:
            filename -- String, required argument

            If you give it a radius and a center, it will
            filter those points that fall within the sphere
            radius -- Float, Radius of a sphere
            center -- center, Center of a sphere

        Returns:
            Returns either the raw particle positions, or it
        """
        if radius is None and center is None:
            return self.sdfPosition
        else:
            return self.filter_sphere(center, radius)

    def init(self, filename):
        print "Lets get started"
        self.sdfParticles = sdf.load_sdf(filename)
        self.sdfHeader = self.sdfParticles.parameters
        self.sdfPosition = self.sdfGetXYZ()
        print "after",self.sdfPosition
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
        print "To Comoving!"
        print "\tBefore", proper
        h_100 = self.sdfHeader['h_100']
        width = self.sdfHeader['L0']
        cosmo_a = self.sdfHeader['a']
        kpc_to_Mpc = 1./1000
        return (proper + width/2.) * h_100 * kpc_to_Mpc / cosmo_a

    def __shift_periodic(self, pos, left, right, domain_width):
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

    def filter_sphere(self, center, radius):
        """
        Filter data by masking out data outside of a sphere defined
        by a center and radius. Account for periodicity of data, allowing
        left/right to be outside of the domain.
        """
        # Get left/right for periodicity considerations
        left = center - radius
        right = center + radius
        pos = self.sdfPosition.copy()
        print center, pos
        DW = self.true_domain_width
        self.__shift_periodic(pos, left, right, DW)
        print pos.shape
        # Now get all particles that are within the sphere
        mask = ((pos-center)**2).sum(axis=1)**0.5 < radius

        print "Filtering particles, returning %i out of %i" % (mask.sum(), mask.shape[0])

        if not np.any(mask):
            pass
        print "mask is ", mask, mask.size
        filtered = {ax: pos[:, i][mask] for i, ax in enumerate('xyz')}
        print "filtered Before", filtered
        filtered["id"] = self.sdfIdent[mask]
        for l, f in enumerate('xyz'):
            if f in 'xyz':
                continue
            filtered[f] = data[:,l][mask]
            print "filtered After", filtered[f]
        return filtered


def intoTheVoid(fileList, ID, pID, coords, n):
    """
    The name is silly, but the role it serves in not

    Recursive Halo tracker which follows the parent/descendant id of a Halo
    across a set of Halo-Files/Time Points.

    Returns a set of coordinates of a Halo's position over time
    """
    print len(fileList), ID, pID, len(coords), n
    if len(fileList) == 0:
        print "file is empty"
        return coords, n
    fn = fileList[0]
    halos = l2a( [ Halo(x) for x in tk.loadtxt(fn) ] )
    ids = l2a([x.id for x in halos])
    if ID is None:
        print ID, "is None"
        ID = ids[0]
    index = (ids == ID).nonzero()[0][0]
    if index < 0 or index is []:
        print "its -1!"
        return coords, n
    elif index > -1:
        tHl = halos[index]
        halo = {
            "time": n,
            "xyz": list(tHl.position),
            "rvir": tHl.rvir * (1./1000),  # radius, in mpc rather than kpc
            "rs": tHl.rs,   # scale radius
            "id": tHl.id,
            "child": tHl.desc_id,
            "particles": []}
        coords.append(halo)
        return intoTheVoid(fileList[1:], tHl.desc_id, tHl.id, coords, n+1)


def main():
    RAW = "../data"
    ROCKSTAR = op.join(RAW, "rockstar", "hlists", "hlist_[0-1].[0-9][0-9]000.*")
    PARTICLES = op.join(RAW, "ds14_scivis_0128", "ds14_scivis_0128_e4_dt04_[0-1].[0-9][0-9]00")
    hFiles = l2a(glob(ROCKSTAR))
    parts = l2a(glob(PARTICLES))

    print parts
    haloIDs = [257.,  259.,  260.,  263.,  265.,  129.,  131.,  132.,  133.,
               228.,  224.,  248.,  335.,  135.,  125.,  184.,  121.,  113.,
               318.,  300.,   75.,   76.,    5.,  340.,   80.,   82.,  245.,
               178.,  169.,   37.,  226.,   65.,   64.,  102.,  284.,  289.,
               286.,  126.,   62.,   22.,  174.,  163.,  341.,  342.,   69.,
               72.,  151.,  321.,  137.,   31.,   78.,   79.,    4.,  180.,
               74.,  179.,  272.,  283.,  247.,   36.,   71.,  199.,  290.]

    for i, hid in enumerate(haloIDs[0:1]):
        print "entering the void with", hid, i
        # intoTheVoid is recursive
        coords, n = intoTheVoid(hFiles, hid, -1, [], 0)
        # coords = l2a(coords)
        print coords

        outFileName = "_".join(["Halo", str(hid), 't'+str(i+12)])+".json"
        with open(outFileName, 'w') as outfile:
            outfile.write(json.dumps(coords))

        # jsonData = {}
        # for j, halo in enumerate(coords):
        #     print "touring the dark skys"
        #     fn = parts[j+10]
        #     print "fn is", fn, "time", (halo['time']+12) == (j+12), j
        #     Loader = SDFLoader(fn)
        #     halo['particles'] = Loader.get(halo['rvir'], halo['xyz'])
        #     print "Halo has", halo['particles'], "particles"
        #     jsonData[j+12] = halo
        #     for k in range(len(halo['particles'])):
        #         print halo['particles'],"-->",k
        #         pts = halo['particles'][k]
        #         halo['particles'] = a2l(pts)
        #     halo['particles'] = a2l(halo['particles'])
        #     print "jsonData[",j+12,"]", jsonData[j+12]

        # outFileName = "_".join(["Halo", str(hid), 't'+str(i+12)])+".json"
        # with open(outFileName, 'w') as outfile:
        #     json.dumps(jsonData, outfile)


if __name__ == '__main__':
    main()
