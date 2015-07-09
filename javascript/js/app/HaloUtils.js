/**
 * Created by krbalmryde on 7/9/15.
 */


/* ================================== *
 *          createHaloGeometry
 *  Geometry rendering function. Builds
 *  Our splines and spheres for each
 *  Halo object. Iterates over time
 *
 *  NB: A number of helper functions
 *  included below
 * ================================== */
function createHaloGeometry(TimePeriods) {
    console.log("createHaloGeometry(TimePeriods)");

    for (var i = 0; i < TimePeriods.length; i++) {

        for (var j = 0; j < TimePeriods[i].length; j++) {


            var id = TimePeriods[i][j];

            if (!(id in __traversed)) {

                var points = intoTheVoid(id, [], 0);
                Lines[i].push( { 'points': points, 'id': id } );
            }

            createSphere(id, colorKey(i),  i);
        }
    }

    for (i = 0; i < Lines.length; i++) {

        for (j = 0; j < Lines[i].length; j++){
            var id = Lines[i][j].id;
            var segment = Lines[i][j].points;
            if (segment.length > 1)
                createPathLine(segment, colorKey(i), id, i);
        }
    }

    // set the visibility of the halo data
    DEFERRED = false;
    showSpinner(false);

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

function createSphere(id, color, period) {

    var halo = HaloLUT[id];
    //console.log("createSphere", index, halo.id);

    var mesh = new THREE.Mesh(
        new THREE.SphereGeometry(halo.rs1/100, 15, 15),
        new THREE.MeshPhongMaterial({
            color: color,
            specular: rgbToHex(255,255,255),
            shininess: 30,
            shading: THREE.SmoothShading,
            vertexColors: THREE.VertexColors,
            transparent: true,
            side: THREE.BackSide,
            opacity: 0.4
        })
    );

    // Add the halo's id to the mess so we can check it against the Halo ID map/LUT/Hash.
    mesh.visible = (period >= EPOCH_HEAD && period <= EPOCH_TAIL)? config.showHalos : false;
    mesh.renderOrder = halo.time;
    mesh.halo_id = id;
    mesh.halo_period = halo.time;
    mesh.position.set( halo.x, halo.y, halo.z);
    mesh.updateMatrix();
    HaloSpheres[id] = mesh;
    sphereGroup.add(mesh);
    //console.log("created Halosphere", halo.id, index, HaloSpheres.length, HaloSpheres[index].length);

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

        var material = new THREE.LineBasicMaterial({
            color: rgbToHex(255, 255, 255),
            linewidth: 0.5,
            vertexColors: THREE.VertexColors,
            transparent: true,
            opacity: 0.5
        });

        var mesh = new THREE.Line(splineGeometry, material);
        mesh.visible = (period >= EPOCH_HEAD && period < EPOCH_TAIL)? config.showPaths : false;
        mesh.halo_id = id;
        mesh.halo_period = period;
        HaloLines[id] = mesh;
        linesGroup.add(mesh);
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

//
function intoTheAbyss(id, period, points) {

    var halo = HaloLUT[id];  // use the ID to pull the halo
    points.push(halo.position);
    HaloSelect[id] = true;
    HaloSpheres[id].visible = (period >= EPOCH_HEAD && period < EPOCH_TAIL)? config.showHalos : false;
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
            linesGroup.remove(HaloBranch[id]);
            scene.remove(HaloBranch[id]);
            HaloBranch[id].material.dispose();
            HaloBranch[id].geometry.dispose();
            delete HaloBranch[id]
        }
        delete HaloSelect[id]
    }
    HaloSelect = {};
    HaloBranch = {};
    __traversed = {};

}


function prepGlobalStructures() {

    console.log("calling prepGlobalStructures()!");
    Lines = [];
    HaloBranch = {};
    HaloSpheres = {};
    HaloLines = {};
    __traversed = {};
    HaloLUT = {length: 0};  // just to keep track of how many objects we have


    EPOCH_PERIODS = [];
    for (var i = 0; i < NUMTIMEPERIODS; i++) {

        Lines[i] = [];
        EPOCH_PERIODS[i] = [];
    }
}

function resetGlobalStructures() {

    console.log("calling resetGlobalStructures()!");
    for (var i = 0; i < EPOCH_PERIODS.length; i++) {

        for (var j = 0; j < EPOCH_PERIODS[i].length; j++) {

            var id = EPOCH_PERIODS[i][j];
            if (HaloLines[id]) {

                linesGroup.remove(HaloLines[id]);
                scene.remove(HaloLines[id]);
                HaloLines[id].material.dispose();
                HaloLines[id].geometry.dispose();
                delete HaloLines[id]
            }

            if (HaloSpheres[id]) {

                sphereGroup.remove(HaloSpheres[id]);
                scene.remove(HaloSpheres[id]);
                HaloSpheres[id].material.dispose();
                HaloSpheres[id].geometry.dispose();
                delete HaloSpheres[id];
            }

            if (HaloLUT[id]) {

                delete HaloLUT[id];
                HaloLUT.length--;
            }
        }
    }
    prepGlobalStructures();
}