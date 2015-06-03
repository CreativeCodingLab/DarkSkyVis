/**
 * Created by krbalmryde on 5/31/15.
 */
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var lineMesh;
var container, stats;
var camera, scene, renderer;

/* ==========================================
 *              onCreate
 *   Initialize WebGL context, as well as
 *   Three.js variables, and Window/document
 *   Event Listeners
 * ========================================== */
function onCreate() {

    // Setup THREE.js stuff
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 1600;

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    // Setup Stats object
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';

    createBufferGeometry();

    // Setup Container stuff
    container = document.getElementById( 'Step1' );
    container.appendChild( renderer.domElement );
    container.appendChild( stats.domElement );

    // Add listeners
    document.addEventListener( 'keypress', onKeyPress, false );
    window.addEventListener( 'resize', onReshape, false );
}


function createBufferGeometry() {

    var segments = 10;
    var colors = new Float32Array( segments * 3 );
    var positions = new Float32Array( segments * 3 );
    for (var i = 0; i < positions.length; i++ ) {

        var xyz = randPoint3D();
        positions[ i*3 + 0 ] = xyz[0];
        positions[ i*3 + 1 ] = xyz[1];
        positions[ i*3 + 2 ] = xyz[2];

        colors[ i*3 + 0 ] = xyz[0] / 100;
        colors[ i*3 + 1 ] = xyz[1] / 100;
        colors[ i*3 + 2 ] = xyz[2] / 100;

    }

    var buffGeometry = new THREE.BufferGeometry();
    var material = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 3, vertexColors: THREE.VertexColors } );

    buffGeometry.addAttribute( 'position', new THREE.BufferAttribute(positions, 3) );
    buffGeometry.addAttribute( 'color', new THREE.BufferAttribute(colors, 3) );

    //buffGeometry.computeBoundingSphere();

    lineMesh = new THREE.Line(buffGeometry, material);
    scene.add( lineMesh );
}

/* ================================== *
 *          onFrame
 *  Our Main rendering loop with
 *  associated draw function
 * ================================== */
function onFrame() {
    requestAnimationFrame( onFrame );
    drawStep0();
    stats.update();
}

/*
 * Our draw function, will control modifications to the scene
 * Such as rotations etc. Updates the scene and camera
 */
function drawStep0() {
    var time = Date.now() * 0.001;

    lineMesh.rotation.x = time * 0.25;
    lineMesh.rotation.y = time * 0.5;

    renderer.render( scene, camera );
}


// ==========================================
//              onReshape
//   And associated Event Listeners
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
            camera.position.z += 10;
            break;
        case 115:
            camera.position.z -= 10;
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