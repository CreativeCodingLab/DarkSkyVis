/**
 * Created by krbalmryde on 5/31/15.
 */
 if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var lineMesh;
var container, stats;
var camera, scene, renderer;
var slider;

/* ==========================================
 *              onCreate
 *   Initialize WebGL context, as well as
 *   Three.js variables, and Window/document
 *   Event Listeners
 * ==========================================
 */
function onCreate() {

    /* Setting up THREE.js stuff */

    // Create our scene
    scene = new THREE.Scene();

    // Get our Camera working
    camera = new THREE.PerspectiveCamera(33, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 100;

    // Set up the Renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    // Setup our slider
    createSlider();

    // Setup Stats object
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';

    // Make some Spline Geometry
    createSplineGeometry(20);

    // Setup Container stuff
    container = document.getElementById( 'Sandbox' );
    container.appendChild( renderer.domElement );
    container.appendChild( stats.domElement );

    // Add listeners
    document.addEventListener( 'keypress', onKeyPress, false );
    window.addEventListener( 'resize', onReshape, false );
}


function createSplineGeometry( nDivisions ) {
    var segments = 10;
    var colors = [];
    var geometry = new THREE.Geometry();
    var points = generatePoints(segments);
    var spline = new THREE.Spline();
        spline.initFromArray(points);

    var index, xyz;
    for (var i = 0; i < points.length * nDivisions ; i++ ) {
        index = i / (points.length * nDivisions);
        xyz = spline.getPoint(index);

        geometry.vertices[i] = new THREE.Vector3( xyz.x, xyz.y, xyz.z );

        colors[ i ] = new THREE.Color((xyz.x / 100), (xyz.y / 100), (xyz.z / 100));
    }
    geometry.colors = colors;
    var material = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1, linewidth: 3, vertexColors: THREE.VertexColors } );

    lineMesh = new THREE.Line(geometry, material);
    lineMesh.scale.x = lineMesh.scale.y = lineMesh.scale.z = 0.3*.15;
    scene.add( lineMesh );
}


/* ================================== *
 *          onFrame
 *  Our Main rendering loop with
 *  associated draw function
 * ================================== */
function onFrame() {
    requestAnimationFrame( onFrame );
    draw();
    display();
    stats.update();
}

/* ===========================================================
 * Our draw function, will control modifications to the scene
 * Such as rotations etc. Updates the scene and camera
 * ========================================================== */
function draw() {
    // var time = Date.now() * 0.001;

    // lineMesh.rotation.x = time * 0.25;
    // lineMesh.rotation.y = time * 0.5;
    renderer.render( scene, camera );
}

function display() {
    console.log(slider.val())
    slider.Link('lower').to($('#value-lower'))
    slider.Link('upper').to($('#value-upper'))

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
    console.log(key)
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
function Start() {
    onCreate();
    onFrame();
}