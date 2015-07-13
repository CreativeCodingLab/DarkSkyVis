/**
 * Created by krbalmryde on 7/9/15.
 */

/* ================================== *
 *          initHaloTree
 *  Our render function which renders
 *  the scene and its associated objects
 * ================================== */
function initHaloTree(halo, firstTime) {

    halo.rs1 = (halo.rvir / halo.rs);  // convenience keys, one divided by
    halo.vec3 = THREE.Vector3(halo.x, halo.y, halo.z);  // Convenience, make a THREE.Vector3
    halo.time = parseInt(halo.scale * 100) - 12;
    halo.rs2 = (halo.rvir * halo.rs);  // the other multiplied

    // add Halos to list by ID
    HaloLUT[halo.id] = halo;

    console.log("\tinitHaloTree",halo.id, halo.time, firstTime);

    HaloLUT.length++;
    HaloLUT.min = (halo.time < HaloLUT.min) ? halo.time : HaloLUT.min
    HaloLUT.max = (halo.time > HaloLUT.max) ? halo.time : HaloLUT.max

   // **** Make some Spline Geometry ***
    createSphereGeometry(halo);

    if (firstTime)
        curTarget = {object: sphereGroup.getObjectByName(halo.id)}; // Trick camera

    console.log("\tinitHaloTree",halo.id, halo.time, firstTime);
}


