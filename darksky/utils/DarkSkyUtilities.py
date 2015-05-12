"""
==============================================================================
Program: useful.py
 Author: Kyle Reese Almryde

 Description: A series of classes and functions that are useful in their own
    right, but dont necessarily belong in the main application program file.

==============================================================================
"""
import numpy as np


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


class Halo(object):
    """
    Convenience class to wrap all these damn variables...
    input assumes something along the lines of the following
    loadtxt(prefix+"rockstar/hlists/hlist_1.00000.list", unpack=True)
    """
    def __delitem__(self, key):
        self.__delattr__(key)

    def __getitem__(self, key):
        return self.__getattribute__(key)

    def __setitem__(self, key, value):
        self.__setattr__(key, value)

    def __init__(self, halo, fname, pos):
        super(Halo, self).__init__()
        self.filename = fname
        self.pos = pos

        hlist = iter(halo)
        # Begin building values
        self.__setitem__("scale", hlist.next())
        self.__setitem__("id", hlist.next())
        self.__setitem__("desc_scale", hlist.next())
        self.__setitem__("desc_id", hlist.next())
        self.__setitem__("num_prog", hlist.next())
        self.__setitem__("pid", hlist.next())
        self.__setitem__("upid", hlist.next())
        self.__setitem__("desc_pid", hlist.next())
        self.__setitem__("phantom", hlist.next())
        self.__setitem__("sam_mvir", hlist.next())
        self.__setitem__("mvir", hlist.next())
        self.__setitem__("rvir", hlist.next())
        self.__setitem__("rs", hlist.next())
        self.__setitem__("vrms", hlist.next())
        self.__setitem__("mmp", hlist.next())
        self.__setitem__("scale_of_last_MM", hlist.next())
        self.__setitem__("vmax", hlist.next())
        self.__setitem__("x", hlist.next())
        self.__setitem__("y", hlist.next())
        self.__setitem__("z", hlist.next())
        self.__setitem__("xyz", np.array([self.x, self.y, self.z]))
        self.__setitem__("u", hlist.next())
        self.__setitem__("v", hlist.next())
        self.__setitem__("w", hlist.next())
        self.__setitem__("uvw", np.array([self.u, self.v, self.w]))
        self.__setitem__("Jx", hlist.next())
        self.__setitem__("Jy", hlist.next())
        self.__setitem__("Jz", hlist.next())
        self.__setitem__("Spin", hlist.next())
        self.__setitem__("Breadth_first_ID", hlist.next())
        self.__setitem__("Depth_first_ID", hlist.next())
        self.__setitem__("Tree_root_ID", hlist.next())
        self.__setitem__("Orig_halo_ID", hlist.next())
        self.__setitem__("Snap_num", hlist.next())
        self.__setitem__("Next_coprogenitor_depthfirst_ID", hlist.next())
        self.__setitem__("Last_progenitor_depthfirst_ID", hlist.next())
        self.__setitem__("Rs_Klypin", hlist.next())
        self.__setitem__("M_all", hlist.next())
        self.__setitem__("M200b", hlist.next())
        self.__setitem__("M200c", hlist.next())
        self.__setitem__("M500c", hlist.next())
        self.__setitem__("M2500c", hlist.next())
        self.__setitem__("Xoff", hlist.next())
        self.__setitem__("Voff", hlist.next())
        self.__setitem__("Spin_Bullock", hlist.next())
        self.__setitem__("b_to_a", hlist.next())
        self.__setitem__("c_to_a", hlist.next())
        self.__setitem__("A_x", hlist.next())
        self.__setitem__("A_y", hlist.next())
        self.__setitem__("A_z", hlist.next())
        self.__setitem__("b_to_a_500c", hlist.next())
        self.__setitem__("c_to_a_500c", hlist.next())
        self.__setitem__("A_x_500c", hlist.next())
        self.__setitem__("A_y_500c", hlist.next())
        self.__setitem__("A_z_500c", hlist.next())
        self.__setitem__("T_over_U", hlist.next())
        self.__setitem__("M_pe_Behroozi", hlist.next())
        self.__setitem__("M_pe_Diemer", hlist.next())
        self.__setitem__("Macc", hlist.next())
        self.__setitem__("Mpeak", hlist.next())
        self.__setitem__("Vacc", hlist.next())
        self.__setitem__("Vpeak", hlist.next())
        self.__setitem__("Halfmass_Scale", hlist.next())
        self.__setitem__("Acc_Rate_Inst", hlist.next())
        self.__setitem__("Acc_Rate_100Myr", hlist.next())
        self.__setitem__("Acc_Rate_Tdyn", hlist.next())

    def display(self, var=None):
        return """
        scale(0)
        id(1)
        desc_scale(2)
        desc_id(3)
        num_prog(4)
        pid(5)
        upid(6)
        desc_pid(7)
        phantom(8)
        sam_mvir(9)
        mvir(10)
        rvir(11)
        rs(12)
        vrms(13)
        mmp?(14)
        scale_of_last_MM(15)
        vmax(16)
        x(17)
        y(18)
        z(19)
        vx(20)
        vy(21)
        vz(22)
        Jx(23)
        Jy(24)
        Jz(25)
        Spin(26)
        Breadth_first_ID(27)
        Depth_first_ID(28)
        Tree_root_ID(29)
        Orig_halo_ID(30)
        Snap_num(31)
        Next_coprogenitor_depthfirst_ID(32)
        Last_progenitor_depthfirst_ID(33)
        Rs_Klypin(34)
        M_all(35)
        M200b(36)
        M200c(37)
        M500c(38)
        M2500c(39)
        Xoff(40)
        Voff(41)
        Spin_Bullock(42)
        b_to_a(43)
        c_to_a(44)
        A[x](45)
        A[y](46)
        A[z](47)
        b_to_a(500c)(48)
        c_to_a(500c)(49)
        A[x](500c)(50)
        A[y](500c)(51)
        A[z](500c)(52)
        T/|U|(53)
        M_pe_Behroozi(54)
        M_pe_Diemer(55)
        Macc(56)
        Mpeak(57)
        Vacc(58)
        Vpeak(59)
        Halfmass_Scale(60)
        Acc_Rate_Inst(61)
        Acc_Rate_100Myr(62)
        Acc_Rate_Tdyn(63)

        Omega_M = 0.295038; Omega_L = 0.704962; h0 = 0.688062
        Full box size = 62.500000 Mpc/h
        Scale: Scale factor of halo.
        ID: ID of halo (unique across entire simulation).
        Desc_Scale: Scale of descendant halo, if applicable.
        Descid: ID of descendant halo, if applicable.
        Num_prog: Number of progenitors.
        Pid: Host halo ID (-1 if distinct halo).
        Upid: Most massive host halo ID (only different from Pid in cases of
                sub-subs, or sub-sub-subs, etc.).
        Desc_pid: Pid of descendant halo (if applicable).
        Phantom: Nonzero for halos interpolated across timesteps.
        SAM_Mvir: Halo mass, smoothed across accretion history;
                  always greater than sum of halo masses of contributing
                  progenitors (Msun/h).  Only for use with select semi-analytic
                  models.
        Mvir: Halo mass (Msun/h).
        Rvir: Halo radius (kpc/h comoving).
        Rs: Scale radius (kpc/h comoving).
        Vrms: Velocity dispersion (km/s physical).
        mmp?: whether the halo is the most massive progenitor or not.
        scale_of_last_MM: scale factor of the last major merger
                          (Mass ratio > 0.3).
        Vmax: Maxmimum circular velocity (km/s physical).
        X/Y/Z: Halo position (Mpc/h comoving).
        VX/VY/VZ: Halo velocity (km/s physical).
        JX/JY/JZ: Halo angular momenta ((Msun/h) * (Mpc/h) * km/s (physical)).
        Spin: Halo spin parameter.
        Breadth_first_ID: breadth-first ordering of halos within a tree.
        Depth_first_ID: depth-first ordering of halos within a tree.
        Tree_root_ID: ID of the halo at the last timestep in the tree.
        Orig_halo_ID: Original halo ID from halo finder.
        Snap_num: Snapshot number from which halo originated.
        Next_coprogenitor_depthfirst_ID: Depthfirst ID of next coprogenitor.
        Last_progenitor_depthfirst_ID: Depthfirst ID of last progenitor.
        Rs_Klypin: Scale radius determined using Vmax and Mvir
                   (see Rockstar paper)
        M_all: Mass enclosed within the specified overdensity, including
               unbound particles (Msun/h)
        M200b--M2500c: Mass enclosed within specified overdensities (Msun/h)
        Xoff: Offset of density peak from average particle position
              (kpc/h comoving)
        Voff: Offset of density peak from average particle velocity
              (km/s physical)
        Spin_Bullock: Bullock spin parameter (J/(sqrt(2)*GMVR))
        b_to_a, c_to_a: Ratio of second and third largest shape ellipsoid axes
                        (B and C) to largest shape ellipsoid axis (A)
                        (dimensionless).
          Shapes are determined by the method in Allgood et al. (2006).
          (500c) indicates that only particles within R500c are considered.
        A[x],A[y],A[z]: Largest shape ellipsoid axis (kpc/h comoving)
        T/|U|: ratio of kinetic to potential energies
        M_pe_*: Pseudo-evolution corrected masses (very experimental)
        Consistent Trees Version 0.99.9.2 (RC2)
        Macc,Vacc: Mass and Vmax at accretion.
        Mpeak,Vpeak: Peak mass and Vmax over mass accretion history.
        Halfmass_Scale: Scale factor at which the MMP reaches 0.5*Mpeak.
        Acc_Rate_*: Halo mass accretion rates in Msun/h/yr.
                    Inst: instantaneous; 100Myr: averaged over past 100Myr,
                    Tdyn: averaged over past virial dynamical time.
        """
