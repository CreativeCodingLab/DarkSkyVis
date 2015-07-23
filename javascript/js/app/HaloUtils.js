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
    var map = THREE.ImageUtils.loadTexture( "js/assets/sprites/nova.png" );  // http://www.goktepeliler.com/vt22/images/414mavi_klar_11_.png
    var sub = THREE.ImageUtils.loadTexture( "js/assets/sprites/triangle.png" );
    var sup = THREE.ImageUtils.loadTexture( "js/assets/sprites/super.png" );
    map.minFilter = THREE.NearestFilter;
    sub.minFilter = THREE.NearestFilter;
    sup.minFilter = THREE.NearestFilter;

    var sphereMaterial;

    showSpinner(true);

    if (firstTime)
        // Prepare our Global halo objects
        resetGlobalStructures();


    oboe(url)
        .node("!.*", function(halo, path) {

            halo.rs1 = (halo.rvir / halo.rs) * 0.01; // convenience keys, one divided by
            halo.time = parseInt(halo.scale * 100) - 12;  // 12 is the offset
            halo.isSub = false;
            halo.isSuper = false;
            halo.children = [];
            halo.subHalos = [];

            // Keep Track of Halo Children
            if (+halo.desc_id !== -1)
                HaloLUT[+halo.desc_id].children.push(halo.id)


            if (+halo.pid !== -1) {
                halo.isSub = true;
                HaloLUT[+halo.pid].subHalos.push(halo.id)
            }

            // add Halos to list by ID
            HaloLUT[+halo.id] = halo;
            EPOCH_PERIODS[+halo.time].push(halo.id);
            // console.log(halo.id)

            // var vmag = Math.sqrt(halo.vx*halo.vx + halo.vy*halo.vy + halo.vz*halo.vz);
            // var rmag = Math.sqrt(halo.x*halo.x + halo.y*halo.y + halo.z*halo.z);
            // var vr = 0.0;
            // for (var ax=0; ax<3; ax++){
            //     vr += halo.velocity[ax]*halo.position[ax];
            // }
            // vr /= (rmag*vmag);


            var sphereMaterial = new THREE.SpriteMaterial({
                map: map,
                color: colorKey(halo.time), // color: new THREE.Color( 0.5 + 0.5*vr , 0.5, 0.5 - 0.5*vr ),
                transparent: true,
                opacity: (halo.isSub) ? 0.9 : 0.6
            });


            // Add the halo's id to the mess so we can check it against the Halo ID map/LUT/Hash.
            var mesh = new THREE.Sprite( sphereMaterial );
            mesh.name = halo.id;
            mesh.period = +halo.time;
            mesh.rs1 = +halo.rs1;
            mesh.position.set(halo.x, halo.y, halo.z);
            mesh.scale.set(halo.rs1, halo.rs1, halo.rs1);
            mesh.visible = (+halo.time >= EPOCH_HEAD && +halo.time <= EPOCH_TAIL) ? config.showHalos : false;
            mesh.updateMatrix();
            sphereGroup.add(mesh);

            HaloLUT.length++;
            HaloLUT.min = (halo.time < HaloLUT.min) ? halo.time : HaloLUT.min
            HaloLUT.max = (halo.time > HaloLUT.max) ? halo.time : HaloLUT.max

            if (!targetSet && (halo.time >= EPOCH_HEAD && halo.time <= EPOCH_TAIL)) {
                console.log("Ha got you fucker!", halo.time);
                targetSet = true;
                prevTarget = null;
                curTarget = {
                    object: sphereGroup.getObjectByName(halo.id)
                };
                curTarget.object.material.opacity = 0.7;
                DEFERRED = false;
                tweenToPosition(1250, 1250, true);
            }
            return oboe.drop;

        })
        .done(function() {
            console.log("\tDone")
            console.log("sphereGroup.children", sphereGroup.children.length)
            createHaloLineGeometry();

            showSpinner(false);
            return oboe.drop;

        });
}

function initHaloMap(url) {
    console.log("Init The Halo Map", url);
    var forestGeometry = new THREE.Geometry();
    var colors = [];
    prepGlobalStructures();
    var targetSet = false;
    pointCloud = new THREE.Object3D();


    showSpinner(true);

    var map = THREE.ImageUtils.loadTexture( "js/assets/sprites/nova.png" );
        map.minFilter = THREE.NearestFilter;

    oboe(url)
        .node("!.*", function(halo, path) {
            // console.log(path, halo);
            halo.time = 1.0; // We know a priori that this is the last time period

            var pos = halo.position,
                vel = halo.velocity;

            var particle = new THREE.Vector3();
            particle.x = pos[0];
            particle.y = pos[1];
            particle.z = pos[2];

            particle.name = halo.id;
            particle.period = halo.time;

            forestGeometry.vertices.push(particle);

            var vmag = Math.sqrt(vel[0]*vel[0] + vel[1]*vel[1] + vel[2]*vel[2]);
            var rmag = Math.sqrt(pos[0]*pos[0] + pos[1]*pos[1] + pos[2]*pos[2]);
            var vr = 0.0;

            for (var ax=0; ax<3; ax++) {
                vr += vel[ax]*pos[ax];
            }

            vr /= (rmag*vmag);

            var material = new THREE.SpriteMaterial({
                    map: map,
                    transparent: true,
                    opacity: 0.6
            });
            material.color.set(new THREE.Color(0.5 + 0.5*vr , 0.5, 0.5 - 0.5*vr ))


            var rs1 = (halo.rvir / halo.rs) * 0.05
            var mesh = new THREE.Sprite(material)

            mesh.name = halo.id;
            mesh.position.set(pos[0], pos[1], pos[2]);
            mesh.scale.set(rs1, rs1, rs1);
            mesh.updateMatrix();
            pointCloud.add(mesh);

            if (!targetSet) {
                curTarget = {
                    object: mesh
                }
                targetSet = true;
            };

            return oboe.drop
        })
        .done(function() {
            console.log("finished uploading")
            scene.add(pointCloud);
            tweenToPosition(2500, 0, false);
            DEFERRED = false;
            console.log("DEFERRED", DEFERRED);
        })
        showSpinner(false);
}


