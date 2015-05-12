import matplotlib.pylab as pl
from sdfpy import load_sdf
from thingking import loadtxt

prefix = "../../../data/ds14_scivis_0128/"
# Load N-body particles from a = 1.0 dataset. Particles have positions with
# units of proper kpc, and velocities with units of km/s.
particles = load_sdf(prefix+"ds14_scivis_0128_e4_dt04_1.0000")

# Load the a=1 Rockstar hlist file. The header of the file lists the useful
# units/information.
scale, id, desc_scale, desc_id, num_prog, pid, upid, desc_pid, phantom, \
    sam_mvir, mvir, rvir, rs, vrms, mmp, scale_of_last_MM, vmax, x, y, z, \
    vx, vy, vz, Jx, Jy, Jz, Spin, Breadth_first_ID, Depth_first_ID, \
    Tree_root_ID, Orig_halo_ID, Snap_num, Next_coprogenitor_depthfirst_ID, \
    Last_progenitor_depthfirst_ID, Rs_Klypin, M_all, M200b, M200c, M500c, \
    M2500c, Xoff, Voff, Spin_Bullock, b_to_a, c_to_a, A_x, A_y, A_z, \
    b_to_a_500c, c_to_a_500c, A_x_500c, A_y_500c, A_z_500c, T_over_U, \
    M_pe_Behroozi, M_pe_Diemer, Macc, Mpeak, Vacc, Vpeak, Halfmass_Scale, \
    Acc_Rate_Inst, Acc_Rate_100Myr, Acc_Rate_Tdyn = \
    loadtxt(prefix+"rockstar/hlists/hlist_1.00000.list", unpack=True)

# Now we want to convert the proper kpc of the particle position to comoving
# Mpc/h, a common unit used in computational cosmology in general, but
# specifically is used as the output unit in the merger tree halo list loaded
# in above. First we get the Hubble parameter, here stored as 'h_100' in the
# SDF parameters. Then we load the simulation width, L0, which is also in
# proper kpc. Finally we load the scale factor, a, which for this particular
# snapshot is equal to 1 since we are loading the final snapshot from the
# simulation.
sl = slice(0, None)


# Define a simple function to convert proper to comoving Mpc/h.
def convert_to_cMpc(proper):
    h_100 = particles.parameters['h_100']
    width = particles.parameters['L0']
    cosmo_a = particles.parameters['a']
    kpc_to_Mpc = 1./1000
    return (proper + width/2.) * h_100 * kpc_to_Mpc / cosmo_a

# Plot all the particles, adding a bit of alpha so that we see the density of
# points.
pl.figure(figsize=[10, 10])

# pl.scatter(convert_to_cMpc(particles['x'][sl]),
#            convert_to_cMpc(particles['y'][sl]), color='b', s=1.0, alpha=0.05)

# Plot all the halos in red.
pl.scatter(x, y, color='r', alpha=0.1)

# Add some labels
pl.xlabel('x [cMpc/h]')
pl.ylabel('y [cMpc/h]')
pl.savefig("halos.png", bbox_inches='tight')

# Could now consider coloring halos by any of the various quantities above.
# Perhaps mvir would be nice to show the virial Mass of the halo, or we could
# scale the points by the virial radius, rvir.
