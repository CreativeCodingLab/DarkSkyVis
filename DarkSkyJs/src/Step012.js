/**
 * Created by krbalmryde on 5/31/15.
 */
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var lineMesh;
var container, stats;
var camera, scene, renderer;
var camera0, camera1, camera2;

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

function setUpCameras() {
    camera0 = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000 );
    camera0.position.z = 1600;

    camera1 = new THREE.PerspectiveCamera(33, window.innerWidth / window.innerHeight, 1, 1000 );
    camera1.position.z = 100;

    camera2 = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000 );
    camera2.position.set(0, 500, -2000);
    camera2.rotateY(-2.5);
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
        geometry.faces[i].vertexColors.push( new THREE.Color().setHSL( i / il * Math.random(), 0.5, 0.5 ) );
        geometry.faces[i].vertexColors.push( new THREE.Color().setHSL( i / il * Math.random(), 0.5, 0.5 ) );
        geometry.faces[i].vertexColors.push( new THREE.Color().setHSL( i / il * Math.random(), 0.5, 0.5 ) );
        geometry.faces[i].vertexColors.push( new THREE.Color().setHSL( i / il * Math.random(), 0.5, 0.5 ) );
    }
}