function createCircleGeometry() {
    // geometry
    var geometry = new THREE.Geometry();
    var normal = new THREE.Vector3( 0, 0, 1 );
    var radius = 1.0;
    var sides = 32;
    for ( var i = 0; i < sides; i++ ) {

        var radians1 = 2 * Math.PI * i / sides;
        var x1 = Math.cos( radians1 );
        var y1 = Math.sin( radians1 );

        var radians2 = 2 * Math.PI * ( i + 1 ) / sides;
        var x2 = Math.cos( radians2 );
        var y2 = Math.sin( radians2 );

        // vertices
        geometry.vertices.push(
            new THREE.Vector3( 0, 0, 0 ),
            new THREE.Vector3( x1 * radius, y1 * radius, 0 ),
            new THREE.Vector3( x2 * radius, y2 * radius, 0 )
        );

        // uvs
        geometry.faceVertexUvs[ 0 ].push([
            new THREE.Vector2( 0.5, 0.5 ),
            new THREE.Vector2( x1 / 2 + 0.5, y1 / 2 + 0.5 ),
            new THREE.Vector2( x2 / 2 + 0.5, y2 / 2 + 0.5 )
        ]);

        // face
        var face = new THREE.Face3( i * 3, i * 3 + 1, i * 3 + 2 );
        geometry.faces.push( face );

        // face normal
        face.normal.copy( normal );

        // face vertex normals
        face.vertexNormals.push( normal.clone(), normal.clone(), normal.clone() );

    }

    // centroids
    // geometry.computeCentroids();
    return geometry;
}


function createSphereGeometry(halo, sphereGeometry, sphereMaterial) {
    // console.log("createSphereGeometry(",halo,")")
    var period = +halo.time;
    //    var color = colorKey(period)

    EPOCH_PERIODS[period].push(halo.id);
    var mesh = new THREE.Sprite( sphereMaterial );
    // var mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);

    // Add the halo's id to the mess so we can check it against the Halo ID map/LUT/Hash.
    mesh.visible = (period >= EPOCH_HEAD && period <= EPOCH_TAIL) ? config.showHalos : false;
    //    mesh.renderOrder = period;
    mesh.name = halo.id;
    mesh.period = +halo.time;
    mesh.rs1 = +halo.rs1;
    mesh.position.set(halo.x, halo.y, halo.z);
    mesh.scale.set(halo.rs1, halo.rs1, halo.rs1);
    mesh.updateMatrix();
    // return mesh;
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

    // console.log("\tcreateHaloLineGeometry()");
    var periodTracker = {};
    var material = new THREE.LineBasicMaterial({
        color: rgbToHex(255, 255, 255),
        linewidth: 1,
        vertexColors: THREE.VertexColors,
        transparent: true,
        opacity: 0.2
    })

    var id, period, count = 0;
    // We can use the sphereGroup to drive the line creation
    sphereGroup.children.forEach(function(mesh) {
        // console.log("mesh", count, mesh.name);
        count++;
        if (mesh) {
            id = +mesh.name,
            period = +mesh.period;

            // console.log("mesh", mesh.name, id, mesh.period, period);

            if (!periodTracker.hasOwnProperty(period))
                periodTracker[period] = material.clone();

            material = periodTracker[period];

            if (!__traversed.hasOwnProperty(id)) {
                var points = intoTheVoid(+id, [], 0);
                // console.log("\tnot been traversed", id, points.length, material)
                console.log("gonna create some lines now")
                var lineMesh = createPathLine(points, id, period, material);
                if (lineMesh)
                    linesGroup.add(lineMesh);
            }
        }
    });

    linesGroup.visible = false;
}


// Helper function
function intoTheVoid(id, points, steps) {
    // console.log('\tintoTheVoid', typeof id, steps);
    var maxSteps = 88;
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
    // console.log("createPathLine(points, id, period, ", points, typeof id, typeof period, material);
    // if points is defined at all...
    var color = colorKey(period);
    if (points && points.length > 1) {

        // console.log("creating PathLine!", period);
        var index, xyz;
        var colors = [];
        var numPoints = points.length * nDivisions;
        var positions = new Float32Array( numPoints * 3 );
        var spline = new THREE.Spline();
        var geometry = new THREE.Geometry();
        // spline.initFromArray(points);
        spline.initFromArray(points);

        for (var i = 0; i <= numPoints; i++) {
            index = i / numPoints;
            xyz = spline.getPoint(index);

            colors[i] = new THREE.Color(color);
            geometry.vertices[i] = new THREE.Vector3(xyz.x, xyz.y, xyz.z);
        }

        // console.log(geometry);
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

    // for (var id in HaloSelect) {

    //     console.log("HaloBranch", id, typeof id)
    //     if (id in HaloBranch) {
    //         linesGroup.remove(HaloBranch[id]);
    //         linesGroup.getObjectByName(id).material.dispose();
    //         linesGroup.getObjectByName(id).geometry.dispose();
    //     }
    // }
    HaloSelect = [];
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

//674621