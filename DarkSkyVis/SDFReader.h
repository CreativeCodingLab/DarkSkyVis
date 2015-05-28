//
// Created by Kyle Reese Almryde on 5/22/15.
// Copyright (c) 2015 KrbAlmryde. All rights reserved.
//


#ifndef __SDFReader_H_
#define __SDFReader_H_

#include "SDF.h"
#include "utils.h"
#include <stdio.h>
#include <vector>
#include <string.h>

using namespace std;


class SDFReader {
public:
    SDF *sdfp;
    int64_t nrecs = 10; //2097152;

    int *arrcnt;  // This is the number of values associated with an element, ie if x was x[3], it would be 3
                  // However it is almost certainly 1 for everything, so this may be unnecessary
    int *strides; // Is an array containing the size of the type of element
    int *nread;   // Declares how many of a particluar type to read...since we want to read everything, this is
                  // most likely useless...

    int numKeys = 8;
    char*keys[8] = {"ident", "x", "y", "z", "vx", "vy", "vz", "phi"};
    enum SDF_type_enum *types;


    SDFReader(char* fname);
    ~SDFReader();

    void checkForErrors(SDF *fp, char *fname);
    void mallocateAllTheThings();

protected:
    float h_100, L0, cosmo_a;
    float kpc_to_Mpc = 1.0/1000;
    vector<float> params = { h_100, L0, cosmo_a };
    vector<string> paramKeys = { "h_100", "L0", "a" };

    void toCoMoving(float &proper);
};



#endif //__SDFReader_H_
