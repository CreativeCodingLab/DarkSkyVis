import vtk
import time
import numpy as np
import sdfpy as sdf
from glob import glob
import thingking as tk  # loadtxt
from itertools import imap
from utils.vtkDarkSkyUtilities import Halo, SDFLoader, l2a


def gatherHalos(fileList, ID, coords, n):
    """
    The name is silly, but the role it serves in not

    Recursive Halo tracker which follows the parent/descendant id of a Halo
    across a set of Halo-Files/Time Points.

    Returns a set of coordinates of a Halo's position over time
    """
    print len(fileList), ID, len(coords), n
    if len(fileList) == 0:
        print "file is empty"
        return coords, n
    fn = fileList[0]
    halos = l2a([Halo(x) for x in tk.loadtxt(fn)])
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
        # print details
        print index, fn, tHl.id, tHl.desc_id, tHl.pid, n
        xyzR = [tHl.x, tHl.y, tHl.z, tHl.rvir]
        # mrs = tHl.mvir, tHl.rvir, tHl.rs   # halo mass, radius, & scale radius
        coords.append(xyzR)
        return intoTheVoid(fileList[1:], tHl.desc_id, coords, n+1)


def filter_sphere(pos, center, radius, domain_width):
    pass



def main():
    PATds = "../data/ds14_scivis_0128/ds14_scivis_0128_e4_dt04_[01].[0-9][0-9]00"
    PATrs = "../data/rockstar/hlists/hlist_[01].[0-9][0-9]*.list"
    dsLoader = SDFLoader(True)  # Yes, convert to comoving

    dsFiles = glob(PATds)[10:]  # Skip the first 10 since we dont have halos to match
    rsFiles = glob(PATrs)

    hID = 257.
    coords, n = gatherHalos(rsFiles, hID, [], 0)



if __name__ == '__main__':
    main()




'''
# What am I trying to do?
1) Identify a halo at time-0
    a) get its xyz coords
    b) get its mass
    c) get its radius
    d) get its child-id

2) Identify particles which surround Identified Halo at time-0
    a) Filter particles that do not fall within the radius of the halo
    b) get their xyz coords
    c) get their id
    d) get their phi (gravitational potential) scalar
    e) get their uvw coords
    f) get their acceleration vector
    f) compute their uvw magnitude




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

'''