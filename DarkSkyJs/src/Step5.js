/**
 * Created by krbalmryde on 6/6/15.
 */

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container;
var head, tail;
var scene, renderer;
var camera, slider;
var mouse, raycaster, ambient;
var haloObjs = [], haloStats = [];
var haloLines = [], haloSpheres = [];
var hits = [], curTarget, prevTarget;
var nDivisions = 10, NUMTIMEPOINTS = 89;
var numPoints = NUMTIMEPOINTS * nDivisions;

// ==========================================
//              Start
//    Main entry point into the application
//    Gets called by index.html
// ==========================================
function Start() {
    onCreate();
    onFrame();
}

/* ==========================================
 *              onCreate
 *   Initialize WebGL context, as well as
 *   Three.js variables, and Window/document
 *   Event Listeners
 * ==========================================
 */
function onCreate() {
    /* Setting up THREE.js stuff */

    // **** Create our scene ***
    scene = new THREE.Scene();

    // **** Adding our Group object ***
    {
        linesGroup = new THREE.Object3D();
        sphereGroup = new THREE.Object3D();

        scene.add( linesGroup );
        scene.add( sphereGroup );
    }

    // **** Lights! ***
    ambient = new THREE.AmbientLight(0x404040); //rgbToHex(197, 176, 255)
    scene.add(ambient);

    // **** Setup our slider ***
    initSlider();

    // **** creates some random and some predetermined ***
    // points
    initPointsH257();

    // **** Make some Spline Geometry ***
    // createBufferGeometry(nDivisions);
    createSplineGeometry(nDivisions);

    // **** Get our Camera working ***
    initCamera();

    //initGUI();

    // **** Setup our Raycasting stuff ***
    raycaster = new THREE.Raycaster();
    {
        mouse = new THREE.Vector2();

        // **** Have to set this so it doesnt complain! ***
        curTarget = {object: haloSpheres[head]};
        curTarget.object.material.color.set( rgbToHex(255,0,0) );  // red
        curTarget.object.material.opacity = 0.8;
        tweenToPosition(250, 250);
    }

    // **** Set up the Renderer ***
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    {
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.gammaInput = true;
        renderer.gammaOutput = true;
    }

    // **** Setup Container stuff ***
    container = document.getElementById( 'Sandbox' );
    container.appendChild( renderer.domElement );


    // **** Add listeners *** //
    window.addEventListener( 'resize', onReshape, false );
    window.addEventListener( 'mousemove', onMouseMove, false );
    window.addEventListener( 'mousedown', onMouseClick, true );
    //window.addEventListener( 'keypress', onKeyPress, false );

}


function initCamera() {
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
    {

        // **** position the camera near the first halo; ***
        var pos = sphereGroup.children[30].position;
        camera.position.set(pos.x, pos.y+0.1, pos.z-(pos.z*0.05));

        controls = new THREE.TrackballControls( camera );
        {
            controls.rotateSpeed = 4.0;
            controls.zoomSpeed = 5.2;
            controls.panSpeed = 3.8;

            controls.noZoom = false;
            controls.noPan = false;

            controls.staticMoving = false;
            controls.dynamicDampingFactor = 0.3;

            controls.keys = [ 65, 83, 68 ];
            controls.enabled = true;
        }
        camera.lookAt(pos);
        controls.target.set(pos.x, pos.y, pos.z);
        controls.update();
    }
}


// ==========================================
//              onReshape, onMouseMove
// And associated Event Listeners
// ==========================================
function onReshape() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}


function onMouseMove( event ) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}


function onMouseClick() {
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera( mouse, camera );
    // calculate objects intersecting the picking ray
    var hit = raycaster.intersectObjects( sphereGroup.children )[0];
    if (hit && hit.object.material.opacity !== 0.0) {
        console.log("we got something!", hit);
        if (!prevTarget)
            prevTarget = curTarget = hit;
        else {
            prevTarget = curTarget;
            curTarget = hit;
        }

        prevTarget.object.material.color.set( rgbToHex(255,255,255) );
        prevTarget.object.material.opacity = 0.1;
        curTarget.object.material.color.set( rgbToHex(255,0,0) );

        tweenToPosition();
    }
}


