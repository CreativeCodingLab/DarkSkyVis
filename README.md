## See it in Action
[https://www.evl.uic.edu/krbalmryde/projects/DarkSky/index.html](https://www.evl.uic.edu/krbalmryde/projects/DarkSky/index.html)

---
# SciVis Contest 2015 : Visualize the Universe
## Overview
Cosmological simulations are a cornerstone of our understanding of the Universe during its 13.7 billion year progression from small fluctuations that we see in the cosmic microwave background to today, where we are surrounded by galaxies and clusters of galaxies interconnected by a vast cosmic web.

---
Simulations of the formation of structure in the Universe typically simulate dark matter, a collision-less fluid, as a discretized set of particles that interact only gravitationally. Ensuring adequate mass resolution within a simulation requires a large number of particles -- typically on the scale of 1024^3, 2048^3, or even 10240^3 particles in the largest simulations. Developing visualizations for these particles, and perhaps more challengingly for the structures that they form through gravitational interaction and collapse, requires first identifying the structures, developing spatial or informatics representations of the components or the structures themselves, and then correlating these visualizations across time steps.

---
Typically, structures are identified through a semi-local process known as halo finding, wherein dark matter halos are identified either via local particle density estimation or through simple linking-length mechanisms. Within these halos, which may represent galaxies or clusters of galaxies, substructures are identified -- within a galaxy cluster, smaller halos may be identified which correspond to the location of galaxies. As these structures and substructures interact, merge, separate and grow, the structure of the Universe grows and changes with it. Visualizing the transitions that simulated halos undergo during the lifetime of the Universe can provide necessary inputs to understanding observations from next generation telescopes.

---
# The Data
There are three primary types of data that will be utilized in this years contest.

These datasets can be found here: [http://darksky.slac.stanford.edu/scivis2015/data/ds14_scivis_0128/](http://darksky.slac.stanford.edu/scivis2015/data/ds14_scivis_0128/)
## Raw Particle data
The raw particle data is described by the following features

  1. a position vector
  2. velocity vector
  3. unique particle identifier.
  4. Approximately 100 snapshots in time

Each Temporal snapshots is stored in a single file in a format called [SDF](https://bitbucket.org/JohnSalmon/sdf). This format is composed of a human readable ASCII header followed by raw binary data.

---
### Dimension Bounds
X  -45417.3867188, 45417.4101562

Y  -45417.3828125, 45417.3945312

Z  -45417.4140625, 45417.2773438



---
### Halo Catalog
Defines a database that groups sets of gravitationally bound particles together into coherent structures. It describes the following information about a Halo's structure, including:

  1. Position
  2. Shape
  3. Size

Additionally the following statistics are derived from the particle distribution:

  1. Angular momentum
  2. Relative concentration of the particles
  3. and many more.

These catalogs are stored in both ASCII and binary formats.

---
### Merger Tree database
The final dataset type links the individual halo catalogs that each represent a snapshot in time, thereby creating a Merger Tree database. These merger tree datasets form a sparse graph that can then be analyzed to use quantities such as halo mass accretion and merger history to inform how galaxies form and evolve through cosmic time. Merger tree databases are also distributed in both ASCII and BINARY formats.


##### Mad ravings about Merger Trees...
I get it now! The tree_0_0_0.dat is the actual merger tree. Starting from the LAST time point, 1.00000, it tracks EACH halo’s descendants and progenitors across the entire time series until we get to the first time step, in this case 0.12000.

It treats each entry in hlist_1.00000.list as a tree, thus creating a forest of 7497 trees. Again, each halo in hlist_1.0000, the last timepoint, has a tree. In the data file, it shows the scale factor next to the halo id, that scale factor is what Ive been using to represent the time point.

Not ALL timepoints are represented by every tree, rather, not ever root has an origin all the way back to timepoint 0.12, so only go as far as timepoint 0.90 in some cases. Regardless, Ive identified at least one tree that goes all the way back to time 0.12, Im still figuring out how they connect to each other etc, but Im making progress!

---
#### Helpful resources on Halos and how they are identified and organized
[http://web.cse.ohio-state.edu/~raghu/teaching/CSE5544/Visweek2012/vast/posters/takle.pdf](http://web.cse.ohio-state.edu/~raghu/teaching/CSE5544/Visweek2012/vast/posters/takle.pdf)

[http://astro.dur.ac.uk/~jch/password_pages/merger_trees.html](http://astro.dur.ac.uk/~jch/password_pages/merger_trees.html)

[http://coewww.rutgers.edu/www2/vizlab/node/84](http://coewww.rutgers.edu/www2/vizlab/node/84)

[http://inspirehep.net/record/1280894/plots?ln=en](http://inspirehep.net/record/1280894/plots?ln=en)

---
## Notes on Measurements
### Parsec
[Parsec](http://en.wikipedia.org/wiki/Parsec): (symbol: **pc**) is a unit of length used to measure the astronomically large distances to objects outside the Solar System, and is the largest unit of length in International System of Units. A parsec is equal to about 3.26 light-years (31 trillion miles) in length. **Fun Fact** Most of the visible stars to the naked eye are within 500 parsecs of the Sun. Or 15,500 trillion miles away! And you thought YOU had a long trip home...

#### Redshift
[Redshift](http://en.wikipedia.org/wiki/Redshift): Is any increase in wavelength, with a corresponding decrease and frequency of elextromagnetic waves. A redshift is, in effect, a measurement of (typically) light moving **AWAY** from an observer. However the definition changes depending on the context.

  * __Cosmological Redshift__: is due to the expansion of the universe, and sufficiently distant light sources show redshift corresponding
  * __Gravitational Redshift__:

#### Blueshift
[Blueshift](http://en.wikipedia.org/wiki/Blueshift): Is any decrease in wavelength, with a corresponding increase and frequency of elextromagnetic waves. This is the direct counter to **Redshift**


## Important Notes
Particle position data is listed in `proper kpc/h` while the halo data is in `comoving Mpc/h` in order
to change this the following function can be used:

Halo radius, __rvir__, is in kpc/h and must be converted to Mpc/h in order to correctly extract the
surrounding particles. This is as simple as doing `rvir * (1/1000.)`

## Stuff to look up later
For early time points, its not a huge deal as the number of particles extracted
for the halo is small (only 7 at time 0) while for the last time point it spikes
to over 23,000! For the moment we dont care, we can just trace the particles
we care about and ignore the rest, Eventually we will need to do something about
it. For that, [Oboe.js](http://oboejs.com/) may be an option.

coyote universe

which partilces move the most in the beginning

redshit approximation at time 0

### Note: This is Handy
```bash
  for i in ${files[*]}; do
    cat $i | python -mjson.tool > $i
  done
```
## Papers I am reading
[Behroozi, P. S., Wechsler, R. H., Wu, H. Y., Busha, M. T., Klypin, A. A., & Primack, J. R. (2013). Gravitationally consistent halo catalogs and merger trees for precision cosmology. The Astrophysical Journal, 763(1), 18.](http://arxiv.org/abs/1110.4370)
[Behroozi, P. S., Wechsler, R. H., & Wu, H. Y. (2013). The ROCKSTAR phase-space temporal halo finder and the velocity offsets of cluster cores. The Astrophysical Journal, 762(2), 109.](http://arxiv.org/abs/1110.4372)
[Klypin, A. A., Trujillo-Gomez, S., & Primack, J. (2011). Dark matter halos in the standard cosmological model: Results from the bolshoi simulation. The Astrophysical Journal, 740(2), 102.](http://arxiv.org/abs/1002.3660)
[Seeing the Difference between Cosmological Simulations](https://steveharoz.com/research/cosmology/SeeingDiff-CGA.pdf)  This is a __GREAT__ paper published in 2008 that worked with a very similar dataset to the one I am currently working with.

---
## Progress
### Round 1
The first image is proof of concept image of flowlines generated from particle velocities extracted from the `ds14_scivis_0128_e4_dt04_1.0000` dataset. Data was converted to VTK XML format and visualized using Paraview
![Particle Velocity](images/progress/round1/ds14_scivis_0128_particle_velocity.png)
![Halos](images/progress/round1/halos.png)
![Halos and Particles](images/progress/round1/halos_and_particles.png)
![ds14_z Projection](images/progress/round1/ds14_scivis_0128_e4_dt04_1.0000_Projection_z_all_cic.png)
---
### Round 2
Following the initial proof of concepts and playing with the functionality of YT and Paraview, I ended up settling (almost by accident) on VTK. In particular, I decided that while Volume Rendering and Volume Compositiing are neat, that is not the direction I want to go with this visualization.
![Dark Matter Particle Cloud Normed-Phi values](images/progress/round2/DarkSkyParticlePhi-Normed2.png)
![Dark Matter Particle Cloud Velocity Magnitude](images/progress/round2/DarkSkyParticleMagnitudeCube.png)
In order to produce a Point Cloud representation, we needed to extract the raw XYZ coordinates of the particles in question. To do this we used YT to access the "Dark Matter Particle Position". We then passed those coordinates to VTK which we used to render each point individually. Points were colored based on their z particle velocity value. In total, over 2million points are generated in this particular simulation.

---
####Into the Void

However, this was only a single point in time. The last point in time to be precise. While the visualization is interesting on its own, what we would really like to see is how it changes across time.

However, rather the perform a 2D composition of a single plane, we wanted to see it in 3D. To do that we composed an expanding bounding box Space-Time Cube of Space and Time...

We found that there was a approximately ~454.174/mPc expansion in terms of the dimensional bounds of each time point. In other words, the Universe was expanding at a rate of about ~454.174/Mpc in all directions.

Our approach then was to extract a subset of each time step with an expanding boundary box which begins at the boundary of the previous time point, and extended to the boundary of the current time point.

This required iterating over each ds14_scivis_0128_e4_dt04_[01].[0-9][0-9]00 file, 100 in total, and extracting on the order of several millions of particles. This is where MPI and BlueWaters comes in handy.

By distributing each file and desired bounds to a separate process, we could extract only those point coordinates that we were interested in, in parallel, speeding up the processes significantly. Since the coordinates all fell within unique ranges, the order in which we received them is unimportant.
![Dark Matter Particle TS Cube 20 Samples](images/DarkSkyTimeBox6.png)
![Dark Matter Particle TS Cube 99 Samples](images/DarkSkyTimeBox9.png)
