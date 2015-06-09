if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var renderer, scene, camera, stats;

var particles, uniforms, attributes;

var PARTICLE_SIZE = 20;

var raycaster, intersects;
var mouse, INTERSECTED;

init();
animate();

function init() {

    container = document.getElementById( 'container' );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 250;

    //

    attributes = {

        size:        { type: 'f', value: [] },
        customColor: { type: 'c', value: [] }

    };

    uniforms = {

        color:   { type: "c", value: new THREE.Color( 0xffffff ) },
        texture: { type: "t", value: THREE.ImageUtils.loadTexture( "textures/sprites/disc.png" ) }

    };

    var shaderMaterial = new THREE.ShaderMaterial( {

        uniforms: uniforms,
        attributes: attributes,
        vertexShader: document.getElementById( 'vertexshader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentshader' ).textContent,

        alphaTest: 0.9,

    } );

    var geometry = new THREE.BoxGeometry( 200, 200, 200, 16, 16, 16 );

    particles = new THREE.PointCloud( geometry, shaderMaterial );

    var values_size = attributes.size.value;
    var values_color = attributes.customColor.value;

    var vertices = particles.geometry.vertices;

    for( var v = 0,  vl = vertices.length; v < vl; v++ ) {

        values_size[ v ] = PARTICLE_SIZE * 0.5;

        values_color[ v ] = new THREE.Color().setHSL( 0.01 + 0.1 * ( v / vl ), 1.0, 0.5 );

    }

    scene.add( particles );

    //

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    //

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2()

    //

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild( stats.domElement );

    //

    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );

}

function onDocumentMouseMove( event ) {

    event.preventDefault();

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );

    render();
    stats.update();

}

function render() {

    particles.rotation.x += 0.0005;
    particles.rotation.y += 0.001;

    raycaster.setFromCamera( mouse, camera );

    intersects = raycaster.intersectObject( particles );

    if ( intersects.length > 0 ) {

        if ( INTERSECTED != intersects[ 0 ].index ) {

            attributes.size.value[ INTERSECTED ] = PARTICLE_SIZE;

            INTERSECTED = intersects[ 0 ].index;

            attributes.size.value[ INTERSECTED ] = PARTICLE_SIZE * 1.25;
            attributes.size.needsUpdate = true;

        }

    } else if ( INTERSECTED !== null ) {

        attributes.size.value[ INTERSECTED ] = PARTICLE_SIZE;
        attributes.size.needsUpdate = true;
        INTERSECTED = null;

    }

    renderer.render( scene, camera );

}