function tweenToPosition(durationA, durationB) {
    TWEEN.removeAll();

    durationA = (durationA) ? durationA: 1500;
    durationB = (durationB) ? durationB : 500;

    console.log("durations:", durationA, durationB);

    var cameraPosition = camera.position;  // The current Camera position
    var currentLookAt = controls.target;   // The current lookAt position

    var haloDestination = {   // Our destination
        x: curTarget.object.position.x,
        y: curTarget.object.position.y,
        //z: curTarget.object.position.z - (curTarget.object.position.z * .03)  // put us a little bit away from the point
        z: curTarget.object.position.z  // put us a little bit away from the point
    };

    var zoomDestination = {
        x: haloDestination.x,
        y: haloDestination.y,
        z: haloDestination.z - (haloDestination.z * .03)  // put us a little bit away from the point
    };

    // Frist we position the camera so it is looking at our Halo of interest
    var tweenLookAt = new TWEEN.Tween(currentLookAt)
        .to(haloDestination, durationA)
        .onUpdate(function() {
            controls.target.set(currentLookAt.x, currentLookAt.y, currentLookAt.z);
        });

    // Then we zoom in
    var tweenPosition = new TWEEN.Tween(cameraPosition)
        .to(zoomDestination, durationB)
        .onUpdate(function() {
            camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
            controls.update();
        });

    tweenLookAt.chain(tweenPosition);
    tweenLookAt.start();
}

/* ================================== *
 *          onFrame
 *  Our Main rendering loop with
 *  associated draw function
 * ================================== */
function onFrame() {
    var sliderVal0 = parseInt(slider.val()[0]);
    var sliderVal1 = parseInt(slider.val()[1]);

    if ((head !== sliderVal0) || (tail !== sliderVal1)) {
        head = sliderVal0;
        tail = sliderVal1;
        updateAllTheGeometry(nDivisions);
    }
    requestAnimationFrame( onFrame );
    TWEEN.update();
    render();
}


function render() {
    raycaster.setFromCamera( mouse, camera );

    // This loop is to set the captured moused over halos back to their
    // original color once we have moved the mouse away
    if (hits.length > 0) {
        for (var i = 0; i < hits.length; i++) {
            if (hits[i].object.position !== curTarget.object.position && hits[i].object.material.opacity !== 0.0) {
                hits[i].object.material.color.set( rgbToHex(255, 255, 255) );
                hits[i].object.material.opacity = 0.2;
            } else if (hits[i].object.position === curTarget.object.position && hits[i].object.material.opacity !== 0.0) {
                curTarget.object.material.color.set( rgbToHex(255,0,0) );  // line green
                curTarget.object.material.opacity = 0.8;
            }
        }
    }

    hits = raycaster.intersectObjects( sphereGroup.children );

    // This loop is to set the captured moused over halos to yellow to highlight
    // that weve moved over them
    if (hits.length > 0) {
        for (var i = 0; i < hits.length; i++) {
            if (hits[i].object.position !== curTarget.object.position && hits[i].object.material.opacity !== 0.0){
                hits[i].object.material.color.set( rgbToHex(255, 255, 0) ); // yellow
                hits[i].object.material.opacity = 0.8;
            } else if (hits[i].object.position === curTarget.object.position && hits[i].object.material.opacity !== 0.0) {
                curTarget.object.material.color.set( rgbToHex(255,0,0) );
                hits[i].object.material.opacity = 0.8;
            }

        }
    }
    controls.update();
    renderer.render( scene, camera );
}

