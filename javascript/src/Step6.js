/**
 * Created by krbalmryde on 6/6/15.
 */

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container;
var head, tail;
var scene, renderer;
var camera, slider;
var mouse, raycaster, ambient;
var HaloObjs, TimePoints;
var haloObjs = [], haloStats = [];
var haloLines = [], haloSpheres = {};
var hits = [], curTarget, prevTarget;
var nDivisions = 10, NUMTIMEPOINTS = 12;
var numPoints = NUMTIMEPOINTS * nDivisions;
var guiControls;
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

    /* -------------------------------*/
    /*      Setting the stage         */
    /* -------------------------------*/

    // **** Create our scene ***
    initScene();

    // **** Set up the Renderer ***
    initRenderer();

    // **** Setup Container stuff ***
    initContainer();

    // **** DAT GUI! ***
    initGUI();

    // **** Setup our slider ***
    initSlider();


    /* -------------------------------*/
    /*    Organizing our Actors       */
    /* -------------------------------*/

    // Load Data for Halo 257
    //initPointsH257();
    initHaloTree();

    // **** Make some Spline Geometry ***
    createHaloGeometry();
    createSplineLines();
    console.log("\nfinal haloLines", haloLines);

    // **** Lights! ***
    initLights();

    // **** Camera! ***
    initCamera();

    // **** Setup our Raycasting stuff ***
    initRayCaster();

    // **** Action! Listeners *** //
    initListeners();

}

// *****************************
//      Order does matter
// *****************************

function initScene() {
    scene = new THREE.Scene();

    // **** Adding our Group object ***
    {
        linesGroup = new THREE.Object3D();
        sphereGroup = new THREE.Object3D();

        scene.add( linesGroup );
        scene.add( sphereGroup );
    }
}


function initRenderer() {
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    {
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.gammaInput = true;
        renderer.gammaOutput = true;
    }
}


function initContainer() {
    container = document.getElementById( 'Sandbox' );
    container.appendChild( renderer.domElement );
}

// *****************************
//      Order doesnt matter
// *****************************


function initLights() {
    ambient = new THREE.AmbientLight(0x404040); //rgbToHex(197, 176, 255)
    scene.add(ambient);
}

function initRayCaster() {
    raycaster = new THREE.Raycaster();
    {
        mouse = new THREE.Vector2();

        // **** Have to set this so it doesnt complain! ***
        prevTarget = curTarget = {object: haloSpheres[head][0]};
        curTarget.object.material.color.set( rgbToHex(255,0,0) );  // red
        curTarget.object.material.opacity = 0.8;
        console.log("prevTarget, curTarget", prevTarget, curTarget);
        tweenToPosition(250, 250);
    }
}

