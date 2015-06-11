# ./examples/load_data.py
# Required libraries:
# pip install sdfpy
# pip install thingking

import math
import numpy as np
from sdfpy import load_sdf
from thingking import loadtxt

# offset = 535
# sub = 50
# foo = [490, 450, 415, 384, 335, 316, 297, 280, 265, 253]
# for i, time in enumerate(np.arange(0.12, 1.01, 0.01)):
print "time, h_x, h_y, h_z, p_x, p_y, p_z"
for i, time in enumerate(np.arange(0.12,1.01,0.01)):

    # if i < len(foo):
    offset = 0
    # sub -= 5
    # offset -= sub
    if len(str(time)) == 3:
        time = str(time)+'0'
    else:
        time = str(time)

    # offset -= math.log(i+2) * 55
    # print time, offset, sub
    # prefix = "http://darksky.slac.stanford.edu/scivis2015/data/ds14_scivis_0128/"
    prefix = "../data/"
    # Load N-body particles from a = 1.0 dataset. Particles have positions with
    # units of proper kpc, and velocities with units of km/s.
    particles = load_sdf(prefix+"ds14_scivis_0128/ds14_scivis_0128_e4_dt04_" + time + "00")

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
        loadtxt(prefix+"rockstar/hlists/hlist_" + time + "000.list", unpack=True)

    # Now we want to convert the proper kpc of the particle position to comoving
    # Mpc/h, a common unit used in computational cosmology in general, but
    # specifically is used as the output unit in the merger tree halo list loaded
    # in above. First we get the Hubble parameter, here stored as 'h_100' in the
    # SDF parameters. Then we load the simulation width, L0, which is also in
    # proper kpc. Finally we load the scale factor, a, which for this particular
    # snapshot is equal to 1 since we are loading the final snapshot from the
    # simulation.
    h_100 = particles.parameters['h_100']
    width = particles.parameters['L0']
    cosmo_a = particles.parameters['a']
    kpc_to_Mpc = 1./1000
    sl = slice(0,None)

    # Define a simple function to convert proper to comoving Mpc/h.
    # convert_to_cMpc = lambda proper: (proper + width/2.) * h_100 * kpc_to_Mpc / cosmo_a
    # conversion2: convert_to_cMpc = lambda proper: proper * h_100 * kpc_to_Mpc / cosmo_a
    # conversion3: convert_to_cMpc = lambda proper: (proper/2.) * h_100 * kpc_to_Mpc / 1.0
    # conversion4: convert_to_cMpc = lambda proper: (proper + width/2.) * h_100 * kpc_to_Mpc
    # conversion5: convert_to_cMpc = lambda proper: (proper ) * h_100 * kpc_to_Mpc
    # conversion6: convert_to_cMpc = lambda proper: proper * h_100
    # conversion7: convert_to_cMpc = lambda proper: (proper * h_100) * cosmo_a
    # conversion8: convert_to_cMpc = lambda proper: (proper * h_100) * kpc_to_Mpc
    # conversion9: convert_to_cMpc = lambda proper: (proper * h_100) * (kpc_to_Mpc / cosmo_a)
    # conversion10: convert_to_cMpc = lambda proper: (kpc_to_Mpc /(proper * h_100)) * cosmo_a
    # conversion11: convert_to_cMpc = lambda proper: (proper + width) * h_100 * kpc_to_Mpc / cosmo_a
    # conversion12: convert_to_cMpc = lambda proper: proper * kpc_to_Mpc / cosmo_a
    # conversion13: convert_to_cMpc = lambda proper: proper * (kpc_to_Mpc / cosmo_a)
    # convert_to_cMpc = lambda proper: ((proper + width) * h_100 * kpc_to_Mpc / cosmo_a) - offset
    convert_to_cMpc = lambda proper: ((proper + width) * h_100 * kpc_to_Mpc / cosmo_a)

    # print "halo X", x.min(), x.max()
    # print "halo Y",y.min(), y.max()
    # def convert_to_cMpc(proper) :
    #     print proper.min(), proper.max()
    #     print "\nwidth", width
    #     print "h_100", h_100
    #     print "kpc_to_Mpc", kpc_to_Mpc
    #     # print "cosmo_a", cosmo_a
    #     return (proper + width) * h_100 * kpc_to_Mpc / cosmo_a

    # x = l2a(particles['x'])
    # y = l2a(particles['y'])
    # z = l2a(particles['z'])

    # x_kpc_min = x.min()
    # y_kpc_min = y.min()
    # z_kpc_min = z.min()

    # x_kpc_max  = x.max()
    # y_kpc_max  = y.max()
    # z_kpc_max  = z.max()

    # x_mpc_min = convert_to_cMpc(x_kpc_min)
    # y_mpc_min = convert_to_cMpc(y_kpc_min)
    # z_mpc_min = convert_to_cMpc(z_kpc_min)

    # x_mpc_max = convert_to_cMpc(x_kpc_max)
    # y_mpc_max = convert_to_cMpc(y_kpc_max)
    # z_mpc_max = convert_to_cMpc(z_kpc_max)

    # x_halo_min, y_halo_min, z_halo_min = x.min(), y.min(), z.min()
    # x_halo_max, y_halo_max, z_halo_max = x.max(), y.max(), z.max()

    # print "\n\nProper XYZ_Min, {0}, {1}, {2}".format(x_kpc_min, y_kpc_min, z_kpc_min)
    # print "Proper XYZ_Max, {0}, {1}, {2}".format(x_kpc_max, y_kpc_max, z_kpc_max)
    # print "\ncomoving XYZ_Min, {0}, {1}, {2}".format(x_mpc_min, y_mpc_min, z_mpc_min)
    # print "comoving XYZ_Max, {0}, {1}, {2}".format(x_mpc_max, y_mpc_max, z_mpc_max)
    # print "\nHalo XYZ min, {0}, {1}, {2}".format(x_halo_min, y_halo_min, z_halo_min)
    # print "Halo XYZ max, {0}, {1}, {2}".format(x_halo_max, y_halo_max, z_halo_max)

    # print "Halo position, {0}, {1}, {2}".format(x[0], y[0], z[0])
    # Plot all the particles, adding a bit of alpha so that we see the density of
    # points.
    # import matplotlib.pylab as pl
    # pl.figure(figsize=[10,10])

    x_min = convert_to_cMpc(particles['x'][sl]).min()
    y_min = convert_to_cMpc(particles['y'][sl]).min()
    z_min = convert_to_cMpc(particles['z'][sl]).min()
    x_offset = abs(x.min() - x_min);
    y_offset = abs(y.min() - y_min);
    z_offset = abs(z.min() - z_min);

    print time, x_offset, y_offset, z_offset
    # pl.scatter(convert_to_cMpc(particles['x'][sl])-x_offset,
    #            convert_to_cMpc(particles['y'][sl])-y_offset, color='b', s=1.0, alpha=0.05)

    # # Plot all the halos in red.
    # pl.scatter(x, y, color='r', alpha=0.1)

    # # Add some labels
    # pl.xlabel('x [cMpc/h]')
    # pl.ylabel('y [cMpc/h]')
    # # pl.savefig("halos_and_particles_"+time+".png", bbox_inches='tight')
    # pl.savefig("halos_and_particles_"+time+"_conversion-"+str(offset)+".png", bbox_inches='tight')

    # Could now consider coloring halos by any of the various quantities above.
    # Perhaps mvir would be nice to show the virial Mass of the halo, or we could
    # scale the points by the virial radius, rvir.