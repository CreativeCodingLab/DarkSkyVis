/**
 * Created by krbalmryde on 5/31/15.
 */
 if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var lineMesh;
var container, stats;
var camera, scene, renderer;
var slider, box;
var head, tail;
var sliderHasChanged = false;

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

    // Get our Camera working
    initCamera();

    // Setup our slider
    initSlider();

    // Make some Spline Geometry
    createSplineGeometry(20);

    // Set up the Renderer
    initRenderer();

    // Setup Stats object
    initStats();

    // Setup Container stuff
    initContainer();
}

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

    geometry.colors = colors;
    var material = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1, linewidth: 3, vertexColors: THREE.VertexColors } );

    lineMesh = new THREE.Line(geometry, material);
    lineMesh.scale.x = lineMesh.scale.y = lineMesh.scale.z = 0.7;

    box = new THREE.BoxHelper(lineMesh);
    box.material.color.setHex( 0x080808 );
    scene.add( box );
    scene.add(lineMesh);

}


function updateGeometry(nDivisions) {
    var verts = [];
    var points = getHaloPos();
    var spline = new THREE.Spline();

    if ((tail - head) == 0) {
        spline.initFromArray(points[head]);
    } else {
        spline.initFromArray(points.slice(head,tail));
    }

    colors = [];
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
    box.update(lineMesh)
}


/* ================================== *
 *          onFrame
 *  Our Main rendering loop with
 *  associated draw function
 * ================================== */
function onFrame() {
    //lineMesh.geometry.vertices
    if ((head !== slider.val()[0]) || (tail !== slider.val()[1])) {
        console.log("they are different");
        sliderHasChanged = true;
        head = slider.val()[0];
        tail = slider.val()[1];
        updateGeometry(20);
    }

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

    //var time = Date.now() * 0.001;
    //lineMesh.rotation.x = time * 0.25;
    //lineMesh.rotation.y = time * 0.5;
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

var rotatedY = 0;
var rotatedX = 0;
function onKeyPress( event ) {
    var key = event.keyCode;
    console.log(key);
    switch (key) {
        case 119:  // w
            camera.position.z += 1;
            break;
        case 115: // s
            camera.position.z -= 1;
            break;
        case 97: // a
            camera.rotateY(0.05);
            rotatedY += 0.05;
            break;
        case 100:  // d
            camera.rotateY(-0.05);
            rotatedY -= 0.05;
            break;
        case 113: // q
            camera.rotateX(0.05);
            rotatedX += 0.05;
            break;
        case 101: // e
            camera.rotateX(-0.05);
            rotatedX -= 0.05;
            break;
    }
    console.log(lineMesh.position, camera.position.z, rotatedX, rotatedY);
}

// ==========================================
//              START OF MAIN
// ==========================================
function Start() {
    onCreate();
    onFrame();
}