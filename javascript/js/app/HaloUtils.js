/**
 * Created by krbalmryde on 7/9/15.
 */

"use strict";
/* ================================== *
 *          initHaloTree
 *  Our render function which renders
 *  the scene and its associated objects
 * ================================== */

function initHaloTree(url, firstTime) {

    console.log("initHaloTree!!", url, firstTime);

    // create halo Sphere components ahead of time to save memory;
    var targetSet = false;
    var sphereGeometry = new THREE.SphereGeometry(1, 32, 32);

    var sphereMaterial;
    var _materialsByPeriod = {}

    if (firstTime) {

        // Prepare our Global halo objects
        prepGlobalStructures();

    } else {

        // reset our Halo container objects
        resetGlobalStructures();

    }


    showSpinner(true);

    oboe(url)
        .node("!.*", function(halo, path) {

            halo.rs1 = (halo.rvir / halo.rs) * 0.01; // convenience keys, one divided by
            halo.rs2 = (halo.rvir * halo.rs); // the other multiplied
            halo.vec3 = THREE.Vector3(halo.x, halo.y, halo.z); // Convenience, make a THREE.Vector3
            halo.time = parseInt(halo.scale * 100) - 12;  // 12 is the offset

            // add Halos to list by ID
            HaloLUT[+halo.id] = halo;


            if (_materialsByPeriod.hasOwnProperty(halo.time))

                sphereMaterial = _materialsByPeriod[halo.time];

            else
                _materialsByPeriod[halo.time] = new THREE.MeshPhongMaterial({
                    color: colorKey(halo.time),
                    specular: colorKey(halo.time),
                    shininess: 40,
                    shading: THREE.SmoothShading,
                    vertexColors: THREE.VertexColors,
                    transparent: true,
                    // side: THREE.BackSide,  // Seems to be slowing things down a lot
                    opacity: 0.4
                });


            //console.log("\tinitHaloTree",typeof halo.id, halo.id, halo.time, firstTime);

            HaloLUT.length++;
            HaloLUT.min = (halo.time < HaloLUT.min) ? halo.time : HaloLUT.min
            HaloLUT.max = (halo.time > HaloLUT.max) ? halo.time : HaloLUT.max

            // **** Make some Spline Geometry ***
            createSphereGeometry(halo, sphereGeometry, sphereMaterial);


            if (!targetSet && (halo.time >= EPOCH_HEAD && halo.time <= EPOCH_TAIL)) {
                console.log("Ha got you fucker!", halo.time);
                targetSet = true;
                prevTarget = null;
                curTarget = {
                    object: sphereGroup.getObjectByName(halo.id)
                };
                curTarget.object.material.opacity = 0.7;
                DEFERRED = false;
                tweenToPosition(250, 250, true);
            }


            if (path[0] == 0 && firstTime) {

                // Load Data for Halo
                curTarget = {
                    object: sphereGroup.getObjectByName(+halo.id)
                }; // Trick camera

                // **** Lights! ***
                initLights();

                // **** Camera! ***
                initCamera();

                // **** Setup our Raycasting stuff ***
                initRayCaster();

                // **** Action! Listeners *** //
                initListeners();
            }

            return oboe.drop;

        })
        .done(function() {
            console.log("\tDone")
            showSpinner(false);
            createHaloLineGeometry();
            return oboe.drop;
        });
}

function initHaloMap(DATASET) {
    console.log("Init The Halo Map");
    var forestGeometry = new THREE.Geometry();

    for (var i = 0; i < DATASET.length; i++) {

        var _halo = DATASET[i];
        _halo.time = 1.0; // We know a priori that this is the last time period
        console.log(_halo);
        var particle = new THREE.Vector3();
        particle.x = _halo.position[0];
        particle.y = _halo.position[1];
        particle.z = _halo.position[2];

        particle.vx = _halo.velocity[0];
        particle.vy = _halo.velocity[1];
        particle.vz = _halo.velocity[2];

        particle.halo_id = _halo.id;
        particle.halo_time = _halo.time;

        forestGeometry.vertices.push(particle);
        //console.log("\tHalo.id ", halo.id, "Halo.scale",halo.scale, "Halo.time",halo.time);
    }
    var material = new THREE.PointCloudMaterial({
        color: rgbToHex(255, 0, 0),
        size: 0.5,
        blending: THREE.AdditiveBlending,
        transparent: true
    });

    pointCloud = new THREE.PointCloud(forestGeometry, material);
    scene.add(pointCloud);
    console.log(pointCloud);
}


