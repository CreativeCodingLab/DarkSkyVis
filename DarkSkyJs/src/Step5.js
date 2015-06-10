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

    // **** Setup our Raycasting stuff ***
    raycaster = new THREE.Raycaster();
    {
        mouse = new THREE.Vector2();

        // **** Have to set this so it doesnt complain! ***
        curTarget = {object: {position: null, material: {color: null }}};
    }

    // **** Setup our slider ***
    initSlider();

    // **** creates some random and some predetermined ***
    // points
    initPointsH257();

    // **** Make some Spline Geometry ***
    // createBufferGeometry(nDivisions);
    createSplineGeometry(nDivisions);


    // **** Get our Camera working ***
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
    {

        // **** position the camera near the first halo; ***
        var pos = sphereGroup.children[0].position;
        camera.position.set(pos.x, pos.y+0.1, pos.z-0.3);
        camera.lookAt(new THREE.Vector3(57.877390714719766, 32.202756939204875, 51.225539800452616));
        camera.updateMatrix();

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



    // **** Create controls ***
    // // Trackball control
    // controls = new THREE.TrackballControls( camera );
    // {

    //     controls.rotateSpeed = 1.0;
    //     controls.zoomSpeed = 1.2;
    //     controls.panSpeed = 0.8;

    //     controls.noZoom = false;
    //     controls.noPan = false;

    //     controls.staticMoving = true;
    //     controls.dynamicDampingFactor = 0.3;

    //     controls.keys = [ 65, 83, 68 ];
    //     controls.addEventListener( 'change', onFrame );
    // }


    // // Orbig Controls
    controls = new THREE.OrbitControls( camera, container );
    {
        // un-elegant setting of the first sphere.
        controls.target.set(57.877390714719766, 32.202756939204875, 51.225539800452616);
        controls.update();
    }

    // **** Add listeners *** //
    window.addEventListener( 'resize', onReshape, false );
    window.addEventListener( 'mousemove', onMouseMove, false );
    window.addEventListener( 'mousedown', onMouseDown, false );
    document.addEventListener( 'keypress', onKeyPress, false );

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


// ==========================================
//              onMouseMove
// And associated Event Listeners
// ==========================================
function onMouseMove( event ) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}


function onMouseDown( event ) {
    console.log(controls);
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera( mouse, camera );
    // calculate objects intersecting the picking ray
    var hit = raycaster.intersectObjects( sphereGroup.children )[0];
    if (hit) {
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
        var pos = curTarget.object.position;
        controls.target.set(pos.x, pos.y, pos.z);
        controls.update();
        console.log(controls);
    }
}

/* ================================== *
 *          onFrame
 *  Our Main rendering loop with
 *  associated draw function
 * ================================== */
function onFrame() {
    if ((head !== parseInt(slider.val()[0])) || (tail !== parseInt(slider.val()[1]))) {
        head = parseInt(slider.val()[0]);
        tail = parseInt(slider.val()[1]);
        updateAllTheGeometry(nDivisions);
    }
    raycaster.setFromCamera( mouse, camera );

    // This loop is to set the captured moused over halos back to their
    // original color once we have moved the mouse away
    if (hits.length > 0) {
        for (var i = 0; i < hits.length; i++) {
            if (hits[i].object.position !== curTarget.object.position) {
                hits[i].object.material.color.set( rgbToHex(255, 255, 255) );
                hits[i].object.material.opacity = 0.1;
            } else if (hits[i].object.position === curTarget.object.position) {
                curTarget.object.material.color.set( rgbToHex(255,0,0) );  // line green
                hits[i].object.material.opacity = 0.8;
            }
        }
    }

    hits = raycaster.intersectObjects( sphereGroup.children );

    // This loop is to set the captured moused over halos to yellow to highlight
    // that weve moved over them
    if (hits.length > 0) {
        for (var i = 0; i < hits.length; i++) {
            if (hits[i].object.position !== curTarget.object.position){
                hits[i].object.material.color.set( rgbToHex(255, 255, 0) ); // yellow
                hits[i].object.material.opacity = 0.8;
            } else if (hits[i].object.position === curTarget.object.position) {
                curTarget.object.material.color.set( rgbToHex(255,0,0) );
                hits[i].object.material.opacity = 0.8;
            }

        }
    }

    requestAnimationFrame( onFrame );
    renderer.render( scene, camera );

}


/* ===========================================================
 * Our handleKeys function. Rudimentary camera controls meant
 * primarily for debugging purposes
 * ========================================================== */
