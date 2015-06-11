/************************************************************************
*
* DarkSkyVis.mm
*
* Kyle Reese Almryde
*
* Helpful Links and References:
*   https://bitbucket.org/JohnSalmon/sdf/src
*
* Visualize the Universe and the Halos and Dark Matter that inhabit it
*
*
*************************************************************************/


#import <Aluminum/Aluminum.h>
#include "SDF.h"
#include "utils.h"
#include <stdio.h>

using namespace aluminum;
using namespace glm;
using namespace std;


struct particle {
    float x, y, z;
    float vx, vy, vz;
    float phi, mag;
    int64_t id;
};

struct halo {
    int64_t id;
    float x, y, z;
    float radius, mass;
    int num_p;
    particle *particles;
    halo parent, child;
};


class DarkSkyVis : public RendererOSX {
    
public:

    // Converstion to CoMoving variables

    // Resource handler
    ResourceHandler rh;

    // Shader programs
    Program basicShader;

    // Our mesh to contain the point cloud in
    MeshBuffer cloudMB;

    const char *fname = "/Users/krbalmryde/Dropbox/Code-Projects/EVL/DarkSkyVis/data/ds14_scivis_0128/ds14_scivis_0128_e4_dt04_1.0000";

    
    void readSDFParams(SDF *sdfp, char* param, float &arg) {
        SDFgetfloat(sdfp, param, &arg);
    }
    
    void onCreate() {
        char *hdr = NULL;
        SDF *sdfp = SDFopen(NULL, fname);
        if( sdfp == NULL ){
            Error("Could not SDFopen(%s, %s): %s\n",
                  hdr?hdr:"<null>",
                  fname?fname:"<null>",
                  SDFerrstring);
        }
        
        // Read how many values of "x" there are in this file.
        int64_t nrecs = SDFnrecs("x", sdfp);
        printf("How many x: %lld\n", nrecs);
        
        //Setup the kiloParsec to CoMoving struct
        for (int i=0; i < cMpc.params.size(); i++) {
            readSDFParams(sdfp, (char *)cMpc.labels[i].c_str(), cMpc.params[i]);
            printf("Value of %s: %e\n", cMpc.labels[i].c_str(), cMpc.params[i]);
        }


        // Read the first n values of "x", "y", and "z".
        printf("Read the first n values of 'x', 'y', and 'z'\n");
        int64_t n = 10;
        
        // Storage for the types of x, y, z
        enum SDF_type_enum *types = (enum SDF_type_enum *)malloc(particle.size*sizeof(enum SDF_type_enum));
        // Get variable types
        for (int var=0; var< particle.size; var++){
            types[var] = SDFtype(particle.lables[var], sdfp);
        }
        
        // Storage for the array counts
        // If the SDF file had struct{float x[3]}, acnt for x would be 3. Probably
        // 1 for most arrays from the Dark Sky simulations.
        int *acnt = (int *)malloc(particle.size*sizeof(int));
        // Get variable counts if the variable is itself an array.
        for (int var=0; var< particle.size; var++){
            acnt[var] = SDFarrcnt(particle.lables[var], sdfp);
        }
        
        // Storage for the strides of x, y, z
        int *strides = (int *)malloc(particle.size*sizeof(int));
        // Set the strides for each of the variables
        for (int var=0; var< particle.size; var++){
            strides[var] = SDFtype_sizes[types[var]]*acnt[var];
        }
        
        // Declare how many of each variable to read. In this case, all are equal
        // to n.
        int *nread = (int *)malloc(particle.size*sizeof(int));
        for (int var=0; var< particle.size; var++){
            nread[var] = n;
        }

        // Allocate space for variables
        int64_t *id = (int64_t *)malloc(strides[0] * nread[0]);
        float *x = (float *)malloc(strides[1] * nread[1]);
        float *y = (float *)malloc(strides[2] * nread[2]);
        float *z = (float *)malloc(strides[3] * nread[3]);
        void *addrs[4] = {id, x, y, z};
        
        // Read the data
        SDFrdvecsarr(sdfp, particle.size, particle.lables, nread, addrs, strides);
        
        // Print it out
        for (int ii=0; ii<n; ii++){
            printf("id: %lld x: %e y: %e z: %e\n", id[ii], x[ii], y[ii], z[ii]);
        }
        
        // Now seek to the 1000th entry
        for(int j=0; j< particle.size; j++){
            SDFseek(particle.lables[j], 1000, SDF_SEEK_SET, sdfp);
        }
        
        // Read the data
        SDFrdvecsarr(sdfp, particle.size, particle.lables, nread, addrs, strides);
        
        // Print it out
        for (int ii=0; ii<n; ii++){
            printf("id: %lld x: %e y: %e z: %e\n", id[ii], x[ii], y[ii], z[ii]);
        }
        
        free(id);
        free(x);
        free(y);
        free(z);
        free(types);
        free(strides);
        free(acnt);
        free(nread);
    }

};


int main() {
    DarkSkyVis ds = DarkSkyVis();
    ds.start("Dark Sky Visualization", 0, 0, 512, 512);
    return 0;
}