function createSphereGeometry(halo, sphereGeometry, sphereMaterial) {
    // console.log("createSphereGeometry(",halo,")")
    var period = +halo.time;
    //    var color = colorKey(period)

    EPOCH_PERIODS[period].push(halo.id);
    var mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);

    // Add the halo's id to the mess so we can check it against the Halo ID map/LUT/Hash.
    mesh.visible = (period >= EPOCH_HEAD && period <= EPOCH_TAIL) ? config.showHalos : false;
    //    mesh.renderOrder = period;
    mesh.name = halo.id;
    mesh.period = +halo.time;
    mesh.rs1 = +halo.rs1;
    mesh.position.set(halo.x, halo.y, halo.z);
    mesh.scale.set(halo.rs1, halo.rs1, halo.rs1);
    mesh.updateMatrix();
    sphereGroup.add(mesh);
}   



/* ================================== *
 *          createHaloLineGeometry
 *  Geometry rendering function. Builds
 *  Our splines and spheres for each
 *  Halo object. Iterates over time
 *
 *  NB: A number of helper functions
 *  included below
 * ================================== */
function createHaloLineGeometry() {
    console.log("\tcreateHaloLineGeometry()");
    var periodTracker = {};
    var material = new THREE.LineBasicMaterial({
        color: rgbToHex(255, 255, 255),
        linewidth: 0.5,
        vertexColors: THREE.VertexColors,
        transparent: true,
        opacity: 0.5
    })

    var id, period;
    // We can use the sphereGroup to drive the line creation
    sphereGroup.children.forEach(function(mesh) {
        console.log("mesh", mesh.name);
        if (mesh) {            
            id = +mesh.name,
            period = +mesh.period;

            console.log("mesh", mesh.name, id, mesh.period, period);

            if (!periodTracker.hasOwnProperty(period))
                periodTracker[period] = new THREE.LineBasicMaterial({
                    color: rgbToHex(255, 255, 255),
                    linewidth: 0.5,
                    vertexColors: THREE.VertexColors,
                    transparent: true,
                    opacity: 0.5
                })
                // console.log("period", periodTracker, __traversed);
            material = periodTracker[period];
            if (!__traversed.hasOwnProperty(id)) {
                var points = intoTheVoid(+id, [], 0);
                console.log("\tnot been traversed", id, points.length, material)

                var mesh = createPathLine(points, id, period, material);
                linesGroup.add(mesh);
            }
        }
    });

    linesGroup.visible = false;
}

// Helper function
function intoTheVoid(id, points, steps) {
    console.log('\tintoTheVoid', typeof id, steps);
    var maxSteps = 1;
    var halo = HaloLUT[id]; // use the ID to pull the halo
    var desc_id = +halo.desc_id;
    points.push(halo.position);

    if (desc_id in HaloLUT && steps < maxSteps) {

        var next = HaloLUT[desc_id];

        if (desc_id in __traversed) {
            points.push(next.position);
            return points;
        } else {
            __traversed[id] = true;
            var nID = +next.id;
            return intoTheVoid(nID, points, steps + 1);
        }
    } else {
        //console.log("\t\thalo->id:",halo.id, "!= desc_id:", halo.desc_id);
        return points;
    }

}


function createPathLine(points, id, period, material) {
    console.log("createPathLine(points, id, period, ", points, typeof id, typeof period, material);
    // if points is defined at all...
    var color = colorKey(period);
    if (points && points.length > 1) {

        // console.log("creating PathLine!", period);
        var index, xyz;
        var colors = [];
        var numPoints = points.length * nDivisions;
        var spline = new THREE.Spline();
        var geometry = new THREE.Geometry();
        // spline.initFromArray(points);
        spline.initFromArray(points);

        for (var i = 0; i <= numPoints; i++) {
            index = i / numPoints;
            xyz = spline.getPoint(index);

            geometry.vertices[i] = new THREE.Vector3(xyz.x, xyz.y, xyz.z);
            colors[i] = new THREE.Color(color);
        }

        console.log(geometry);
        geometry.colors = colors;
        geometry.computeLineDistances();

        var mesh = new THREE.Line(geometry, material);
        mesh.visible = (period >= EPOCH_HEAD && period < EPOCH_TAIL) ? true : false;
        mesh.name = id;
        mesh.period = period;
        mesh.renderOrder = 100;
        return mesh;
        // linesGroup.add(mesh);
        // console.log(mesh);
    }
    // return null;
}


/* ================================== *
 *          updateAllTheGeometry
 *  Redraws the Splines for the paths
 *  and turns sphere opacity on or off
 * ================================== */
function updateAllTheGeometry() {

    if (config.enableSelection) {

        toggleVisibility(HaloBranch, config.showPaths, 0.5);
        toggleVisibility(HaloSelect, config.showHalos, 0.05);

    } else {

        displayHalos();
    }
}