function createBufferGeometry(nDivisions) {
    head = slider.val()[0];
    tail = slider.val()[1];

    var index, xyz;
    var splineGeometryBuffer = new THREE.BufferGeometry();
    var positions = new Float32Array(numPoints * 3 * haloLines.length);
    var colors = new Float32Array(numPoints * 3 * haloLines.length);

    console.log("positions: ", positions.length);
    var pos = 0, start = 0;
    //for (var i = 0; i < haloLines.length; i++) {
    for (var i = 0; i < 1; i++) {
        var points = haloLines[i];
        var spline = new THREE.Spline();
        spline.initFromArray(points);

        for (var j = 0; j < numPoints ; j++ ) {
            index = j /numPoints;
            xyz = spline.getPoint(index);

            positions[pos++] = xyz.x; colors[pos] = (i === 0) ? 1.0 : Math.random();
            positions[pos++] = xyz.y; colors[pos] = (i === 0) ? 1.0 : (j / (numPoints));
            positions[pos++] = xyz.z; colors[pos] = (i === 0) ? 1.0 : Math.random();

        }
        console.log("start: ", start);
        splineGeometryBuffer.addDrawCall(start, numPoints, 0);
        start += numPoints * 3;
    }
    splineGeometryBuffer.addAttribute( 'position', new THREE.DynamicBufferAttribute( positions, 3 ) );
    splineGeometryBuffer.addAttribute( 'color', new THREE.DynamicBufferAttribute( colors, 3 ) );
    splineGeometryBuffer.computeBoundingSphere();

    var material = new THREE.LineBasicMaterial( {
        vertexColors: THREE.VertexColors,
        //blending: THREE.AdditiveBlending,
        //transparent: true,
        color: 0xffffff,
        opacity: 0.3,
        linewidth: 1
    } );
    linesMesh = new THREE.Line( splineGeometryBuffer, material );
    console.log(splineGeometryBuffer);
    linesGroup.add( linesMesh );
}


function createSplineGeometry(nDivisions) {
    head = parseInt(slider.val()[0]);
    tail = parseInt(slider.val()[1]);

    var index, xyz;
    for (var i = 0; i < haloLines.length; i++) {
        var colors = [];
        var points = haloLines[i];
        var spline = new THREE.Spline();
        spline.initFromArray(points.slice(head,tail));
        var controlPoints = spline.getControlPointsArray().slice(head,tail);
        var splineGeomentry = new THREE.Geometry();

        if ( i === 0 ){
            createSphereGeometry(spline);
        }

        for (var j = 0; j < numPoints ; j++ ) {
            index = j / (numPoints);
            xyz = spline.getPoint(index);

            splineGeomentry.vertices[j] = new THREE.Vector3( xyz.x, xyz.y, xyz.z );
            if (i === 0)
                colors[ j ] = new THREE.Color(1.0, 1.0, 1.0);
            else
                colors[ j ] = new THREE.Color( 0.0 , (j / (numPoints)), (Math.random()));
        }
        var len = spline.getLength(nDivisions);
        // console.log(len, splineGeomentry.vertices.length);
        splineGeomentry.colors = colors;
        splineGeomentry.computeBoundingSphere();
        var material = new THREE.LineBasicMaterial({
            color: 0xffffff, linewidth: 1, vertexColors: THREE.VertexColors
        });
        var mesh = new THREE.Line(splineGeomentry, material);
        mesh.updateMatrix();
        haloObjs.push(mesh);
        linesGroup.add(mesh);
    }
}

function createSphereGeometry(spline) {
    var controlPoints = spline.getControlPointsArray();

    for (var i = 0; i < controlPoints.length; i++) {
        var hl = controlPoints[i];
        var halo = haloStats[head + i];
        console.log(typeof(head),controlPoints.length, head, haloStats, haloStats[head + i]);
        // console.log("what it got", halo);
        var sphereGeometry = new THREE.SphereGeometry(halo.radius / halo.rScale * 6);
        sphereGeometry.color = new THREE.Color((Math.random() ), (i / (numPoints)), (Math.random()));
        var sphereMesh = new THREE.Mesh(
            sphereGeometry,
            new THREE.MeshBasicMaterial({
                color: rgbToHex(255, 255, 255) ,
                vertexColors: THREE.VertexColors,
                transparent: true,
                opacity: 0.1
            })
        );

        sphereMesh.position.set( hl[0], hl[1], hl[2]);
        sphereMesh.updateMatrix();
        haloSpheres.push(sphereMesh);
        sphereGroup.add(sphereMesh)
    }
}


function updateAllTheGeometry(nDivisions) {
    for (var i = 0; i < haloLines.length; i++) {
        var points = haloLines[i];
        var spline = new THREE.Spline();

        if ((tail - head) == 0) {
            spline.initFromArray(points[head]);
        } else {
            spline.initFromArray(points.slice(head, tail));
        }

        if ( i === 0 ){
            updateSpheres(spline);
        }

        var verts = [], colors = [];
        for (var j = 0; j < points.length * nDivisions; j++) {
            var index = j / (points.length * nDivisions);
            var xyz = spline.getPoint(index);
            verts[j] = new THREE.Vector3(xyz.x, xyz.y, xyz.z);
            if (i === 0)
                colors[j] = new THREE.Color(1.0, 1.0, 1.0);
            else
                colors[ j ] = new THREE.Color( 0.0, (j / (numPoints)), (Math.random()));

        }
        haloObjs[i].geometry.vertices = verts;
        haloObjs[i].geometry.colors = colors;
        haloObjs[i].geometry.computeBoundingSphere();
        haloObjs[i].geometry.verticesNeedUpdate = true;
        haloObjs[i].geometry.colorsNeedUpdate = true;
    }
}


function updateSpheres(spline) {
    // First, remove all of our sphere objects
            // This needs some work!
    for (var i = 0; i < haloSpheres.length; i++) sphereGroup.remove(haloSpheres[i]);
    haloSpheres.slice(0, haloSpheres.length);
    createSphereGeometry(spline);

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

        case 105:  // i
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
        case 48: //0
            //camera.position.set(0.0,0.0,0.0);
            //camera.lookAt(scene.position);
            var pos = sphereGroup.children[0].position;
            var pos2 = curTarget.object.position;
            console.log(pos, pos2)
            camera.lookAt(pos2);

            console.log(controls);
    }
    console.log( camera, camera.position, camera.rotation);
}
