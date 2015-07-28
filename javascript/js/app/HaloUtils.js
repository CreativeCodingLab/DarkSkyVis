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

    var time, id, desc_id, pid;
    var descendant, parent;

    var targetSet = false;

    var sphereGeometry = new THREE.SphereGeometry(1, 32, 32),
        sphereMaterial,
        _materialsByPeriod = {};

    showSpinner(true);

    if (firstTime)
        // Prepare our Global halo objects
        resetGlobalStructures();


    oboe(url)
        .node("!.*", function(halo, path) {
            if (+halo.id === 664885) {
                console.log("We have it! 664885");
            }
            id = +halo.id;
            desc_id = +halo.desc_id;
            pid = +halo.pid;
            halo.time = time = parseInt(halo.scale * 100) - 12;  // 12 is the offset
            halo.isSub = false;
            halo.isSuper = false;
            halo.children = [];

            halo.subHalos = [];

            console.log(id, time, desc_id, pid);

            // add Halos to list by ID
            HaloLUT[id] = halo;
            EPOCH_PERIODS[time].push(id);
            // console.log(halo.id)

            // Keep Track of Halo Children
            if (desc_id !== -1) {
                if( HaloLUT.hasOwnProperty(desc_id)) {
                    descendant = HaloLUT[desc_id];
                    descendant.children.push(id);
                }
                //else{
                //
                //    debugger;
                //    error.log("descendant",desc_id, "not in HaloLUT yet!!");
                //}
                //console.log('\tIts a boy', id, desc_id, descendant.children);
            }

            if (pid !== -1) {
                halo.isSub = true;
                //if (HaloLUT.hasOwnProperty(pid)){
                //    parent = HaloLUT[pid];
                //    parent.subHalos.push(id);
                //    parent.isSuper = true;
                //} else
                //    error.log("parent",pid, "not in HaloLUT yet!!");
                //console.log("\tYoure going to be my bitch!", id, pid, parent.subHalos)
            }

            if (_materialsByPeriod.hasOwnProperty(time)){
                //console.log("\tyup it does",time);
                sphereMaterial = _materialsByPeriod[time];
            } else {
                //console.log("\tNnnnnope!",time);
                _materialsByPeriod[time] = new THREE.MeshPhongMaterial({
                    color: colorKey(time),
                    specular: colorKey(time),
                    shininess: 40,
                    shading: THREE.SmoothShading,
                    //blending: THREE.AdditiveBlending,
                    vertexColors: THREE.VertexColors,
                    transparent: true,
                     //side: THREE.BackSide,  // Seems to be slowing things down a lot
                    opacity: 0.4
                });
                sphereMaterial = _materialsByPeriod[time];
            }

            var mesh = createSphereGeometry(halo, sphereGeometry, sphereMaterial);

            if (mesh) {
                console.log(mesh.name, halo.id);
                sphereGroup.add(mesh)
            } else {
                error.log("Halo", id, "mesh not added!!");
            }

            if (!targetSet && (time >= EPOCH_HEAD && time <= EPOCH_TAIL)) {
                //console.log("Ha got you fucker!", time);
                targetSet = true;
                prevTarget = null;
                curTarget = {
                    object: sphereGroup.getObjectByName(id)
                };
                curTarget.object.material.opacity = 0.7;
                DEFERRED = false;
                tweenToPosition(1250, 1250, true);
            }

            HaloLUT.length++;
            HaloLUT.min = (time < HaloLUT.min) ? time : HaloLUT.min;
            HaloLUT.max = (time > HaloLUT.max) ? time : HaloLUT.max;

            return oboe.drop;

        })
        .done(function() {
            console.log("\tDone")
            createHaloTrajectories();

            //console.log("HaloLUT?", HaloLUT)
            return oboe.drop;
        });
    showSpinner(false);
}


