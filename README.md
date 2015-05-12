# SciVis Contest 2015 : Visualize the Universe
## Overview
Cosmological simulations are a cornerstone of our understanding of the Universe during its 13.7 billion year progression from small fluctuations that we see in the cosmic microwave background to today, where we are surrounded by galaxies and clusters of galaxies interconnected by a vast cosmic web.

---
Simulations of the formation of structure in the Universe typically simulate dark matter, a collision-less fluid, as a discretized set of particles that interact only gravitationally. Ensuring adequate mass resolution within a simulation requires a large number of particles -- typically on the scale of 1024^3, 2048^3, or even 10240^3 particles in the largest simulations. Developing visualizations for these particles, and perhaps more challengingly for the structures that they form through gravitational interaction and collapse, requires first identifying the structures, developing spatial or informatics representations of the components or the structures themselves, and then correlating these visualizations across time steps.

---
Typically, structures are identified through a semi-local process known as halo finding, wherein dark matter halos are identified either via local particle density estimation or through simple linking-length mechanisms. Within these halos, which may represent galaxies or clusters of galaxies, substructures are identified -- within a galaxy cluster, smaller halos may be identified which correspond to the location of galaxies. As these structures and substructures interact, merge, separate and grow, the structure of the Universe grows and changes with it. Visualizing the transitions that simulated halos undergo during the lifetime of the Universe can provide necessary inputs to understanding observations from next generation telescopes.

---
## The Data
There are three primary types of data that will be utilized in this years contest.
### Raw Particle data
The raw particle data is described by the following features

  1. a position vector
  2. velocity vector
  3. unique particle identifier.
  4. Approximately 100 snapshots in time

Each Temporal snapshots is stored in a single file in a format called [SDF](https://bitbucket.org/JohnSalmon/sdf). This format is composed of a human readable ASCII header followed by raw binary data.

---
### Data Dimensions
#### Dimension Bounds
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

---
## Action Plan
* Generate a list of 'paths' across time that a specific halo follows.
    * Do this for each halo
* Identify an area of interest which contains a relatively large number of halos
    * Generate single simulations that track only that halo of interest
* Trace their paths and potentially their interesections and interactions

---
## Progress
The first image is proof of concept image of flowlines generated from particle velocities extracted from the `ds14_scivis_0128_e4_dt04_1.0000` dataset. Data was converted to VTK XML format and visualized using Paraview
![Particle Velocity](Pics/ds14_scivis_0128_particle_velocity.png)
![Halos](Pics/halos.png)
![Halos and Particles](Pics/halos_and_particles.png)
![ds14_z Projection](Pics/ds14_scivis_0128_e4_dt04_1.0000_Projection_z_all_cic.png)

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