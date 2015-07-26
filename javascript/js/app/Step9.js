/**
 * Created by krbalmryde on 6/24/15.
 */
"use strict";

if (!Detector.webgl) Detector.addGetWebGLMessage();

var spinner; // our Loading spinner thing

// Three.js components
var container; // WebGL container, fps stats
var scene, renderer; // scene, renderer
var camera, slider, controls; // camera, slider, camera-controls
var config, mouse, raycaster, light; // gui, mouse, raycaster, lights

// Time Components
var EPOCH_PERIODS, EPOCH_HEAD, EPOCH_TAIL;

// Geometry attributes
var nDivisions = 10,
    NUMTIMEPERIODS = 89;

// Halo Components
// linesGroup and sphereGroup contain the lines and spheres of the halos
var linesGroup, sphereGroup, traceGroup, arrowGroup;

// HaloBranch is the object acts like HaloSpheres
// HaloSelect is a global lookup which keeps track of all SELECTED Halos
var HaloBranch = {},
    HaloSelect = [];
// HaloLUT is a global lookup table to keep track of all loaded halos
var HaloLUT, __traversed = {};

// Click objects
var hits = [],
    curTarget, prevTarget;


var pointCloud;
var haloStats;
var DEFERRED = true;

// Be sure to match this with the slider's connect!!
var colorKey = d3.scale.linear()
    .domain([0, NUMTIMEPERIODS])
    .range([rgbToHex(255, 0, 0), rgbToHex(0, 0, 255)]);


var NovaMap = THREE.ImageUtils.loadTexture( "js/assets/sprites/nova.png" );  // http://www.goktepeliler.com/vt22/images/414mavi_klar_11_.png
var SubMap = THREE.ImageUtils.loadTexture( "js/assets/sprites/triangle.png" );
var SuperMap = THREE.ImageUtils.loadTexture( "js/assets/sprites/circle3.png" );
var SuperSubMap = THREE.ImageUtils.loadTexture( "js/assets/sprites/super.png" );
NovaMap.minFilter = THREE.NearestFilter;
SubMap.minFilter = THREE.NearestFilter;
SuperMap.minFilter = THREE.NearestFilter;
SuperSubMap.minFilter = THREE.NearestFilter;

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

    initSpinner(); // get this up and running first thing

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

    // **** Stream in our data! Build Add scene components *** //

    initLights();
    // **** Camera! ***
    initCamera();

    // **** Setup our Raycasting stuff ***
    initRayCaster();

    // **** Action! Listeners *** //
    initListeners();

    // initHaloTree("js/assets/tree_676638.json", true);
    showSpinner(true);
    // initHaloMap("js/assets/hlist_1.0.json");

    // showSpinner(true)
    // oboe("js/assets/tree_0_0_0.json")
    //     .node("!.*", function(halo, path) {
    //         console.log(halo, path)
    //         return oboe.drop

    //     }).done(function(){
    //         console.log("done")
    //     })

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
        console.log("Slider values have changed!");
        EPOCH_HEAD = sliderVal0;
        EPOCH_TAIL = sliderVal1;
        updateAllTheGeometry();
    }
    requestAnimationFrame(onFrame);
    TWEEN.update();
    render();

}

/* ================================== *
 *          render
 *  Our render function which renders
 *  the scene and its associated objects
 * ================================== */
function render() {

    if (!DEFERRED) {
        raycaster.setFromCamera(mouse, camera);

        // This loop is to set the captured moused over halos back to their
        // original color once we have moved the mouse away
        if (hits.length > 0) {

            for (var i = 0; i < hits.length; i++) {

                // Hit object is NOT the currently selected object
                if (hits[i].object.position !== curTarget.object.position && hits[i].object.visible) {
                    hits[i].object.material.opacity = 0.4;
                }
            }
        }

        hits = raycaster.intersectObjects(sphereGroup.children);

        // This loop is to set the captured moused over halos to yellow to highlight
        // that weve moved over them
        if (hits.length > 0) {

            for (var i = 0; i < hits.length; i++) {

                // Hit object is not our currently selected object
                if (hits[i].object.position !== curTarget.object.position && hits[i].object.visible) {
                    hits[i].object.material.opacity = 0.6;
                }
            }
        }        controls.update();

        // updateLightPosition();
        var time = Date.now() * 0.001;

        // sphereGroup.rotation.y = time * 0.1;
        // linesGroup.rotation.y = time * 0.1;
        // pointCloud.rotation.y = time * 0.1;
        renderer.render(scene, camera);
    }
}