function initHaloMap(url) {
    console.log("Init The Halo Map", url);
    var forestGeometry = new THREE.Geometry();
    var colors = [];
    var map = THREE.ImageUtils.loadTexture( "js/assets/sprites/nova.png" );
    map.minFilter = THREE.NearestFilter;
    prepGlobalStructures();
    showSpinner(true);

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
            for (var ax=0; ax<3; ax++){
                vr += vel[ax]*pos[ax];
            }

            vr /= (rmag*vmag);

            colors.push(new THREE.Color(0.5 + 0.5*vr , 0.5, 0.5 - 0.5*vr ))

            if (!targetSet) {
                curTarget = {
                    object: { position: particle }
                }
                targetSet = true;
            };


            return oboe.drop
        })
        .done(function() {
            console.log("finished uploading")
            var material = new THREE.PointCloudMaterial({
                // color: rgbToHex(255, 0, 0),
                size: 10.0,
                vertexColors: THREE.VertexColors,
                map: map, //THREE.ImageUtils.loadTexture( "js/assets/sprites/circle2.png" ),
                // blending: THREE.AdditiveBlending,
                transparent: true,
                opacity: 0.6
            });
            forestGeometry.colors = colors;
            pointCloud = new THREE.PointCloud(forestGeometry, material);
            pointCloud.updateMatrix();
            scene.add(pointCloud);
            console.log(pointCloud);
            curTarget = {object: pointCloud}
            showSpinner(false);

            // curTarget = {
            //     object: pointCloud
            // };
            // curTarget.object.material.opacity = 0.7;
            // console.log("currTarget",curTarget);
            // tweenToPosition(4500, 4250, true);
            DEFERRED = false;
            console.log("DEFERRED", DEFERRED);
        });
}


function createSphereGeometry(halo, sphereGeometry, sphereMaterial) {

    console.log("createSphereGeometry(",halo.id, halo.time,")");

    var rs1 = halo.rvir * 0.001;
    var period = +halo.time;

    //    var color = colorKey(period)
    EPOCH_PERIODS[period].push(halo.id);

    //var mesh = new THREE.Sprite( sphereMaterial );
    var mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    mesh.name = halo.id;
    mesh.period = +halo.time;
    mesh.rs1 = +halo.rvir;
    mesh.position.set(halo.x, halo.y, halo.z);
    mesh.scale.set(rs1, rs1, rs1);
    mesh.visible = (+halo.time >= EPOCH_HEAD && +halo.time <= EPOCH_TAIL) ? config.showHalos : false;
    mesh.updateMatrix();
    return mesh
}


/* ================================== *
 *          createHaloTrajectories
 *  Geometry rendering function. Builds
 *  Our splines and spheres for each
 *  Halo object. Iterates over time
 *
 *  NB: A number of helper functions
 *  included below
 * ================================== */
function createHaloTrajectories() {

     console.log("\tcreateHaloTrajectories()");
    var periodTracker = {};
    var material = new THREE.LineBasicMaterial({
        color: rgbToHex(255, 255, 255),
        linewidth: 1,
        vertexColors: THREE.VertexColors,
        transparent: true,
        opacity: 0.7
    });

    var id, period;
    console.log("\tMaterial is..", material, sphereGroup);
    // We can use the sphereGroup to drive the line creation
    sphereGroup.children.forEach(function(mesh) {

        console.log("mesh", mesh.name);

        if (mesh) {
            id = +mesh.name;
            period = +mesh.period;

            // console.log("mesh", mesh.name, id, mesh.period, period);

            if (!periodTracker.hasOwnProperty(period))
                periodTracker[period] = material.clone();

            material = periodTracker[period];

            if (!__traversed.hasOwnProperty(id)) {
                var points = intoTheVoid(+id, [], 0);
                // console.log("\tnot been traversed", id, points.length, material)
                // console.log("gonna create some lines now")
                if (points.length > 1) {
                    var lineMesh = createPathArrow(points, id, period ); //createPathLine(points, id, period, material);
                    if (lineMesh)
                        linesGroup.add(lineMesh);
                }

                //var arrowMesh = createPathArrow(points, points[0],points[1], period );
                //if (arrowMesh)
                //    arrowGroup.add(arrowMesh);
            }
        }
    });

    linesGroup.visible = config.showPaths;
}


