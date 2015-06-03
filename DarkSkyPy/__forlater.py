
def _shift_periodic(pos, left, right, domain_width):
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


xyz2 = np.array([ds['x'].copy(), ds['y'].copy(), ds['z'].copy()]).T