function createSplineGeometry(nDivisions) {
    head = parseInt(slider.val()[0]);
    tail = parseInt(slider.val()[1]);
    var color = d3.scale.category10();

    var index, xyz;
    for (var i = 0; i < haloLines.length; i++) {
        var colors = [];
        var points = haloLines[i];
        var spline = new THREE.Spline();
        spline.initFromArray(points.slice(head,tail));
        var splineGeomentry = new THREE.Geometry();

        if ( i === 0 ){
            createSphereGeometry();
        }

        for (var j = 0; j < numPoints ; j++ ) {
            index = j / (numPoints);
            xyz = spline.getPoint(index);

            splineGeomentry.vertices[j] = new THREE.Vector3( xyz.x, xyz.y, xyz.z );
            if (i === 0)
                colors[ j ] = new THREE.Color(1.0, 1.0, 1.0);
            else
                //colors[ j ] = new THREE.Color( 0.0 , (j / (numPoints)), (Math.random()));
                colors[ j ] = new THREE.Color( color(i) );
        }
        splineGeomentry.colors = colors;
        splineGeomentry.computeBoundingSphere();
        var material = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: (i === 0)? 2 : 1.5,
            vertexColors: THREE.VertexColors
        });
        var mesh = new THREE.Line(splineGeomentry, material);
        //mesh.updateMatrix();
        haloObjs.push(mesh);
        linesGroup.add(mesh);
    }
}

function createSphereGeometry() {
    // Halo Lines [0] is the main halopath
    var points = haloLines[0];
    var spline = new THREE.Spline();
    spline.initFromArray(points);
    var controlPoints = spline.getControlPointsArray();

    for (var i = 0; i < controlPoints.length; i++) {
        var hl = controlPoints[i];
        var halo = haloStats[i];
        var sphereGeometry = new THREE.SphereGeometry(halo.radius / halo.rScale * 6);

        sphereGeometry.color = new THREE.Color((Math.random() ), (i / (numPoints)), (Math.random()));

        var sphereMesh = new THREE.Mesh(
            sphereGeometry,
            new THREE.MeshBasicMaterial({
                color: rgbToHex(255, 255, 255) ,
                vertexColors: THREE.VertexColors,
                transparent: true,
                opacity: (i < head || i > tail) ? 0.0 : 0.2
            })
        );

        sphereMesh.position.set( hl[0], hl[1], hl[2]);
        sphereMesh.updateMatrix();
        haloSpheres.push(sphereMesh);
        sphereGroup.add(sphereMesh)
    }
}


function updateAllTheGeometry(nDivisions) {
    var color = d3.scale.category10();

    for (var i = 0; i < haloLines.length; i++) {
        var points = haloLines[i];
        var spline = new THREE.Spline();

        if ((tail - head) == 0) {
            spline.initFromArray(points[head]);
        } else {
            spline.initFromArray(points.slice(head, tail));
        }

        if ( i === 0 ){
            updateSpheres();
        }

        var verts = [], colors = [];
        for (var j = 0; j < points.length * nDivisions; j++) {
            var index = j / (points.length * nDivisions);
            var xyz = spline.getPoint(index);
            verts[j] = new THREE.Vector3(xyz.x, xyz.y, xyz.z);
            if (i === 0)
                colors[j] = new THREE.Color(1.0, 1.0, 1.0);
            else
                colors[ j ] = new THREE.Color( color(i) );
                //colors[ j ] = new THREE.Color( 0.0, (j / (numPoints)), (Math.random()));

        }
        haloObjs[i].geometry.vertices = verts;
        haloObjs[i].geometry.colors = colors;
        haloObjs[i].geometry.computeBoundingSphere();  // wonder what this is for?
        haloObjs[i].geometry.verticesNeedUpdate = true;
        haloObjs[i].geometry.colorsNeedUpdate = true;
    }
}

