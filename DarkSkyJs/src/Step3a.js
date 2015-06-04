/**
 * Created by krbalmryde on 6/4/15.
 */
/**
 * Created by krbalmryde on 5/31/15.
 */
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var lineMesh;
var container, stats;
var camera, scene, renderer;
var slider, group;
var positions, colors;
var haloArray = [];
var haloCount = 0;
var particles;
var pointCloud;


/* ==========================================
 *              onCreate
 *   Initialize WebGL context, as well as
 *   Three.js variables, and Window/document
 *   Event Listeners
 * ==========================================
 */
function onCreate(json) {
    /* Setting up THREE.js stuff */

    // Create our scene
    initScene();

    // Get our Camera working
    initCamera();

    // Setup our slider
    initSlider();

    // Make some Spline Geometry
    initBufferGeometry(json);

    // Set up the Renderer
    initRenderer();

    // Setup Stats object
    initStats();

    // Setup Container stuff
    initContainer();
}


/* ================================== *
 *          onFrame
 *  Our Main rendering loop with
 *  associated draw function
 * ================================== */
function onFrame() {
    requestAnimationFrame( onFrame );
    stats.update();
    draw();

}

/* ===========================================================
 * Our draw function, will control modifications to the scene
 * Such as rotations etc. Updates the scene and camera
 * ========================================================== */
function draw() {
    display();

    var time = Date.now() * 0.001;
    lineMesh.rotation.x = time * 0.25;
    lineMesh.rotation.y = time * 0.5;
    renderer.render( scene, camera );
}

function display() {
    slider.Link('lower').to($('#value-lower'));
    slider.Link('upper').to($('#value-upper'));

    var start = slider.val()[0];
    var end = slider.val()[1];

    // Halos.slice(start, end)
}


// ==========================================
//              onReshape
// And associated Event Listeners
// ==========================================
function onReshape() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function onKeyPress( event ) {
    var key = event.keyCode;
    console.log(key);
    switch(key) {
        case 119:
            camera.position.z += 1;
            break;
        case 115:
            camera.position.z -= 1;
            break;
    }
    console.log(camera.position.z);
}


// ==========================================
//              START OF MAIN
// ==========================================

function Start(json) {
    onCreate(json);
    onFrame();
}
// ==========================================
//              START OF MAIN
// ==========================================
//$.getJSON("../assets/Halo_257.0_t12.json", Start);
