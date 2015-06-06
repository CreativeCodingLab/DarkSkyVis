/**
 * Created by krbalmryde on 5/31/15.
 */
 if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var lineMesh;
var container, stats;
var camera, scene, renderer;
var slider, box;
var head, tail;
var nDivisions = 5;
var haloObjs = [], offsets = [];
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
    scene = new THREE.Scene();

    // Adding our Group object
    group = new THREE.Group();
    scene.add( group );

    root = new THREE.Object3D();

    // Get our Camera working
    initCamera();

    // Setup our slider
    initSlider();

    // creates some random and some predetermined
    // points
    initPoints(5);

    // Make some Spline Geometry
    //createSplineGeometry(nDivisions);
    createLotsOfLines(nDivisions);

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


// ==========================================
//              onReshape
// And associated Event Listeners
// ==========================================
function onReshape() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}


/* ===========================================================
 * Our draw function, will control modifications to the scene
 * Such as rotations etc. Updates the scene and camera
 * ========================================================== */
function draw() {
    slider.Link('lower').to($('#value-lower'));
    slider.Link('upper').to($('#value-upper'));

    if ((head !== slider.val()[0]) || (tail !== slider.val()[1])) {
        console.log("they are different");
        head = slider.val()[0];
        tail = slider.val()[1];
        //updateGeometry(nDivisions);
        updateAllTheGeometry(nDivisions);
        //box.update(lineMesh)
    }

    //var time = Date.now() * 0.001;
    //lineMesh.rotation.x = 0.25 * time;
    //lineMesh.rotation.y = 0.25 * time;
    renderer.render( scene, camera );
}


/* ===========================================================
 * Our handleKeys function. Rudimentary camera controls meant
 * primarily for debugging purposes
 * ========================================================== */
function handleKeys( event ) {
    var key = event.keyCode;
    console.log(key);
    switch (key) {
        case 119:  // w
            camera.position.z += 0.1;
            break;
        case 115: // s
            camera.position.z -= 0.1;
            break;
        case 97: // a
            camera.position.x += 0.1;
            break;
        case 100: // d
            camera.position.x -= 0.1;
            break;
        case 113:  // q
            camera.position.y += 0.1;
            break;
        case 101: // e
            camera.position.y -= 0.1;
            break;

        case 105:  // i
            camera.rotateZ(0.05);
            break;
        case 107: // k
            camera.rotateZ(-0.05);
            break;
        case 106: // j
            camera.rotateY(0.05);
            break;
        case 108:  // l
            camera.rotateY(-0.05);
            break;
        case 117: //u
            camera.rotateX(0.05);
            break;
        case 111: // o
            camera.rotateX(-0.05);
            break;


    }
    console.log( camera.position, camera.rotation);
}

// Initialization function which creates our
// Geometry for the first time
function createSplineGeometry(nDivisions) {
    head = slider.val()[0];
    tail = slider.val()[1];

    var index, xyz;
    var colors = [];
    var geometry = new THREE.Geometry();
    var points = getHaloPos();

    var spline = new THREE.Spline();
        spline.initFromArray(points.slice(head,tail));

    var max = points.length * nDivisions;
    for (var i = 0; i < points.length * nDivisions ; i++ ) {
        index = i / (points.length * nDivisions);
        xyz = spline.getPoint(index);

        geometry.vertices[i] = new THREE.Vector3( xyz.x, xyz.y, xyz.z );

        colors[ i ] = new THREE.Color((Math.random()), (i / max), (Math.random()));
    }
    geometry.computeLineDistances();
    geometry.colors = colors;
    var material = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1, linewidth: 3, vertexColors: THREE.VertexColors } );

    lineMesh = new THREE.Line(geometry, material);

    box = new THREE.BoxHelper(lineMesh);
    box.material.color.setHex( 0x080808 );
    scene.add( box );
    scene.add(lineMesh);

}


function createLotsOfLines(nDivisions) {
    head = slider.val()[0];
    tail = slider.val()[1];

    var index, xyz;
    for (var i = 0; i < 10; i++) {

        var colors = [];
        var points = haloPoints[i];
        var spline = new THREE.Spline();
        console.log("points", points);
        spline.initFromArray(points.slice(head,tail));
        var splineGeomentry = new THREE.Geometry();

        for (var j = 0; j < points.length * nDivisions ; j++ ) {
            index = j / (points.length * nDivisions);
            xyz = spline.getPoint(index);

            splineGeomentry.vertices[j] = new THREE.Vector3( xyz.x, xyz.y, xyz.z );
            colors[ j ] = new THREE.Color((Math.random()), (j / (points.length * nDivisions)), (Math.random()));
        }
        splineGeomentry.computeLineDistances();
        splineGeomentry.colors = colors;
        var material = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1, linewidth: 3, vertexColors: THREE.VertexColors } );
        var mesh = new THREE.Line(splineGeomentry, material);
        haloObjs.push(mesh);
        scene.add(mesh);
    }
}

// Update function which updates our
// Geometry for subsequent passes
function updateGeometry(nDivisions) {
    var verts = [];
    var points = getHaloPos();
    var spline = new THREE.Spline();

    if ((tail - head) == 0) {
        spline.initFromArray(points[head]);
    } else {
        spline.initFromArray(points.slice(head,tail));
    }

    var colors = [];
    var max = points.length * nDivisions;
    for (var i = 0; i < points.length * nDivisions ; i++ ) {
        index = i / (points.length * nDivisions);
        xyz = spline.getPoint(index);

        verts[i] = new THREE.Vector3( xyz.x, xyz.y, xyz.z );
        colors[ i ] = new THREE.Color((Math.random()), (i / max), (Math.random()));
    }
    lineMesh.geometry.vertices = verts;
    lineMesh.geometry.colors = colors;
    lineMesh.geometry.verticesNeedUpdate = true;
    lineMesh.geometry.colorsNeedUpdate = true;
}


function updateAllTheGeometry(nDivisions) {
    for (var i = 0; i < 10; i++) {
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
            colors[ j ] = new THREE.Color((Math.random() * offsets[i]), (j / (points.length * nDivisions)), (Math.random()));
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