function initCamera() {
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
    {
        // **** position the camera near the first halo; ***
        var pos = sphereGroup.children[3].position;
        camera.position.set(pos.x, pos.y+0.1, pos.z-(pos.z*0.05));
        console.log(pos, camera.position);
        controls = new THREE.TrackballControls( camera );
        {
            controls.rotateSpeed = 4.0;
            controls.zoomSpeed = 4.0;
            controls.panSpeed = 1.0;

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

function initListeners() {
    window.addEventListener( 'resize', onReshape, false );
    window.addEventListener( 'mousemove', onMouseMove, false );
    window.addEventListener( 'mousedown', onMouseClick, true );
    //window.addEventListener( 'keypress', onKeyPress, false );
}


function initGUI() {
    guiControls = {
        message: "Halos in a Dark Sky",
        show_lines: true,
        numDivisions: 10,
        reset: function() {
            prevTarget = curTarget.object = haloSpheres[head][0];
            tweenToPosition();
        }
    };

    var gui = new dat.GUI({ autoPlace: false });
    var guiContainer = $('.ma-gui').append($(gui.domElement));
    console.log(guiContainer );

    gui.add(guiControls, "message");
    gui.add(guiControls, "numDivisions", 0, 100);
    var linesController = gui.add(guiControls, "show_lines");
    linesController.onFinishChange(function(){
        for (var i=1; i< haloLines.length; i++) {
            haloObjs[i].visible = guiControls.show_lines;
        }
    });
    gui.add(guiControls, "reset");

}


function initSlider() {
    // console.log("\t initSlider()");
    slider = $('.tslider');
    slider.noUiSlider({
        start: [8, 12],
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
            '25%': [3],
            '50%': [6],
            '75%': [9],
            'max': [12]
        }
    });

    slider.noUiSlider_pips({
        mode: 'count',
        values: 5,
        density: 3
    });

    slider.Link('lower').to($('#value-lower'));
    slider.Link('upper').to($('#value-upper'));
    head = parseInt(slider.val()[0]);
    tail = parseInt(slider.val()[1]);

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
        prevTarget.object.material.opacity = 0.2;
        curTarget.object.material.color.set( rgbToHex(255,0,0) );

        tweenToPosition();
    }
}


function tweenToPosition(durationA, durationB) {
    TWEEN.removeAll();

    durationA = (durationA) ? durationA: 1500;
    durationB = (durationB) ? durationB : 500;

    console.log("durations:", durationA, durationB);
    console.log(curTarget, prevTarget);
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

/* ================================== *
 *          render
 *  Our render function which renders
 *  the scene and its associated objects
 * ================================== */
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



/* ================================== *
 *          createSplineGeometry
 *  Geometry rendering function. Builds
 *  Our splines and calls the spheres
 * ================================== */


function createSplineLines() {
// Helper function

    function intoTheVoid(pNode, points, TimeNodes) {
        console.log("\n\tIntoTheVOid!", TimeNodes.length, points, pNode);
        console.log("\t\tinsert..", [pNode.x,pNode.y,pNode.z,pNode.id, pNode.child, pNode.time]);
        points.push([pNode.x,pNode.y,pNode.z,pNode.id, pNode.child, pNode.time]);
        if ( !TimeNodes || TimeNodes.length <= 0) {
            console.log("\t\tEmpty!", points);
            return points
        }
        //points.push(pNode.xyz);

        var pHead = TimeNodes[0];
        var len = TimeNodes.length;
        var tSlice = TimeNodes.slice(1, len);
        for (var i = 0; i < pHead.length; i++) {
            if (pNode.child === pHead[i].id){
                console.log("\t\tGot a match!", i, "child", pNode.child, "pHead", pHead[i].id);
                return intoTheVoid(pHead[i], points, tSlice);
            } else {
                console.log("\t\tNot a match :(  ", i, "child", pNode.child, "pHead", pHead[i].id);
                points.push(intoTheVoid(pHead[i], [], tSlice));
            }
        }
        console.log("\tThats all folks!", points);
        return points;
    }


    function createPathLine(points, color) {
        if (points.length >= 2) {
            var index, xyz;
            var colors = [];
            var spline = new THREE.Spline();
            var numPoints = points.length*nDivisions;
            var splineGeometry = new THREE.Geometry();

            spline.initFromArray(points);
            for (var i=0; i < numPoints; i++) {
                index = i/numPoints;
                xyz = spline.getPoint(index);
                splineGeometry.vertices[i] = new THREE.Vector3( xyz.x, xyz.y, xyz.z );
                colors[ i ] = new THREE.Color(color);

            }
            splineGeometry.colors = colors;
            splineGeometry.computeBoundingSphere();
            var material = new THREE.LineBasicMaterial({
                color: 0xffffff,
                linewidth: 2,
                vertexColors: THREE.VertexColors,
                transparent: true,
                opacity: 1.0
            });

            var lineMesh = new THREE.Line(splineGeometry, material);
            haloObjs.push(lineMesh);
            linesGroup.add(lineMesh);
        }
    }
    //----------------------
    // Main body of Function
    //----------------------
    console.log("createSplineLines()", TimePoints.length);
    var control_points = TimePoints.slice(head, tail+1);
    var stop = control_points.length;
    var color = d3.scale.category20();
    haloLines = [];
    console.log("control_points", control_points.length, control_points);
    var nodes = control_points[0];
    console.log("nodes", nodes.length, nodes);
    for (var j = 0; j < nodes.length; j++) {
        var coords = [];
        var pHead = nodes[j];
        console.log(j, "head", pHead, "nodes", nodes);
        haloLines.push(intoTheVoid(pHead, coords, control_points.slice(1, stop)));
        console.log("\thaloLines", haloLines);
    }

    for (i =0; i < haloLines.length; i++) {
        var points = haloLines[i];
        createPathLine(points, color(i));
    }

    console.log("end createSplineLines", haloLines);
}


/* ================================== *
 *          createSphereGeometry
 *  Draws the actual Halo objects
 *  represented as spheres.
 * ================================== */
function createHaloGeometry() {
    console.log("\n\ncreateHaloGeometry()!!");
    for (var i=0; i < TimePoints.length; i++) {
        haloSpheres[i] = [];
        //console.log("\tTimePoints", i, TimePoints.length, TimePoints[i], '\n\t',TimePoints);
        for ( var j=0; j < TimePoints[i].length; j++){
            var halo = TimePoints[i][j];
            //console.log("\t\thalo", i, j, halo, "tps", TimePoints[i].length);
            var mesh = new THREE.Mesh(
                new THREE.SphereGeometry(halo.rs * 6),
                new THREE.MeshBasicMaterial({
                    color: rgbToHex(255, 255, 255) ,
                    vertexColors: THREE.VertexColors,
                    transparent: true,
                    opacity: (i < head || i > tail) ? 0.0 : 0.2
                })
            );

            mesh.position.set( halo.x, halo.y, halo.z);
            mesh.updateMatrix();
            haloSpheres[i].push(mesh);
            sphereGroup.add(mesh);
            //console.log("Halospheres", i, mesh, haloSpheres[i], haloSpheres);
        }
    }
}

/* ================================== *
 *          updateAllTheGeometry
 *  Redraws the Splines for the paths
 *  and turns sphere opacity on or off
 * ================================== */
function updateAllTheGeometry(nDivisions) {}

/* ================================== *
 *          updateAllTheGeometry
 *  Redraws the Splines for the paths
 *  and turns sphere opacity on or off
 * ================================== */
function updateSpheres() {
    //Adjust the sphere's opacity!
    var index;
    for (var i = 0; i < haloSpheres.length; i++) {
        haloSpheres[i].material.opacity = 0.2;
    }
    if ((tail - head) == 0)
        curTarget.object = haloSpheres[head];
    else {
        //index = parseInt(head + (tail - head)/2);
        curTarget.object = haloSpheres[tail];
    }
    //curTarget.object.material.color.set( rgbToHex(255,0,0) );  // line green
    //curTarget.object.material.opacity = 0.8;
    tweenToPosition(500, 250);
}

function initHaloTree() {
    console.log("\n\ninitHaloTree!!");
    console.log(HALOTREE);
    HaloObjs = {length: 0};  // just to keep track of how many objects we have
    TimePoints = [];
    var size = 0;  // related to the number of unique halos, other those halos that are not direct descendants to the original path

    var haloPath = [];
    for (var i = 0; i < HALOTREE.length; i++) {
        var _h = HALOTREE[i];
        halo = {
            id: _h.id,
            x: _h.x,
            y: _h.y,
            z: _h.z,
            xyz: _h.position,
            child: _h.desc_id,
            pid: _h.pid,
            sub_halos: [],
            radius: _h.rvir,
            rScale: _h.rs,
            rs1: _h.rvir / _h.rs,
            rs2: _h.rvir * _h.rs,
            time: _h.time,
            scale: _h.scale
        };

        //console.log(halo.time, typeof(halo.time), halo);

        // add Halos to list by ID
        HaloObjs[halo.id] = halo;
        HaloObjs.length++;

        // Will need to wait until the array has been filled
        //// Add any sub-halos to their host, if they exist
        //if (halo.pid in HaloObjs)
        //    HaloObjs[halo.pid].sub_halos.push(halo.id);

        // Organize Halo's by time, ignore host/sub status
        if (halo.time in TimePoints) {
            //console.log("\tTimePoints", TimePoints, head);
            TimePoints[halo.time].push(halo);
            size += 1;
        } else {
            TimePoints[halo.time] = [halo];
        }

    }
    console.log("\n\tTimePoints", TimePoints,"\n");
    console.log("\tHaloObjs", HaloObjs,"\n");
    console.log("\tSize", size,"\n");
}


function rgbToHex(R,G,B){
    function toHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    return "#" + toHex(R) + toHex(G) + toHex(B)
}