/* intoTheVoid
    id: Halo ID, that can be indexed from the LookUp table
    points: a
*/
function intoTheVoid(id, points, steps) {
    // console.log('\tintoTheVoid', typeof id, steps);
    var maxSteps = 2;
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



function createPathArrow(points, id, period) {
    console.log("createPathArrow",id, period);
    var _src = points[0], _dest = points[1];
    var src = new THREE.Vector3(_src[0], _src[1], _src[2]);
    var dest = new THREE.Vector3(_dest[0], _dest[1], _dest[2]);
    var direction = new THREE.Vector3();
    direction.subVectors(dest,src);
    var length = direction.length();
    direction.normalize();
    var arrow = new THREE.ArrowHelper(direction, src, length, colorKey(period))
    arrow.name = id;
    arrow.period = period;

    // Maximum scale for super long halo paths
    // T…E.Vector3 {x: 0.003764163673380706, y: 0.018820818366903528, z: 0.003764163673380706}
    // This is too big...
    // T…E.Vector3 {x: 0.04006696419345994, y: 0.20033482096729968, z: 0.04006696419345994}
    // There is no min size
    return arrow;
}


function createPathLine(points, id, period, material, useSpline) {
     console.log("createPathLine(points, id, period, ", points, typeof id, typeof period, material);
    // if points is defined at all...
    if (points && points.length > 1) {

        // console.log("creating PathLine!", period);
        var index, xyz;
        var colors = [];
        var geometry = new THREE.Geometry();

        if (useSpline) {
            var numPoints = points.length * nDivisions;
            var spline = new THREE.Spline();
            spline.initFromArray(points);

            for (var i = 0; i <= numPoints; i++) {

                index = i / numPoints;
                xyz = spline.getPoint(index);

                var color = colorKey(period + index);
                colors[i] = new THREE.Color(color);
                geometry.vertices[i] = new THREE.Vector3(xyz.x, xyz.y, xyz.z);
            }

        } else {

            for (var i = 0; i < points.length; i++) {
                xyz = points[i];
                var color = colorKey(period);
                colors[i] = new THREE.Color(color);
                geometry.vertices[i] = new THREE.Vector3(xyz[0], xyz[1], xyz[2]);
            }

        }


        // console.log(geometry);
        geometry.colors = colors;
        //geometry.computeLineDistances();

        var mesh = new THREE.Line(geometry, material);
        mesh.visible = !!(period >= EPOCH_HEAD && period < EPOCH_TAIL);
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

        toggleVisibility(linesGroup, config.showPaths);
        toggleVisibility(sphereGroup, config.showHalos);

    } else {

        displayHalos();
    }
}


// given a clicked Halo id, traverse the tree with the given halo.
function fromTheDepths(target, id, points, distance, depth) {
    depth = depth? depth: 10000;
    var path, mesh;

    if (distance === 0) console.log("From the Depths.....", target, id, points, distance, depth)

    if (distance > NUMTIMEPERIODS) {
        console.error("fromTheDepths: distance > NUMTIMEPERIODS!!");
        return;
    }

    var material = new THREE.LineBasicMaterial({
        linewidth: 1,
        vertexColors: THREE.VertexColors
    });

    if (HaloLUT.hasOwnProperty(id)) {
        var halo = HaloLUT[+id];

        sphereGroup.getObjectByName(+id).visible = true;

        points.push(halo.position);

        if (halo.children.length < 1 || distance >= depth ) {

            __traversed = {};
            points.reverse();
            points.pop();
            console.log("Into the Void, Bitch!", target, points, distance);
            path = intoTheVoid(target, points, distance);
            mesh = createPathLine(path, +id, HaloLUT[target].time, material)
            //mesh = createPathArrow(path, +id, HaloLUT[target].time)
            traceGroup.add(mesh);

        } else if (halo.children.length === 1) {

            var _id = halo.children[0];
            // if there is a direct path, ie only one child, dont count the distance.
            fromTheDepths(target, +_id, points, distance, depth);

        } else {
            console.log("\tHalo has multiple children", halo.children);
            halo.children.forEach(function(_id) {

                fromTheDepths(target, +_id, points.slice(), distance+1, depth);

            })
        }

    } else {
        console.error("Halo Dont exist!", id)
       if (points.length > 1) {
            __traversed = {};
            points.reverse();
            points.pop();
            console.log("Into the Void, Bitch!", target, points, distance);
            path = intoTheVoid(target, points, distance);
            mesh = createPathLine(path, +id, distance+depth, material);
            traceGroup.add(mesh);
       }
    }

    console.log("...I Come!", id);

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


// Display currently selected Halo's Attribute information
function displayHaloStats() {

    var haloData = HaloLUT[curTarget.object.name];
    console.log(haloStats, haloData, curTarget);

    var result =
        "<b>      time:</b> " + haloData['time'] + "</br>" +
        "<b>        id:</b> " + haloData['id'] + "</br>" +
        "<b>     isSub:</b> " +  haloData['isSub'] + "</br>" +
        "<b>     isSuper:</b> " +  haloData['isSuper'] + "</br>" +
        "<b>   desc_id:</b> " + haloData['desc_id'] + "</br>" +
        "<b>  num_prog:</b> " + haloData['num_prog'] + "</br>" +
        "<b>       pid:</b> " + haloData['pid'] + "</br>" +
        "<b>      upid:</b> " +  haloData['upid'] + "</br>" +
        "<b>  desc_pid:</b> " +  haloData['desc_pid'] + "</br>" +
        "<b>   n Children:</b> " +  haloData['children'].length + "</br>" +
        "<b>   n subHalos:</b> " +  haloData['subHalos'].length + "</br>" +
        "<b>     scale:</b> " +  haloData['scale'] + "</br>" +
        "<b>desc_scale:</b> " +  haloData['desc_scale'] + "</br>" +
        "<b>   phantom:</b> " +  haloData['phantom'] + "</br>" +
        "<b>  position:</b> " +  haloData['position'] + "</br>" +
        "<b>  velocity:</b> " +  haloData['velocity'] + "</br>" +
        "<b>        rs:</b> " +  haloData['rs'] + "</br>" +
        "<b>      mvir:</b> " +  haloData['mvir'] + "</br>" +
        "<b>      rvir:</b> " +  haloData['rvir'] + "</br>" +
        "<b>      vrms:</b> " +  haloData['vrms'] + "</br>" +
        "<b>      vmax:</b> " +  haloData['vmax'] + "</br>" +
        "<b>  sam_mvir:</b> " +  haloData['sam_mvir'] + "</br>" +
        "<b>      Spin:</b> " +  haloData['Spin'] + "</br>"

    haloStats.html(result);
}

function resetArrow(group) {
    return (function() {
        console.log(group.children)
        var arrow;
        var children = group.children.length;

        for( var i= 0; i < children; i++ ) {
            arrow = group.children[0];

            group.remove(arrow);
            resetGroup(arrow);

        }
        console.log(group.children)
    })()

}

function resetGroup(group) {

    return (function() {
        console.log(group.children)
        var mesh;
        var children = group.children.length;

        for( var i= 0; i < children; i++ ) {
            mesh = group.children[0];

            group.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        }
        console.log(group.children)
    })()
}

function resetGlobalStructures(lock) {
    console.log("calling resetGlobalStructures()!");
    var i, id, children, mesh, line ;

    switch(lock){

        case 'trace':
            __traversed = {};
            resetArrow(traceGroup)
            break;

        case 'point':
            resetGroup(pointCloud)
            break;

        case "path":
            __traversed = {};
            resetArrow(linesGroup);
            break;
        default:
            console.log("Kill Everything else!");
            __traversed = {};
            resetGroup(sphereGroup);
            resetArrow(linesGroup);
            for (var id in HaloLUT) {
                delete HaloLUT[id];
            }
            HaloLUT = {length:0, min: NUMTIMEPERIODS, max:0};
            break
    }
    console.log("\t", sphereGroup.children, linesGroup.children, scene, HaloLUT);
}


function setArrowAttribs(arrow, length, headLength, headWidth) {

    if ( headLength === undefined ) headLength = 0.2 * length;
    if ( headWidth === undefined ) headWidth = 0.2 * headLength;

    arrow.line.scale.set( 1, length, 1 );
    arrow.line.updateMatrix();

    arrow.cone.scale.set( headWidth, headLength, headWidth );
    arrow.cone.position.y = length;
    arrow.cone.updateMatrix();
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

//674621