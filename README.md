## Important Notes
Particle position data is listed in `proper kpc/h` while the halo data is in `comoving Mpc/h` in order
to change this the following function can be used:

```python

h_100 = particles.parameters['h_100']
width = particles.parameters['L0']
cosmo_a = particles.parameters['a']
kpc_to_Mpc = 1. / 1000
sl = slice(0, None)

convert_to_cMpc = lambda proper: (proper + width/2.) * h_100 * kpc_to_Mpc / cosmo_a
```
Except this turns out the equation **is wrong**


```python
import numpy as np

h_100 = particles.parameters['h_100']
width = particles.parameters['L0']
cosmo_a = particles.parameters['a']
kpc_to_Mpc = 1. / 1000
sl = slice(0, None)

convert_to_cMpc = lambda proper: ((proper + width) * h_100 * kpc_to_Mpc / cosmo_a)

x_min = convert_to_cMpc(particles['x'][sl]).min()
y_min = convert_to_cMpc(particles['y'][sl]).min()
z_min = convert_to_cMpc(particles['z'][sl]).min()

x_offset = abs(halo_xyz_mins[0] - x_min);
y_offset = abs(halo_xyz_mins[1] - y_min);
z_offset = abs(halo_xyz_mins[2] - z_min);

positions = np.dstack([
        convert_to_cMpc(particles['x'][sl]) - x_offset,
        convert_to_cMpc(particles['y'][sl]) - y_offset,
        convert_to_cMpc(particles['z'][sl]) - z_offset
])[0]
```




Halo radius, __rvir__, is in kpc/h and must be converted to Mpc/h in order to correctly extract the
surrounding particles. This is as simple as doing `rvir * (1/1000.)`

## Stuff to look up later
The extract particles surrounding the halos radius get large very quickly as we
progress through time, this is probably a function of the halos getting larger
over time due to expansion, etc.

For early time points, its not a huge deal as the number of particles extracted
for the halo is small (only 7 at time 0) while for the last time point it spikes
to over 23,000! For the moment we dont care, we can just trace the particles
we care about and ignore the rest, Eventually we will need to do something about
it. For there [Oboe.js](http://oboejs.com/) may be an option.

coyote universe

which partilces move the most in the beginning

redshit approximation at time 0


## Things I am working on



---
So it turns out using SDF's data loader is A LOT faster to process the data arrays due to its use of numpy's memmap function. Effectively, it is indexing into the binary file object, rather than loading the whole thing into memory. This way its only ever holding a small subset of the actual data, and swapping it out as it needs. The added benefit is that it is treated and behaves like any other numpy object, so *most* operations should be similar if not identical.

After doing a preliminary run, I discovered that SDF not only generates the same results, but it also renders the vtk instance in under ~30 seconds! That 75% reduction in rendering time!! The limitation is that the SDF data does have all the super cool derived fields pre-built for me, so Ill have to generate those myself.

---
Presently I am looking into extracting the Velocity Magnitude from the SDF dataset. We know the velocity, so it shouldnt be an issue...

__Update:__ Calculating the Magnitude of a vector is easy (abs(sqrt(x^2 + y^2 + z^2))). The tricky part it turns out, is being able to understand the conversion factor. If I use sdfpy to load in the dataset, it treats velocity data as kpc/Gry aka Kiloparsecs/Gigayear while the YT data lists it as cm/s. Thats annoying because the conversion is not all that easy to come by (for someone with my small reptilian brain at any rate).

---
While I think our visualization idea is wicked super cool, and for my own learning Ill implement it, I think it would be good to at least talk with an Astronomer. If only to get some of this data put into perspective. There are so many variables and values associated with the particle and halo data thats just going to waste because I dont understand what it's significance is. I think we are missing out on a really sweet opportunity to show off the data in a cool way.


With regards to tasks, I do know that the SciVis contest asks that we try to understand the substructure of a Halo, that is the composition of particles that make up an entity that is a Halo. The obvious solution I had was to filter the particles based on the width/mass of a particular Halo, then do something like an RK4 integration using the particles velocity to get a sense of how the Halo might be behaving. For example maybe the Halo has begun to generate its own gravity and the particles are moving in a circular/orbital like manner around some point, or maybe the structure is unstable and its decomposing over time so the streamlines are moving outward....oh the possibilities!)

The practical benefit of this technique would be to reduce the number of particles we are interacting with, which would reduce the memory load etc. I also did a little digging and found out that VTK has some limited support for parallel processing! As of v6.1 there are at least a few core components with VTK that are parallelize-able which would speed things up considerably!
## Papers I am reading
[Seeing the Difference between Cosmological Simulations](https://steveharoz.com/research/cosmology/SeeingDiff-CGA.pdf)  This is a __GREAT__ paper published in 2008 that worked with a very similar dataset to the one I am currently working with.



## Helpful Definitions
There are a TON of scalars

Phi: Gravatational Potential
Acceleration
Velocity
Magnitude

## Progress
### Round2
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

---
### Round1
The first image is proof of concept image of flowlines generated from particle velocities extracted from the `ds14_scivis_0128_e4_dt04_1.0000` dataset. Data was converted to VTK XML format and visualized using Paraview
![Particle Velocity](images/progress/round1/ds14_scivis_0128_particle_velocity.png)
![Halos](images/progress/round1/halos.png)
![Halos and Particles](images/progress/round1/halos_and_particles.png)
![ds14_z Projection](images/progress/round1/ds14_scivis_0128_e4_dt04_1.0000_Projection_z_all_cic.png)
