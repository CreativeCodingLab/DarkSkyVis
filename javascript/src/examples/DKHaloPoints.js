
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;

var camera, scene, renderer;

var mesh;

init();
animate();

function init() {

    //container = document.getElementById( 'Step1' );


    //

    camera = new THREE.PerspectiveCamera( 27, window.innerWidth / window.innerHeight, 1, 4000 );
    camera.position.z = 2750;

    scene = new THREE.Scene();

    var points = getPoints();

    var segments = points.length;

    var geometry = new THREE.BufferGeometry();
    var material = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors });

    var positions = new Float32Array( segments * 3 );
    var colors = new Float32Array( segments * 3 );

    var r = 800;

    for ( var i = 0; i < segments; i ++ ) {

        // var x = Math.random() * r - r / 2;
        // var y = Math.random() * r - r / 2;
        // var z = Math.random() * r - r / 2;
        var x = points[i][0];
        var y = points[i][1];
        var z = points[i][2];
        // positions

        positions[ i ] = x;
        positions[ i +1 ] = y;
        positions[ i + 2 ] = z;

        // colors
        colors[ i * 3 ] = ( x / r ) + 0.5;
        colors[ i * 3 + 1 ] = ( y / r ) + 0.5;
        colors[ i * 3 + 2 ] = ( z / r ) + 0.5;

    }

    geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

    geometry.computeBoundingSphere();

    mesh = new THREE.Line( geometry, material );
    scene.add( mesh );

    //

    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    //container.appendChild( renderer.domElement );
    document.body.appendChild(renderer.domElement);
    //

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    //container.appendChild( stats.domElement );
    document.body.appendChild(stats.domElement);
    //

    window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {

    requestAnimationFrame( animate );

    render();
    stats.update();

}

function render() {

    var time = Date.now() * 0.001;

    mesh.rotation.x = time * 0.25;
    mesh.rotation.y = time * 0.5;

    renderer.render( scene, camera );

}

function getPoints() {
   return [[ 39.58268,  43.89976,  24.72711],
            [ 40.1916 ,  43.70065,  24.50798],
            [ 40.22467,  43.67676,  24.44666],
            [ 40.21954,  43.61176,  24.35578],
            [ 40.27877,  43.57314,  24.24905],
            [ 40.35799,  43.55532,  24.19018],
            [ 40.57103,  43.48354,  24.12124],
            [ 40.74953,  43.43552,  24.14527],
            [ 40.77007,  43.46067,  24.17573],
            [ 40.71593,  43.52404,  24.26473],
            [ 40.74014,  43.53297,  24.28135],
            [ 40.70744,  43.60518,  24.34462],
            [ 40.69841,  43.63185,  24.32475],
            [ 40.72169,  43.6132,   24.34667],
            [ 40.79662,  43.60306,  24.31491],
            [ 40.81709,  43.66763,  24.34406],
            [ 40.82225,  43.70137,  24.35359],
            [ 40.77262,  43.7362,   24.38319],
            [ 40.81282,  43.75491,  24.42455],
            [ 40.87148,  43.76183,  24.4756 ],
            [ 40.85909,  43.79853,  24.48663],
            [ 40.86676,  43.82746,  24.5216 ],
            [ 40.83466,  43.84835,  24.55032],
            [ 40.82585,  43.88571,  24.58267],
            [ 40.83445,  43.92107,  24.63591],
            [ 40.87265,  43.96569,  24.64361],
            [ 40.88791,  44.01056,  24.6567 ],
            [ 40.87114,  44.10967,  24.71017],
            [ 40.87164,  44.16196,  24.75707],
            [ 40.9029 ,  44.18213,  24.79089],
            [ 40.95715,  44.19899,  24.81105],
            [ 40.97885,  44.23688,  24.84903],
            [ 41.02003,  44.27618,  24.85399],
            [ 41.03743,  44.31577,  24.85607],
            [ 41.08031,  44.38086,  24.85367],
            [ 41.11153,  44.43275,  24.85403],
            [ 41.14175,  44.4757,   24.8713 ],
            [ 41.16561,  44.52658,  24.88566],
            [ 41.18476,  44.59641,  24.90133],
            [ 41.18814,  44.66425,  24.91966],
            [ 41.19071,  44.73782,  24.9315 ],
            [ 41.19858,  44.82303,  24.93152],
            [ 41.19657,  44.89613,  24.94458],
            [ 41.1993 ,  45.00177,  24.94545],
            [ 41.18784,  45.10707,  24.94456],
            [ 41.14361,  45.1958,   24.95133],
            [ 41.10828,  45.28488,  24.94542],
            [ 41.03807,  45.38004,  24.94758],
            [ 40.89485,  45.46853,  24.94861],
            [ 40.76056,  45.46463,  24.97409],
            [ 40.70628,  45.46204,  24.99029],
            [ 40.70931,  45.45911,  24.99514],
            [ 40.75407,  45.4291,   25.00986],
            [ 40.81425,  45.36986,  25.03298],
            [ 40.90822,  45.30074,  25.05186],
            [ 41.02594,  45.22683,  25.0602 ],
            [ 41.16117,  45.15016,  25.08367],
            [ 41.06048,  45.22421,  25.08993],
            [ 41.10981,  45.1986,   25.10039],
            [ 41.22879,  45.1301,   25.11983],
            [ 41.24547,  45.13228,  25.14013],
            [ 41.17876,  45.1551,   25.15682],
            [ 41.09201,  45.17886,  25.20226],
            [ 41.09063,  45.17009,  25.20486],
            [ 41.14524,  45.12689,  25.21265],
            [ 41.12668,  45.10823,  25.21683],
            [ 41.10267,  45.1057,   25.22095],
            [ 41.08634,  45.08555,  25.22603],
            [ 41.11375,  45.06861,  25.22135],
            [ 41.13052,  45.0403,   25.2159 ],
            [ 41.12842,  45.0238,   25.21188],
            [ 41.13463,  45.00334,  25.20846],
            [ 41.15077,  44.98335,  25.20416],
            [ 41.17742,  44.9617,   25.20389],
            [ 41.20093,  44.9417,   25.20662],
            [ 41.21223,  44.92018,  25.20663],
            [ 41.23657,  44.89763,  25.20855],
            [ 41.27103,  44.87295,  25.21128],
            [ 41.30829,  44.85262,  25.21658],
            [ 41.33316,  44.84077,  25.22073],
            [ 41.34204,  44.82193,  25.22491],
            [ 41.35187,  44.80796,  25.23218],
            [ 41.36487,  44.79708,  25.2429 ],
            [ 41.37257,  44.78114,  25.25063],
            [ 41.38638,  44.76826,  25.25526],
            [ 41.39943,  44.755,    25.26396],
            [ 41.41984,  44.73745,  25.26852],
            [ 41.42377,  44.72502,  25.27643],
            [ 41.44051,  44.71505,  25.2828 ]];

}