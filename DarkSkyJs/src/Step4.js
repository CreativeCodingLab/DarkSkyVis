/**
 * Created by krbalmryde on 6/6/15.
 */

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container;
var scene, renderer;
var camera, slider;
var head, tail;
var nDivisions = 10;
var haloObjs = [];
var haloPoints = [];


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
    initScene();

    // Get our Camera working
    initCamera();

    // Setup our slider
    initSlider();

    // creates some random and some predetermined
    // points
    initPointsH257();

    // Make some Spline Geometry
    createSplineGeometry(nDivisions);

    // Set up the Renderer
    initRenderer();

    // Setup Container stuff
    initContainer();

    // Create controls
    initOrbit();

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


/* ================================== *
 *          onFrame
 *  Our Main rendering loop with
 *  associated draw function
 * ================================== */
function onFrame() {
    if ((head !== slider.val()[0]) || (tail !== slider.val()[1])) {
        head = slider.val()[0];
        tail = slider.val()[1];
        updateAllTheGeometry(nDivisions);
    }
    requestAnimationFrame( onFrame );
    renderer.render( scene, camera );
}


/* ===========================================================
 * Our handleKeys function. Rudimentary camera controls meant
 * primarily for debugging purposes
 * ========================================================== */
function createSplineGeometry(nDivisions) {
    head = slider.val()[0];
    tail = slider.val()[1];

    var index, xyz;
    for (var i = 0; i < haloPoints.length; i++) {
        var colors = [];
        var points = haloPoints[i];
        var spline = new THREE.Spline();
        spline.initFromArray(points.slice(head,tail));
        var splineGeomentry = new THREE.Geometry();

        for (var j = 0; j < points.length * nDivisions ; j++ ) {
            index = j / (points.length * nDivisions);
            xyz = spline.getPoint(index);

            splineGeomentry.vertices[j] = new THREE.Vector3( xyz.x, xyz.y, xyz.z );
            if (i === 0)
                colors[ j ] = new THREE.Color(1.0, 1.0, 1.0);
            else
                colors[ j ] = new THREE.Color(0 , (j / (points.length * nDivisions)), (Math.random() * i));
        }

        splineGeomentry.colors = colors;
        var material = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1, linewidth: (i == 0)? 3 :1 , vertexColors: THREE.VertexColors } );
        var mesh = new THREE.Line(splineGeomentry, material);
        mesh.updateMatrix();
        mesh.matrixAutoUpdate = false;

        haloObjs.push(mesh);
        scene.add(mesh);
    }
}


function updateAllTheGeometry(nDivisions) {
    for (var i = 0; i < haloPoints.length; i++) {
        var points = haloPoints[i];
        var spline = new THREE.Spline();

        if ((tail - head) == 0) {
            spline.initFromArray(points[head]);
        } else {
            spline.initFromArray(points.slice(head,tail));
        }

        var verts = [], colors = [];
        for (var j = 0; j < points.length * nDivisions ; j++ ) {
            var index = j / (points.length * nDivisions);
            var xyz = spline.getPoint(index);
            verts[ j ] = new THREE.Vector3( xyz.x, xyz.y, xyz.z );
            if (i === 0)
                colors[ j ] = new THREE.Color(1.0, 1.0, 1.0);
            else
                colors[ j ] = new THREE.Color(0, (j / (points.length * nDivisions)), (Math.random()));

        }
        haloObjs[i].geometry.vertices = verts;
        haloObjs[i].geometry.colors = colors;
        haloObjs[i].geometry.verticesNeedUpdate = true;
        haloObjs[i].geometry.colorsNeedUpdate = true;
    }
}


// ==========================================
//              START OF MAIN
// ==========================================
function Start() {
    onCreate();
    onFrame();
}