/**
 * Created by krbalmryde on 5/31/15.
 */
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var tubeMesh;
var container, stats;
var light, camera, scene, renderer;

/* ==========================================
 *              onCreate
 *   Initialize WebGL context, as well as
 *   Three.js variables, and Window/document
 *   Event Listeners
 * ==========================================
 */
function onCreate() {

    // Setup THREE.js stuff
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000 );
    camera.position.set(0, 500, -2000);
    camera.rotateY(-2.5);

    var light1 = new THREE.AmbientLight( 0xffffff );
    light1.position.set( 0, 50, -500 );

    var light2 = new THREE.DirectionalLight( 0xffffff );
    light2.position.set(0, 50, 500);

    scene.add(light1);
    scene.add(light2);

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    // Setup Stats object
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';

    createExtrudeGeometry();

    // Setup Container stuff
    container = document.getElementById( 'Step2' );
    container.appendChild( renderer.domElement );
    container.appendChild( stats.domElement );

    // Add listeners
    document.addEventListener( 'keypress', onKeyPress, false );
    window.addEventListener( 'resize', onReshape, false );
}


function createExtrudeGeometry() {
    var segments = 64;
    var radius = 10.0;
    var radiusSegments = 10;
    var extrudePath = new THREE.ClosedSplineCurve3(generateVecs(10));

    var geometry = new THREE.TubeGeometry(extrudePath, segments, radius, radiusSegments, 0.0);
    generateVertexColors(geometry);
    console.log(geometry);
    var lambertMaterial = new THREE.MeshLambertMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors } );
    var basicMaterial = new THREE.MeshBasicMaterial({color:0x000000, opacity: 0.3, wireframe: true, transparent: true });

    tubeMesh = new THREE.SceneUtils.createMultiMaterialObject( geometry, [ lambertMaterial, basicMaterial ] ) ;
    tubeMesh.scale.set(16, 16, 16);

    scene.add(tubeMesh);

}

function generateVertexColors ( geometry ) {

    for ( var i=0, il = geometry.faces.length; i < il; i++ ) {

        geometry.faces[i].vertexColors.push( new THREE.Color().setHSL(
            i / il * Math.random(),
            0.5,
            0.5
        ) );
        geometry.faces[i].vertexColors.push( new THREE.Color().setHSL(
            i / il * Math.random(),
            0.5,
            0.5
        ) );
        geometry.faces[i].vertexColors.push( new THREE.Color().setHSL(
            i / il * Math.random(),
            0.5,
            0.5
        ) );

        geometry.faces[i].color = new THREE.Color().setHSL(
            i / il * Math.random(),
            0.5,
            0.5
        );
    }
}

/* ================================== *
 *          onFrame
 *  Our Main rendering loop with
 *  associated draw function
 * ================================== */
function onFrame() {
    requestAnimationFrame( onFrame );
    drawStep2();
    stats.update();
}

/*
 * Our draw function, will control modifications to the scene
 * Such as rotations etc. Updates the scene and camera
 */
function drawStep2() {
    //var time = Date.now() * 0.001;

    //tubeMesh.rotation.z = time * 0.25;
    //tubeMesh.rotation.y = time * 0.5;

    renderer.render( scene, camera );
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
    switch(key) {
        case 119:  // w
            camera.position.z += 10;
            break;
        case 115: // s
            camera.position.z -= 10;
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
    console.log(camera.position.z, rotatedX, rotatedY);
}

// ==========================================
//              START OF MAIN
// ==========================================
function Start2() {
    onCreate();
    onFrame();
}