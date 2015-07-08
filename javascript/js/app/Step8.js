/**
 * Created by krbalmryde on 6/24/15.
 */
"use strict";

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

// Three.js components
var container;
var scene, renderer;
var camera, slider, controls;
var mouse, raycaster, light;

// Halo Components
var EPOCH_HEAD, EPOCH_TAIL;

var Lines = [];
var linesGroup, sphereGroup;
var HaloLines = {}, HaloSpheres = {};
var HaloBranch = {}, HaloSelect = {};
var HaloLUT, EPOCH_PERIODS, __traversed={};

var hits = [], curTarget, prevTarget;

var nDivisions = 10, NUMTIMEPERIODS = 89;

var config, haloStats;
var pointCloud;

// Be sure to match this with the slider's connect!!
var colorKey = d3.scale.linear()
    .domain([0, 18, 36, 53, 71, NUMTIMEPERIODS])
    .range([rgbToHex(255,0,0), rgbToHex(255,0,255), rgbToHex(0,0,255), rgbToHex(0,255,255), rgbToHex(0,255,0)]);

// ==========================================
//              Start
//    Main entry point into the application
//    Gets called by index.html
// ==========================================
function Start() {

    onCreate();
    onFrame();

}

/* ==========================================
 *              onCreate
 *   Initialize WebGL context, as well as
 *   Three.js variables, and Window/document
 *   Event Listeners
 * ==========================================
 */
function onCreate() {

    /* -------------------------------*/
    /*      Setting the stage         */
    /* -------------------------------*/

    // **** Create our scene ***
    initScene();

    // **** Set up the Renderer ***
    initRenderer();

    // **** Setup Container stuff ***
    initContainer();

    // *** Setup the Halo stats div ***
    initStatsInfo();

    // **** DAT GUI! ***
    initGUI();

    // **** Setup our slider ***
    initSlider();


    /* -------------------------------*/
    /*    Organizing our Actors       */
    /* -------------------------------*/

    // Load Data for Halo  // TREE679582  TREE676638
    //initHaloMap(HLIST1);
    initHaloTree(TREE676638, true);

    // **** Lights! ***
    initLights();

    // **** Camera! ***
    initCamera();

    // **** Setup our Raycasting stuff ***
    initRayCaster();

    // **** Action! Listeners *** //
    initListeners();


}

/* ================================== *
 *          onFrame
 *  Our Main rendering loop with
 *  associated draw function
 * ================================== */
function onFrame() {

    var sliderVal0 = parseInt(slider.val()[0]);
    var sliderVal1 = parseInt(slider.val()[1]);

    if ((EPOCH_HEAD !== sliderVal0) || (EPOCH_TAIL !== sliderVal1)) {

        EPOCH_HEAD = sliderVal0;
        EPOCH_TAIL = sliderVal1;
        updateAllTheGeometry();
    }
    requestAnimationFrame( onFrame );
    TWEEN.update();
    render();

}

/* ================================== *
 *          render
 *  Our render function which renders
 *  the scene and its associated objects
 * ================================== */
function render() {

    raycaster.setFromCamera( mouse, camera );

    // This loop is to set the captured moused over halos back to their
    // original color once we have moved the mouse away
    if (hits.length > 0) {

        for (var i = 0; i < hits.length; i++) {

            // Hit object is NOT the currently selected object
            if (hits[i].object.position !== curTarget.object.position && hits[i].object.visible){
                hits[i].object.material.opacity = 0.2;
            }
        }
    }

    hits = raycaster.intersectObjects( sphereGroup.children );

    // This loop is to set the captured moused over halos to yellow to highlight
    // that weve moved over them
    if (hits.length > 0) {

        for (var i = 0; i < hits.length; i++) {

            // Hit object is not our currently selected object
            if (hits[i].object.position !== curTarget.object.position && hits[i].object.visible){
                hits[i].object.material.opacity = 0.4;
            }
        }
    }
    controls.update();
    updateLightPosition();
    renderer.render( scene, camera );

}


/* ================================== *
 *          render
 *  Our render function which renders
 *  the scene and its associated objects
 * ================================== */
function initHaloTree(DATASET, firstTime) {

    console.log("\n\ninitHaloTree!!", firstTime, DATASET.length);

    //getHaloTreeData("js/assets/hlist_1.0.json")
    //    .then(function(response) {
    //        console.log("Fuck Yeah!", typeof response, response);
    //    });
    // Helper Function, closure
    function __prepGlobalStructures() {

        console.log("calling __prepGlobalStructures()!");
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

    function __resetGlobalStructures() {

        console.log("calling __resetGlobalStructures()!");
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
        __prepGlobalStructures();
    }

    if (firstTime)
        __prepGlobalStructures();
    else
        __resetGlobalStructures();

    // PATH257, HALOTREE, TREE676638
    for (var i = 0; i < DATASET.length; i++) {

        var halo = DATASET[i];
        halo.rs1 = (halo.rvir / halo.rs);  // convenience keys, one divided by
        halo.rs2 = (halo.rvir * halo.rs);  // the other multiplied
        //halo.x = (halo.x >= 60.0)? 60.0 - halo.x: halo.x;
        //halo.position[0] = halo.x
        halo.vec3 = THREE.Vector3(halo.x, halo.y, halo.z);  // Convenience, make a THREE.Vector3
        halo.time = parseInt(halo.scale * 100) - tree_offset;
        //console.log(halo.time, halo.id, halo.desc_id, halo.pid)
        //console.log("\tHalo.id ", halo.id, "Halo.scale",halo.scale, "Halo.time",halo.time);

        // if (halo.x > 50.0 && halo.time)
        //     console.log(halo.time, halo.id, halo.desc_id, halo.position);

        // add Halos to list by ID
        HaloLUT[halo.id] = halo;
        HaloLUT.length++;

        EPOCH_PERIODS[halo.time].push(halo.id);
    }

    console.log("\n\tTimePeriods", EPOCH_PERIODS,"\n");
    console.log("\tHaloLUT", HaloLUT.length,"\n");

    // **** Make some Spline Geometry ***
    createHaloGeometry(EPOCH_PERIODS);

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
    displayHalos();

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

function createSphere(id, color, index) {

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
            opacity: 0.2
        })
    );

    // Add the halo's id to the mess so we can check it against the Halo ID map/LUT/Hash.
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
            linewidth: 2,
            vertexColors: THREE.VertexColors,
            transparent: true,
            opacity: 0.5
        });

        var mesh = new THREE.Line(splineGeometry, material);
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
    } else{
        displayHalos();
    }


}
