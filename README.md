## Things I am working on
So it turns out using SDF's data loader is A LOT faster to process the data arrays due to its use of numpy's memmap function. Effectively, it is indexing into the binary file object, rather than loading the whole thing into memory. This way its only ever holding a small subset of the actual data, and swapping it out as it needs. The added benefit is that it is treated and behaves like any other numpy object, so *most* operations should be similar if not identical.

After doing a preliminary run, I discovered that SDF not only generates the same results, but it also renders the vtk instance in under ~30 seconds! That 75% reduction in rendering time!! The limitation is that the SDF data does have all the super cool derived fields pre-built for me, so Ill have to generate those myself.

---
Presently I am looking into extracting the Velocity Magnitude from the SDF dataset. We know the velocity, so it shouldnt be an issue...

While I think our visualization idea is wicked super cool, and for my own learning Ill implement it, I think it would be good to at least talk with an Astronomer. If only to get some of this data put into perspective. There are so many variables and values associated with the particle and halo data thats just going to waste because I dont understand what it's significance is. I think we are missing out on a really sweet opportunity to show off the data in a cool way.


With regards to tasks, I do know that the SciVis contest asks that we try to understand the substructure of a Halo, that is the composition of particles that make up an entity that is a Halo. The obvious solution I had was to filter the particles based on the width/mass of a particular Halo, then do something like an RK4 integration using the particles velocity to get a sense of how the Halo might be behaving. For example maybe the Halo has begun to generate its own gravity and the particles are moving in a circular/orbital like manner around some point, or maybe the structure is unstable and its decomposing over time so the streamlines are moving outward....oh the possibilities!)

The practical benefit of this technique would be to reduce the number of particles we are interacting with, which would reduce the memory load etc. I also did a little digging and found out that VTK has some limited support for parallel processing! As of v6.1 there are at least a few core components with VTK that are parallelize-able which would speed things up considerably!

If you are around today maybe we can meet to talk a little bit about what Ive been thinking. There is still a lot of low level visualization stuff I want/need to do before I even start to think about GUIs and Analytic systems, but Id at least like to get them out of my head and on the table so we are all on the same page.


## Progress
### Round2
Following the initial proof of concepts and playing with the functionality of YT and Paraview, I ended up settling (almost by accident) on VTK. In particular, I decided that while Volume Rendering and Volume Compositiing are neat, that is not the direction I want to go with this visualization.
![Dark Matter Particle Cloud Normed-Phi values](images/progress/round2/DarkSkyParticlePhi-Normed2.png)
![Dark Matter Particle Cloud Velocity Magnitude](images/progress/round2/DarkSkyParticleMagnitudeCube.png)
![Dark Matter Particle TS Cube 20 Samples](images/DarkSkyTimeBox6.png)
![Dark Matter Particle TS Cube 99 Samples](images/DarkSkyTimeBox9.png)

---
### Round1
The first image is proof of concept image of flowlines generated from particle velocities extracted from the `ds14_scivis_0128_e4_dt04_1.0000` dataset. Data was converted to VTK XML format and visualized using Paraview
![Particle Velocity](images/progress/round1/ds14_scivis_0128_particle_velocity.png)
![Halos](images/progress/round1/halos.png)
![Halos and Particles](images/progress/round1/halos_and_particles.png)
![ds14_z Projection](images/progress/round1/ds14_scivis_0128_e4_dt04_1.0000_Projection_z_all_cic.png)
