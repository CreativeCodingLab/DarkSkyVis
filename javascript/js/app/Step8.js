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
var pointCloud, DEFERRED = true;
var DEFERRED_COUNT = 0;

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
    getHaloTreeData("js/assets/tree_676638.json")
        .then(function(response) {
            //console.log("Fuck Yeah!", typeof response, response);
            initHaloTree(response, true);
        }).then(function(value) {
            //console.log("then..", value);

            // **** Lights! ***
            initLights();

            // **** Camera! ***
            initCamera();

            // **** Setup our Raycasting stuff ***
            initRayCaster();

            // **** Action! Listeners *** //
            initListeners();

        });

}

/* ================================== *
 *          onFrame
 *  Our Main rendering loop with
 *  associated draw function
 * ================================== */
function onFrame(time) {

    var sliderVal0 = parseInt(slider.val()[0]);
    var sliderVal1 = parseInt(slider.val()[1]);

    if ((EPOCH_HEAD !== sliderVal0) || (EPOCH_TAIL !== sliderVal1)) {

        EPOCH_HEAD = sliderVal0;
        EPOCH_TAIL = sliderVal1;
        updateAllTheGeometry();
    }
    requestAnimationFrame( onFrame );
    TWEEN.update(time);
    render();

}

/* ================================== *
 *          render
 *  Our render function which renders
 *  the scene and its associated objects
 * ================================== */
function render() {

    if (!DEFERRED) {
        DEFERRED_COUNT = 0;
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
    //else {
    //    DEFERRED_COUNT++;
    //    console.log("DEFERRED!!", DEFERRED_COUNT);
    //    if (DEFERRED_COUNT >= 200)
    //        showSpinner(true, DEFERRED_COUNT);
    //}
}