function updateSpheres() {
    //Adjust the sphere's opacity!
    var index;
    for (var i = 0; i < haloSpheres.length; i++) {
        haloSpheres[i].material.opacity = (i < head || i >= tail) ? 0.0 : 0.2;
    }
    if ((tail - head) == 0)
        curTarget.object = haloSpheres[head];
    else {
        index = parseInt(head + (tail - head)/2);
        curTarget.object = haloSpheres[index];
    }
    curTarget.object.material.color.set( rgbToHex(255,0,0) );  // line green
    curTarget.object.material.opacity = 0.8;
    tweenToPosition();
}

function initPointsH257() {
    var haloPath = [];
    var particlePaths = {};
    var pIDS = [1565818, 1565821, 1565822, 1565928, 1566041, 1566042, 1566145, 1566149];
    for (var i = 0; i < HALO257.length; i++) {
        var halo = HALO257[i];
        haloPath.push(halo.xyz);
        haloStats.push({radius: halo.rvir, rScale: halo.rs, rs: halo.rvir * halo.rs});
        for (var j = 0; j < halo.particles.length; j++) {
            var part = halo.particles[j];

            if (part.id in particlePaths)
                particlePaths[part.id].push([part.x, part.y, part.z]);
            else
                particlePaths[part.id] = [[part.x, part.y, part.z]];
        }

        // Check to make sure the arrays are all the same length.
        if (halo.particles.length < pIDS.length) {
            for (var k = 0; k < pIDS.length; k++) {
                id = pIDS[k];
                // The logic here is that if we are missing any entries, due to the particle moving outside the
                // bounds of the halos influence, then replace the missing value with the current Halos xyz
                if (particlePaths[id].length < i + 1) {
                    particlePaths[id].push(halo.xyz)
                }
            }
        }
    }
    haloLines.push(haloPath);
    for (var k = 0; k < pIDS.length; k++) {
        id = pIDS[k];
        haloLines.push(particlePaths[id]);
    }
}


function initSlider() {
    // console.log("\t initSlider()");
    slider = $('.tslider');
    slider.noUiSlider({
        start: [25, 50],
        connect: true,  // shows areas of coverage
        orientation: "vertical",
        direction: "ltr",  //
        behaviour: 'drag-tap',  // allows user to drag center around
        step: 1,  // steps between values
        format: wNumb({   // determines number format
            decimals: 0
        }),
        range: {   // min and max of range
            'min': [0],
            '25%': [25],
            '50%': [50],
            '75%': [75],
            'max': [88]
        }
    });

    slider.noUiSlider_pips({
        mode: 'count',
        values: 5,
        density: 3
    });

    slider.Link('lower').to($('#value-lower'));
    slider.Link('upper').to($('#value-upper'));
}


function rgbToHex(R,G,B){
    function toHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    return "#" + toHex(R) + toHex(G) + toHex(B)
}

/* ===========================================================
 * Our onKeyPress function. Rudimentary camera controls meant
 * primarily for debugging purposes
 * ========================================================== */
function onKeyPress( event ) {
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
        case 105:  //
            camera.rotateX(0.05);
            break;
        case 107: // k
            camera.rotateX(-0.05);
            break;
        case 106: // j
            camera.rotateY(0.05);
            break;
        case 108:  // l
            camera.rotateY(-0.05);
            break;
        case 117: //u
            camera.rotateZ(0.05);
            break;
        case 111: // o
            camera.rotateZ(-0.05);
            break;
        case 32: //0
            camera.lookAt(scene.position);
            var pos = sphereGroup.children[30].position;
            //var pos2 = curTarget.object.position;
            //console.log(pos, pos2)
            camera.position.set(pos.x, pos.y, pos.z);
            camera.lookAt(pos);
            //controls.reset();
            controls.update();
            console.log(controls);

    }
    console.log( camera, camera.position, camera.rotation);
}


function initGUI() {
    var options = {
        message: "Halos in a Dark Sky",
        reset: function() {

        }
    };

    var gui = new dat.GUI();
    gui.add(options, "message");
    gui.add(options, "reset");

}