function initHaloMap(DATASET) {
    console.log("Init The Halo Map");
    var forestGeometry = new THREE.Geometry();

    for (var i = 0; i < DATASET.length; i++) {

        var _halo = DATASET[i];
        _halo.time = 1.0;  // We know a priori that this is the last time period
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
    var material = new THREE.PointCloudMaterial( {
        color: rgbToHex(255,0,0),
        size: 0.5,
        blending: THREE.AdditiveBlending,
        transparent: true
    });

    pointCloud = new THREE.PointCloud( forestGeometry, material );
    scene.add(pointCloud);
    console.log(pointCloud );
}


function createSphereGeometry(halo) {
    // console.log("createSphereGeometry(",halo,")")
    var period = halo.time;
    var color = colorKey(period)

    EPOCH_PERIODS[period].push(halo.id);

    var mesh = new THREE.Mesh(
        new THREE.SphereGeometry(halo.rs1 * 0.01, 15, 15),
        new THREE.MeshPhongMaterial({
            color: color,
            specular: rgbToHex(255,255,255),
            shininess: 10,
            shading: THREE.SmoothShading,
            vertexColors: THREE.VertexColors,
            transparent: true,
            // side: THREE.BackSide,  // Seems to be slowing things down a lot
            opacity: 0.4
        })
    );

    // Add the halo's id to the mess so we can check it against the Halo ID map/LUT/Hash.
    mesh.visible = (period >= EPOCH_HEAD && period <= EPOCH_TAIL)? config.showHalos : false;
    mesh.renderOrder = period;
    mesh.name = halo.id;
    mesh.halo_id = halo.id;
    mesh.halo_period = halo.time;
    mesh.position.set( halo.x, halo.y, halo.z);
    mesh.updateMatrix();
    sphereGroup.add(mesh);
    //console.log("created Halosphere", halo.id, index, HaloSpheres.length, sphereGroup.getObjectByName[index].length);
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
function createHaloLineGeometry(TimePeriods) {
    console.log("\tcreateHaloLineGeometry(TimePeriods)");
    var i, _lines = []

    for (var id in HaloLUT) {

        i = HaloLUT[id].time;
        if (!_lines[i])
            _lines[i] = [];

        if (!(id in __traversed)) {

            var points = intoTheVoid(id, [], 0);
            _lines[i].push( { 'points': points, 'id': id } );
        }
    }

    for (i = 0; i < _lines.length; i++) {
        for (var j = 0; j < _lines[i].length; j++){
            var id = _lines[i][j].id;
            var segment = _lines[i][j].points;
            if (segment.length > 1)
                createPathLine(segment, colorKey(i), id, i);
        }
    }
    console.log("\tLines have been created")
    // set the visibility of the halo data

}

// Helper function
function intoTheVoid(id, points, steps) {

    var maxSteps = 1;
    var halo = HaloLUT[id];  // use the ID to pull the halo
    points.push(halo.position);
    //points.push([halo.x,halo.y,halo.z,halo.id,halo.desc_id]); // for debugging purposes

    //if (halo.desc_id in HaloLUT && halo.time < EPOCH_TAIL) {

    if (halo.desc_id in HaloLUT && steps < maxSteps) {

        var next = HaloLUT[halo.desc_id];

        if (halo.desc_id in __traversed) {

            //if (halo.time === next.time){
            //    console.log('\t',halo.time, next.time, halo.id, next.id, halo.position, next.position);
            //    return [];
            //}
            //console.log("\t\tAdding", halo.id, "to points", halo.time, next.position);
            points.push(next.position);
            //points.push([next.x,next.y,next.z,next.id,next.desc_id]); // for debugging purposes
            return points;
        } else {
            __traversed[halo.id] = true;
            //console.log("\t\tAdding", halo.id, "to __traversed", halo.time);
            return intoTheVoid(next.id, points, steps+1);
        }
    } else {
        //console.log("\t\thalo->id:",halo.id, "!= halo.desc_id:", halo.desc_id);
        return points;
    }

}


function createPathLine(points, color, id, period) {

    // if points is defined at all...
    if (points && points.length > 1) {

        // console.log("creating PathLine!", period);
        var index, xyz;
        var colors = [];
        var spline = new THREE.Spline();
        var numPoints = points.length*nDivisions;

        var splineGeometry = new THREE.Geometry();

        spline.initFromArray(points);
        for (var i=0; i <= numPoints; i++) {

            index = i/numPoints;
            xyz = spline.getPoint(index);
            splineGeometry.vertices[i] = new THREE.Vector3( xyz.x, xyz.y, xyz.z );
            colors[ i ] = new THREE.Color(color);
        }

        splineGeometry.colors = colors;
        splineGeometry.computeBoundingSphere();

        var mesh = new THREE.Line(
            splineGeometry,
            new THREE.LineBasicMaterial({
                color: rgbToHex(255, 255, 255),
                linewidth: 0.5,
                vertexColors: THREE.VertexColors,
                transparent: true,
                opacity: 0.5
            })
        );
        mesh.visible = (period >= EPOCH_HEAD && period < EPOCH_TAIL)? config.showPaths : false;
        mash.name = id;
        mesh.halo_id = id;
        mesh.halo_period = period;
        linesGroup.add(mesh);
        console.log(linesGroup);
    }

}


/* ================================== *
 *          updateAllTheGeometry
 *  Redraws the Splines for the paths
 *  and turns sphere opacity on or off
 * ================================== */
function updateAllTheGeometry() {

    if (config.enableSelection) {

        toggleVisibility(HaloBranch,config.showPaths, 0.5);
        toggleVisibility(HaloSelect,config.showHalos, 0.05);

    } else {

        displayHalos();
    }
}


// given a clicked Halo id, traverse the tree with the given halo.

function intoTheAbyss(id, period, points) {

    var halo = HaloLUT[id];  // use the ID to pull the halo
    points.push(halo.position);
    HaloSelect[id] = id;
    sphereGroup.getObjectByName(id).visible = (period >= EPOCH_HEAD && period < EPOCH_TAIL)? config.showHalos : false;
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
        var numPoints = points.length*nDivisions;

        var splineGeometry = new THREE.Geometry();

        spline.initFromArray(points);
        for (var i=0; i <= numPoints; i++) {

            index = i/numPoints;
            xyz = spline.getPoint(index);
            splineGeometry.vertices[i] = new THREE.Vector3( xyz.x, xyz.y, xyz.z );
            colors[ i ] = new THREE.Color(colorKey(index*points.length + period)); // this should give us an accurate color..I think

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

        if (id in HaloBranch){
            console.log("HaloBranch", id)
            // scene.remove(HaloBranch[id]);
            linesGroup.getObjectByName(id).material.dispose();
            linesGroup.getObjectByName(id).geometry.dispose();
            linesGroup.remove(HaloBranch[id]);
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
    HaloLUT = {length: 0, min: NUMTIMEPERIODS, max: 0};


    EPOCH_PERIODS = [];
    for (var i = 0; i < NUMTIMEPERIODS; i++) {

        EPOCH_PERIODS[i] = [];
    }
}

function resetGlobalStructures() {
    console.log("calling resetGlobalStructures()!");
    for (var id in HaloLUT) {
        if  (id !== "length" || id !== "max" || id !== "min"){
            var s = sphereGroup.getObjectByName(id),
                l = linesGroup.getObjectByName(id)
            console.log("\t",id, s, l)

            if (linesGroup.getObjectByName(id)) {
                linesGroup.getObjectByName(id).geometry.dispose();
                linesGroup.getObjectByName(id).material.dispose();
                linesGroup.remove(linesGroup.getObjectByName(id));
            }

            if (sphereGroup.getObjectByName(id)) {
                sphereGroup.remove(sphereGroup.getObjectByName(id));

                sphereGroup.getObjectByName(id).geometry.dispose();
                sphereGroup.getObjectByName(id).material.dispose();
                //delete sphereGroup.getObjectByName(id);
            }
            delete HaloLUT[id];

            HaloLUT.length--;
        }
    }
    //sphereGroup.dispose();
    //linesGroup.dispose();
    console.log("\t",sphereGroup, linesGroup, scene, HaloLUT)
    prepGlobalStructures();
}