// given a clicked Halo id, traverse the tree with the given halo.

function intoTheAbyss(id, period, points) {

    var halo = HaloLUT[id]; // use the ID to pull the halo
    points.push(halo.position);
    HaloSelect[id] = id;
    sphereGroup.getObjectByName(id).visible = (period >= EPOCH_HEAD && period < EPOCH_TAIL) ? config.showHalos : false;
    //points.push([halo.x,halo.y,halo.z,halo.id,halo.desc_id]); // for debugging purposes

    //if (halo.desc_id in HaloLUT && halo.time < EPOCH_TAIL) {

    if (halo.desc_id in HaloLUT && period < EPOCH_TAIL) {

        var next = HaloLUT[halo.desc_id];

        if (halo.desc_id in __traversed) {

            points.push(next.position);
            return points;
        } else {
            __traversed[halo.id] = true;
            return intoTheAbyss(next.id, next.time, points);
        }
    } else {
        //console.log("\t\thalo->id:",halo.id, "!= halo.desc_id:", halo.desc_id);
        return points;
    }
}

function traceBackPath(id, period, points) {

}


function createSpline(points, id, period) {

    // if points is defined at all...
    if (points && points.length > 1) {

        //console.log("creating PathLine!", period);
        var index, xyz;
        var colors = [];
        var spline = new THREE.Spline();
        var numPoints = points.length * nDivisions;

        var splineGeometry = new THREE.Geometry();

        spline.initFromArray(points);
        for (var i = 0; i <= numPoints; i++) {

            index = i / numPoints;
            xyz = spline.getPoint(index);
            splineGeometry.vertices[i] = new THREE.Vector3(xyz.x, xyz.y, xyz.z);

            // this should give us an accurate color..I think
            colors[i] = new THREE.Color(colorKey(index * points.length + period));

        }
        splineGeometry.colors = colors;
        splineGeometry.computeBoundingSphere();

        var material = new THREE.LineBasicMaterial({
            color: rgbToHex(255, 255, 255),
            linewidth: 2,
            vertexColors: THREE.VertexColors,
            transparent: true,
            opacity: 0.5
        });

        var mesh = new THREE.Line(splineGeometry, material);
        mesh.halo_id = id;
        mesh.halo_period = period;
        HaloBranch[id] = mesh;
        linesGroup.add(mesh);
    }
}


function resetHaloBranchs() {

    for (var id in HaloSelect) {

        console.log("HaloBranch", id, typeof id)
        if (id in HaloBranch) {
            linesGroup.remove(HaloBranch[id]);
            linesGroup.getObjectByName(id).material.dispose();
            linesGroup.getObjectByName(id).geometry.dispose();
        }
        delete HaloSelect[id]
    }
    HaloSelect = {};
    HaloBranch = {};
    __traversed = {};

}


function prepGlobalStructures() {

    console.log("calling prepGlobalStructures()!");
    HaloBranch = {};
    __traversed = {};
    // just to keep track of how many objects we have
    // Has a length component so we know how many halos there are
    // The min and Max components represent the min/max time in dataset
    //  min is set to maximum time periods, while max is set to zero so we
    //  can ensure we get an accurate representation of the halos time frame
    HaloLUT = {
        length: 0,
        min: NUMTIMEPERIODS,
        max: 0
    };

    EPOCH_PERIODS = [];
    for (var i = 0; i < NUMTIMEPERIODS; i++) {

        EPOCH_PERIODS[i] = [];
    }
}

function resetGlobalStructures() {
    console.log("calling resetGlobalStructures()!");
    var id;
    for (id in HaloLUT) {
        //console.log("\t",typeof id, id);
        id = parseInt(id);
        if (linesGroup.getObjectByName(+id)) {
            var line = linesGroup.getObjectByName(+id)

            linesGroup.remove(line);

            line.getObjectByName(+id).geometry.dispose();
            line.getObjectByName(+id).material.dispose();
        }

        if (sphereGroup.getObjectByName(+id)) {
            //console.log("\tsphere",typeof id, id);
            var mesh = sphereGroup.getObjectByName(+id);

            sphereGroup.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
            //delete sphereGroup.getObjectByName(id);
        }
        if (id !== "length" && id !== "max" && id !== "min") {
            delete HaloLUT[id];
            HaloLUT.length--;
        }
    }
    //sphereGroup.dispose();
    //linesGroup.dispose();
    console.log("\t", sphereGroup.children, linesGroup.children, scene, HaloLUT);
    prepGlobalStructures();
}