//
// Created by Kyle Reese Almryde on 5/22/15.
// Copyright (c) 2015 KrbAlmryde. All rights reserved.
//

#include "SDFReader.h"


SDFReader::SDFReader(char *fname) {
    sdfp = SDFopen(NULL, fname);
    checkForErrors(sdfp, fname);
    mallocateAllTheThings();

    for (int i=0; i<numKeys; i++) {
        types[i] = SDFtype(keys[i], sdfp);
        arrcnt[i] = SDFarrcnt(keys[i], sdfp);
        {
            printf("arrcnt %d\n", arrcnt[i]);
        }

        strides[i] = SDFtype_sizes[types[i]]*arrcnt[i];
        nread[i] = nrecs;
    }

}

void SDFReader::checkForErrors(SDF *fp, char *fname) {
    if( fp == NULL ){
        Error("Could not SDFopen(NULL, %s): %s\n",
                fname?fname:"<null>",
                SDFerrstring);
    }
}

void SDFReader::mallocateAllTheThings() {
    types = (enum SDF_type_enum *)malloc(numKeys *sizeof(enum SDF_type_enum));
    arrcnt = (int *)malloc(numKeys *sizeof(int));
    strides = (int *)malloc(numKeys *sizeof(int));
    nread = (int *)malloc(numKeys *sizeof(int));
//    id = (int64_t *)malloc(strides[0] * nread[0]);
//    x = (float *)malloc(strides[1] * nread[1]);
//    y = (float *)malloc(strides[2] * nread[2]);
//    z = (float *)malloc(strides[3] * nread[3]);
}
