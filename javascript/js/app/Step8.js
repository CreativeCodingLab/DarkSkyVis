/**
 * Created by krbalmryde on 6/24/15.
 */
"use strict"

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container;
var EPOCH_HEAD, EPOCH_TAIL;
var scene, renderer;
var camera, slider, controls;
var mouse, raycaster, light;
var HaloLUT, TimePeriods, __traversed={};
var linesGroup, sphereGroup;
var Lines = [];
var HaloLines = {}, HaloSpheres = {};
var HaloBranch = {}, HaloSelect = {};
var hits = [], curTarget, prevTarget;
var nDivisions = 10, NUMTIMEPERIODS = 89;
var config, haloStats;

// Be sure to match this with the slider's connect!!
var colorKey = d3.scale.linear()
    .domain([0, 18, 36, 53, 71, NUMTIMEPERIODS])
    .range([rgbToHex(255,0,0), rgbToHex(255,0,255), rgbToHex(0,0,255), rgbToHex(0,255,255), rgbToHex(0,255,0)]);

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

    /* -------------------------------*/
    /*      Setting the stage         */
    /* -------------------------------*/

    // **** Create our scene ***
    initScene();

    // **** Set up the Renderer ***
    initRenderer();

    // **** Setup Container stuff ***
    initContainer();

    // *** Setup the Halo stats div ***
    initStatsInfo();

    // **** DAT GUI! ***
    initGUI();

    // **** Setup our slider ***
    initSlider();


    /* -------------------------------*/
    /*    Organizing our Actors       */
    /* -------------------------------*/

    // Load Data for Halo  // TREE679582  TREE676638
    initHaloTree(TREE676638, true);

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
        renderer.setClearColor(rgbToHex(255,255,255), 1);
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

    // ambient = new THREE.AmbientLight(0xFFFFFF); //rgbToHex(197, 176, 255)
    // scene.add(ambient);

    light = new THREE.DirectionalLight( 0xffffff, 1);
    light.position.set( 1, 1, 1 ).normalize();
    scene.add( light );


}

function initRayCaster() {

    raycaster = new THREE.Raycaster();
    {
        mouse = new THREE.Vector2();
        // **** Have to set this so it doesnt complain! ***
        var halo;

        for (var i = EPOCH_HEAD; i < EPOCH_TAIL; i++) {

            if (halo) break;
            for (var j = 0; j < TimePeriods[i].length; j++) {

                var id = TimePeriods[i][j];
                halo = HaloSpheres[id];
                if ( halo ) break;
            }
        }

        prevTarget = curTarget = {object: halo};
        curTarget.object.material.opacity = 0.7;
        tweenToPosition(250, 250);
    }

}

function initCamera() {

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
    {
        // **** position the camera near the first halo; ***
        var pos = sphereGroup.children[3].position;
        camera.position.set(pos.x, pos.y+0.1, pos.z-(pos.z*0.5));
        controls = new THREE.TrackballControls( camera, renderer.domElement );
        {
            controls.rotateSpeed = 4.0;
            controls.zoomSpeed = 1.5;
            controls.panSpeed = 1.0;

            controls.noZoom = false;
            controls.noPan = false;

            controls.staticMoving = false;
            controls.dynamicDampingFactor = 0.3;

            controls.keys = [ 65, 83, 68 ];
            controls.enabled = true;
        }
        camera.lookAt(pos)
        controls.target.set(pos.x, pos.y, pos.z);
        controls.update();
    }

}

function initListeners() {

    window.addEventListener( 'resize', onReshape, false );
    window.addEventListener( 'mousemove', onMouseMove, false );
    window.addEventListener( 'click', onMouseClick, true );
    window.addEventListener( 'dblclick', onMouseDoubleClick, true );
    window.addEventListener( 'keypress', onKeyPress, false );

}

function initStatsInfo() {

    console.log("initStatsInfo\n");
    haloStats = d3.select("#Sandbox")
        .append("div")
            .attr("class","haloStats");

    $('.haloStats').append($(haloStats.domElement));
    console.log(haloStats);

}

function displayHaloStats() {

    console.log(haloStats);
    var haloData = HaloLUT[curTarget.object.halo_id];

    var result = "<b> time:</b> " + haloData['time'] + "</br>" +
    "<b>        id:</b> " + haloData['id'] + "</br>" +
    "<b>   desc_id:</b> " + haloData['desc_id'] + "</br>" +
    "<b>  num_prog:</b> " + haloData['num_prog'] + "</br>" +
    "<b>       pid:</b> " + haloData['pid'] + "</br>" +
    "<b>      upid:</b> " +  haloData['upid'] + "</br>" +
    "<b>  desc_pid:</b> " +  haloData['desc_pid'] + "</br>" +
    "<b>     scale:</b> " +  haloData['scale'] + "</br>" +
    "<b>desc_scale:</b> " +  haloData['desc_scale'] + "</br>" +
    "<b>   phantom:</b> " +  haloData['phantom'] + "</br>" +
    "<b>  position:</b> " +  haloData['position'] + "</br>" +
    "<b>  velocity:</b> " +  haloData['velocity'] + "</br>" +
    "<b>        rs:</b> " +  haloData['rs'] + "</br>" +
    "<b>      mvir:</b> " +  haloData['mvir'] + "</br>" +
    "<b>      rvir:</b> " +  haloData['rvir'] + "</br>" +
    "<b>      vrms:</b> " +  haloData['vrms'] + "</br>" +
    "<b>      vmax:</b> " +  haloData['vmax'] + "</br>" +
    "<b>  sam_mvir:</b> " +  haloData['sam_mvir'] + "</br>" +
    "<b>      Spin:</b> " +  haloData['Spin'] + "</br>"

    // var result = $.map(haloData, function(value, index) {

    //     return  "<b>"+ index  +":</b> " + value;
    // }).join("</br>");

    haloStats.html(result);

}


function initGUI() {

    function __resetView(toHead) {

        console.log("You hit the reset button!!");
        var halo;
        switch (toHead) {

            case 0:
                (function () {

                    for (var i = EPOCH_HEAD; i <= EPOCH_TAIL; i++) {

                        if (halo) break;
                        for (var j = 0; j < TimePeriods[i].length; j++) {

                            var id = TimePeriods[i][j]
                            halo = HaloSpheres[id];
                            if (halo) break;
                        }
                    }
                }());
                break;

            case 1:
                (function () {

                    var i = (EPOCH_HEAD < EPOCH_TAIL)? (EPOCH_HEAD + parseInt((EPOCH_TAIL - EPOCH_HEAD)/2)) : 0;
                    for (var j = 0; j < TimePeriods[i].length; j++) {

                        var id = TimePeriods[i][j]
                        halo = HaloSpheres[id];
                        if (halo) break;
                    }
                })();
                break;

            case 2:
                (function () {

                    for (var i = EPOCH_TAIL; i >= EPOCH_HEAD; i--) {

                        if (halo) break;
                        for (var j = 0; j < TimePeriods[i].length; j++) {

                            var id = TimePeriods[i][j]
                            halo = HaloSpheres[id];
                            if (halo) break;
                        }
                    }
                })();
                break;
        }

        if (curTarget.object)
            curTarget.object = halo;
        else
            prevTarget = curTarget = {object: halo};
        curTarget.object.material.opacity = 0.7;
        console.log("prevTarget, curTarget", prevTarget, curTarget);

        displayHaloStats();
        displayHaloData();
        tweenToPosition();
    }

    function __updateData(dataset) {

        initHaloTree(dataset, false);
        createHaloGeometry(TimePeriods);
        __resetView(0);
    }


    var gui = new dat.GUI({ autoPlace: false });
    console.log("ma gui", gui);
    var guiContainer = $('.ma-gui').append($(gui.domElement));
    var guiBox = gui.addFolder("Halos in a Dark Sky");
    guiBox.open();

    var GUIcontrols = function() {

        this.showPaths = false;
        this.showHalos = true;
        this.showStats = false;
        this.enableSelection = false;

        this.color0 = rgbToHex(255,0,0);
        this.color1 = rgbToHex(255,255,0);
        this.color2 = rgbToHex(0,0,255);
        this.color3 = rgbToHex(0,255,0);

        this.Path257 = function () { __updateData(PATH257) };
        this.SampleTree = function () { __updateData(HALOTREE) };
        this.Tree676638 = function () { __updateData(TREE676638) };
        //this.Tree676638 = function () { __updateData(TREE679582) };
        this.goToHead = function () { __resetView(0) };
        this.goToCenter = function () { __resetView(1) };
        this.goToTail = function () { __resetView(2) };
    };

    config = new GUIcontrols();

    var spheresController = guiBox.add(config, "showHalos");
    {
        spheresController.onFinishChange(function(){
            console.log("spheresController.onFinishChange");
            if (config.enableSelection)
                toggleVisibility(HaloSelect,config.showHalos);
            else
                toggleVisibility(HaloSpheres,config.showHalos);
        });
    }


    var linesController = guiBox.add(config, "showPaths");
    {
        linesController.onFinishChange(function(){
            console.log("linesController.onFinishChange");
            if (config.enableSelection)
                toggleVisibility(HaloBranch,config.showPaths);
            else
                toggleVisibility(HaloLines,config.showPaths);
        });
    }


    var statsController = guiBox.add(config, "showStats");
    {
        statsController.onFinishChange(function() {

            console.log("statsController.onFinishChange");
            haloStats
                .style("display", function(){
                    if (config.showStats )
                        return "block";
                    else
                        return "none";
                })
        })
    }

    var selectionController = guiBox.add(config, "enableSelection");
    {
        selectionController.onFinishChange(function() {

            console.log("selectionController.onFinishChange");
            if (config.enableSelection) {

                console.log("Selection Mode is active!");
                renderer.setClearColor(rgbToHex(50,50,50), 1);
            } else {
                __resetHaloBranch()
                toggleVisibility(HaloLines, config.showPaths);
                toggleVisibility(HaloSpheres, config.showHalos);
                renderer.setClearColor(rgbToHex(0,0,0), 1);
            }

        })
    }


    var dataSetBox = guiBox.addFolder("Choose a dataset!");
    {
        dataSetBox.add(config, "Tree676638");
        dataSetBox.add(config, "Path257");
        dataSetBox.add(config, "SampleTree");
    }

    var haloFocusBox = guiBox.addFolder("Choose a focus point!");
    {
        haloFocusBox.add(config, "goToHead");
        haloFocusBox.add(config, "goToCenter");
        haloFocusBox.add(config, "goToTail");
        haloFocusBox.open();
    }

    var colorBox = guiBox.addFolder("Cosmetic");
    {
        colorBox.addColor(config, "color0");
        colorBox.addColor(config, "color1");
        colorBox.addColor(config, "color2");
        colorBox.addColor(config, "color3").onChange(function(){
            console.log("wooo color!", config.color3);
            var foo = $(".noUi-connect");
            console.log("\twooo we got it!!", foo, config.color3);
            foo.css( "background-image", function() {

                return "-webkit-linear-gradient( "
                    + config.color0  + " 0%, "
                    + config.color1  +  " 25%, "
                    + config.color2  +  " 50%, "
                    + config.color3  +  " 75%);!important";
            });
        })
    }
}


function toggleVisibility(HaloObject, showIt, opacity) {

    for (var i=EPOCH_HEAD; i<EPOCH_TAIL+1; i++) {

        for (var j = 0; j < TimePeriods[i].length; j++) {

            var id = TimePeriods[i][j];
            if(HaloObject[id]){
                HaloObject[id].visible = showIt;
                if (opacity){
                    console.log("toggleVisibility", i, opacity);
                    HaloObject[id].material.opacity = opacity;
                }
            }

        }
    }
}


function initSlider() {
  // console.log("\t initSlider()");
    slider = $('.tslider');
    slider.noUiSlider({
        start: [0, 50],
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
            '20%': [18],
            '40%': [36],
            '60%': [53],
            '80%': [71],
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
    EPOCH_HEAD = parseInt(slider.val()[0]);
    EPOCH_TAIL = parseInt(slider.val()[1]);
}


// ==========================================
//        onReshape, onMouseMove
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

function onMouseDoubleClick() {

    console.log("Double Click!!", curTarget.object.halo_id);
    // update the picking ray with the camera and mouse position

    if(config.enableSelection) {

        toggleVisibility(HaloLines, false, 0.5);
        toggleVisibility(HaloSpheres, false, 0.05);

        __resetHaloBranch()


        var id = curTarget.object.halo_id;
        var period = curTarget.object.halo_period;
        // just need to use the halo-id's to turn the spheres on, no sense in rebuilding existing data.
        var points = intoTheAbyss(id, period, []);
        createSpline(points, id, period);
    } else {
        __resetHaloBranch()
        toggleVisibility(HaloLines, config.showPaths, 0.05);
        toggleVisibility(HaloSpheres, config.showHalos, 0.05);
    }


}

function __resetHaloBranch() {

    for (var id in HaloSelect) {

        if (id in HaloBranch){
            console.log("HaloBranch", id)
            linesGroup.remove(HaloBranch[id]);
            scene.remove(HaloBranch[id]);
            HaloBranch[id].material.dispose();
            HaloBranch[id].geometry.dispose();
            delete HaloBranch[id]
        }
        delete HaloSelect[id]
    }
    HaloSelect = {};
    HaloBranch = {};
    __traversed = {};

}

// given a clicked Halo id, traverse the tree with the given halo.

//
function intoTheAbyss(id, period, points) {

    var halo = HaloLUT[id];  // use the ID to pull the halo
    points.push(halo.position);
    HaloSelect[id] = true;
    HaloSpheres[id].visible = (period >= EPOCH_HEAD && period < EPOCH_TAIL)? config.showHalos : false;
    //points.push([halo.x,halo.y,halo.z,halo.id,halo.desc_id]); // for debugging purposes

    //if (halo.desc_id in HaloLUT && halo.time < EPOCH_TAIL) {

    if (halo.desc_id in HaloLUT && period < EPOCH_TAIL) {

        var next = HaloLUT[halo.desc_id];

        if (halo.desc_id in __traversed) {

            points.push(next.position);
            return points;
        } else {
            __traversed[halo.id] = true;
            return intoTheAbyss(next.id, next.time, points);
        }
    } else {
        //console.log("\t\thalo->id:",halo.id, "!= halo.desc_id:", halo.desc_id);
        return points;
    }

}

function traceBackPath(id, period, points) {



}


function createSpline(points, id, period) {

    // if points is defined at all...
    if (points && points.length > 1) {

        //console.log("creating PathLine!", period);
        var index, xyz;
        var colors = [];
        var spline = new THREE.Spline();
        var numPoints = points.length*nDivisions;

        var splineGeometry = new THREE.Geometry();

        spline.initFromArray(points);
        for (var i=0; i <= numPoints; i++) {

            index = i/numPoints;
            xyz = spline.getPoint(index);
            splineGeometry.vertices[i] = new THREE.Vector3( xyz.x, xyz.y, xyz.z );
            colors[ i ] = new THREE.Color(colorKey(index*points.length + period)); // this should give us an accurate color..I think

        }
        splineGeometry.colors = colors;
        splineGeometry.computeBoundingSphere();

        var material = new THREE.LineBasicMaterial({
            color: rgbToHex(255, 255, 255),
            linewidth: 2,
            vertexColors: THREE.VertexColors,
            transparent: true,
            opacity: 0.5
        });

        var mesh = new THREE.Line(splineGeometry, material);
        mesh.halo_id = id;
        mesh.halo_period = period;
        HaloBranch[id] = mesh;
        linesGroup.add(mesh);
    }

}


function onMouseClick() {

    console.log("Single Click!!");
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera( mouse, camera );
    // calculate objects intersecting the picking ray
    var hit, hits = raycaster.intersectObjects( sphereGroup.children );
    for (var i = 0; i < hits.length; i++) {

        hit = raycaster.intersectObjects( sphereGroup.children )[i];
        console.log(i, "hit?", hit);
        if (hit.object.visible) break;
    }
    if (hit && (hit.object.material.opacity !== 0.0 && hit.object.visible)) {

        console.log("we got something!", hit);
        if (!prevTarget)
            prevTarget = curTarget = hit;
        else {
            prevTarget = curTarget;
            curTarget = hit;
        }

        prevTarget.object.material.opacity = 0.2;
        curTarget.object.material.opacity = 0.7;

        tweenToPosition();
        displayHaloStats();
    }


}


function onKeyPress( event ) {

    console.log("Key is",event.keyCode);
    switch (event.keyCode) {

        case 49:
            camera.position.set(camera.position.x, camera.position.y, camera.position.z-0.3);
            controls.update();
            break;
        case 50:
            camera.position.set(camera.position.x, camera.position.y, camera.position.z+0.3);
            controls.update();
            break;
    }

}



function tweenToPosition(durationA, durationB) {

    console.log("we are tweenToPosition!");
    TWEEN.removeAll();

    durationA = (durationA) ? durationA: 1500;
    durationB = (durationB) ? durationB : 500;

    var cameraPosition = camera.position;  // The current Camera position
    var currentLookAt = controls.target;   // The current lookAt position

    var haloDestination = {   // Our destination
        x: curTarget.object.position.x,
        y: curTarget.object.position.y,
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

    //tweenLookAt.chain(tweenPosition);
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

    if ((EPOCH_HEAD !== sliderVal0) || (EPOCH_TAIL !== sliderVal1)) {

        EPOCH_HEAD = sliderVal0;
        EPOCH_TAIL = sliderVal1;
        updateAllTheGeometry();
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

            // Hit object is NOT the currently selected object
            if (hits[i].object.position !== curTarget.object.position &&
                hits[i].object.material.opacity !== 0.0 && hits[i].object.visible){
                hits[i].object.material.opacity = 0.2;
            // Hit object is the currently selected object
            } else if (hits[i].object.position === curTarget.object.position &&
                hits[i].object.material.opacity !== 0.0 && hits[i].object.visible){
                curTarget.object.material.opacity = 0.7;
            }
        }
    }

    hits = raycaster.intersectObjects( sphereGroup.children );

    // This loop is to set the captured moused over halos to yellow to highlight
    // that weve moved over them
    if (hits.length > 0) {

        for (var i = 0; i < hits.length; i++) {

            // Hit object is not our currently selected object
            if (hits[i].object.position !== curTarget.object.position &&
                hits[i].object.material.opacity !== 0.0 && hits[i].object.visible){
                hits[i].object.material.opacity = 0.4;
            // Hit object is our currently selected object
            } else if (hits[i].object.position === curTarget.object.position &&
                hits[i].object.material.opacity !== 0.0 && hits[i].object.visible){
                hits[i].object.material.opacity = 0.7;
            }
        }
    }
    controls.update();
    renderer.render( scene, camera );

}


/* ================================== *
 *          render
 *  Our render function which renders
 *  the scene and its associated objects
 * ================================== */
function initHaloTree(DATASET, firstTime) {

    console.log("\n\ninitHaloTree!!", firstTime, DATASET.length);


    // Helper Function, closure
    function __prepGlobalStructures() {

        console.log("calling __prepGlobalStructures()!");
        Lines = [];
        HaloBranch = {};
        HaloSpheres = {};
        HaloLines = {};
        __traversed = {};
        HaloLUT = {length: 0};  // just to keep track of how many objects we have


        TimePeriods = [];
        for (var i = 0; i < NUMTIMEPERIODS; i++) {

            Lines[i] = [];
            TimePeriods[i] = [];
        }
    }

    function __resetGlobalStructures() {

        console.log("calling __resetGlobalStructures()!");
        for (var i = 0; i < TimePeriods.length; i++) {

            for (var j = 0; j < TimePeriods[i].length; j++) {

                var id = TimePeriods[i][j]
                if (HaloLines[id]) {

                    linesGroup.remove(HaloLines[id]);
                    scene.remove(HaloLines[id]);
                    HaloLines[id].material.dispose();
                    HaloLines[id].geometry.dispose();
                    delete HaloLines[id]
                }

                if (HaloSpheres[id]) {

                    sphereGroup.remove(HaloSpheres[id]);
                    scene.remove(HaloSpheres[id]);
                    HaloSpheres[id].material.dispose();
                    HaloSpheres[id].geometry.dispose();
                    delete HaloSpheres[id];
                }

                if (HaloLUT[id]) {

                    delete HaloLUT[id]
                    HaloLUT.length--;
                }
            }
        }
        __prepGlobalStructures();
    }

    if (firstTime)
        __prepGlobalStructures();
    else
        __resetGlobalStructures();

    // PATH257, HALOTREE, TREE676638
    for (var i = 0; i < DATASET.length; i++) {

        var halo = DATASET[i];
        halo.rs1 = (halo.rvir / halo.rs);  // convenience keys, one divided by
        halo.rs2 = (halo.rvir * halo.rs);  // the other multiplied
        //halo.x = (halo.x >= 60.0)? 60.0 - halo.x: halo.x;
        //halo.position[0] = halo.x
        halo.vec3 = THREE.Vector3(halo.x, halo.y, halo.z);  // Convenience, make a THREE.Vector3
        halo.time = parseInt(halo.scale * 100) - tree_offset;
        console.log(halo.time, halo.id, halo.desc_id, halo.pid)
        //console.log("\tHalo.id ", halo.id, "Halo.scale",halo.scale, "Halo.time",halo.time);

        // if (halo.x > 50.0 && halo.time)
        //     console.log(halo.time, halo.id, halo.desc_id, halo.position);

        // add Halos to list by ID
        HaloLUT[halo.id] = halo;
        HaloLUT.length++;

        TimePeriods[halo.time].push(halo.id);
    }

    console.log("\n\tTimePeriods", TimePeriods,"\n");
    console.log("\tHaloLUT", HaloLUT.length,"\n");

    // **** Make some Spline Geometry ***
    createHaloGeometry(TimePeriods);

}

/* ================================== *
 *          createHaloGeometry
 *  Geometry rendering function. Builds
 *  Our splines and spheres for each
 *  Halo object. Iterates over time
 *
 *  NB: A number of helper functions
 *  included below
 * ================================== */
function createHaloGeometry(TimePeriods) {

    for (var i = 0; i < TimePeriods.length; i++) {

        for (var j = 0; j < TimePeriods[i].length; j++) {


            var id = TimePeriods[i][j];

            if (!(id in __traversed)) {

                var points = intoTheVoid(id, [], 0);
                Lines[i].push( { 'points': points, 'id': id } );
            }

            createSphere(id, colorKey(i),  i);
        }
    }

    for (i = 0; i < Lines.length; i++) {

        for (j = 0; j < Lines[i].length; j++){
            var id = Lines[i][j].id
            var segment = Lines[i][j].points;
            if (segment.length > 1)
                createPathLine(segment, colorKey(i), id, i);
        }
    }

    // set the visibility of the halo data
    displayHaloData();

}

// Helper function
function intoTheVoid(id, points, steps) {

    var maxSteps = 1;
    var halo = HaloLUT[id];  // use the ID to pull the halo
    points.push(halo.position);
    //points.push([halo.x,halo.y,halo.z,halo.id,halo.desc_id]); // for debugging purposes

    //if (halo.desc_id in HaloLUT && halo.time < EPOCH_TAIL) {

    if (halo.desc_id in HaloLUT && steps < maxSteps) {

        var next = HaloLUT[halo.desc_id];

        if (halo.desc_id in __traversed) {

            //if (halo.time === next.time){
            //    console.log('\t',halo.time, next.time, halo.id, next.id, halo.position, next.position);
            //    return [];
            //}
            //console.log("\t\tAdding", halo.id, "to points", halo.time, next.position);
            points.push(next.position);
            //points.push([next.x,next.y,next.z,next.id,next.desc_id]); // for debugging purposes
            return points;
        } else {
            __traversed[halo.id] = true;
            //console.log("\t\tAdding", halo.id, "to __traversed", halo.time);
            return intoTheVoid(next.id, points, steps+1);
        }
    } else {
        //console.log("\t\thalo->id:",halo.id, "!= halo.desc_id:", halo.desc_id);
        return points;
    }

}

function createSphere(id, color, index) {

    var halo = HaloLUT[id];
    //console.log("createSphere", index, halo.id);

    var mesh = new THREE.Mesh(
        new THREE.SphereGeometry(halo.rs1/100, 15, 15),
        new THREE.MeshPhongMaterial({
            color: color,
            specular: rgbToHex(255,255,255),
            shininess: 30,
            shading: THREE.SmoothShading,
            vertexColors: THREE.VertexColors,
            transparent: true,
            opacity: 0.2
        })
    );

    // Add the halo's id to the mess so we can check it against the Halo ID map/LUT/Hash.
    mesh.renderOrder = halo.time;
    mesh.halo_id = id;
    mesh.halo_period = halo.time;
    mesh.position.set( halo.x, halo.y, halo.z);
    mesh.updateMatrix();
    HaloSpheres[id] = mesh;
    sphereGroup.add(mesh);
    //console.log("created Halosphere", halo.id, index, HaloSpheres.length, HaloSpheres[index].length);

}


function createPathLine(points, color, id, period) {

    // if points is defined at all...
    if (points && points.length > 1) {

        // console.log("creating PathLine!", period);
        var index, xyz;
        var colors = [];
        var spline = new THREE.Spline();
        var numPoints = points.length*nDivisions;

        var splineGeometry = new THREE.Geometry();

        spline.initFromArray(points);
        for (var i=0; i <= numPoints; i++) {

            index = i/numPoints;
            xyz = spline.getPoint(index);
            splineGeometry.vertices[i] = new THREE.Vector3( xyz.x, xyz.y, xyz.z );
            colors[ i ] = new THREE.Color(color);

        }
        splineGeometry.colors = colors;
        splineGeometry.computeBoundingSphere();

        var material = new THREE.LineBasicMaterial({
            color: rgbToHex(255, 255, 255),
            linewidth: 2,
            vertexColors: THREE.VertexColors,
            transparent: true,
            opacity: 0.5
        });

        var mesh = new THREE.Line(splineGeometry, material);
        mesh.halo_id = id;
        mesh.halo_period = period;
        HaloLines[id] = mesh;
        linesGroup.add(mesh);
    }

}

// kind of a misleading function name
function displayHaloData() {

    for (var i = 0; i < TimePeriods.length; i++) {

        for (var j = 0; j < TimePeriods[i].length; j++) {


            var id = TimePeriods[i][j];
            console.log(i, id)
            // Set Halo Line Visibility
            if (HaloLines[id]){
                // console.log("\tdisplaying Halo line?", i, id, config.showPaths, EPOCH_HEAD, EPOCH_TAIL)
                HaloLines[id].visible = (i >= EPOCH_HEAD && i < EPOCH_TAIL)? config.showPaths : false;
            }
            // Set Halo Spheres Visibility
            HaloSpheres[id].visible = (i >= EPOCH_HEAD && i <= EPOCH_TAIL)? config.showHalos : false;
            if (curTarget && HaloSpheres[id].position !== curTarget.object.position){
                HaloSpheres[id].material.color.set(colorKey(i));
                HaloSpheres[id].material.opacity = 0.2;
            }
        }
    }

}


/* ================================== *
 *          updateAllTheGeometry
 *  Redraws the Splines for the paths
 *  and turns sphere opacity on or off
 * ================================== */
function updateAllTheGeometry() {

    if (config.enableSelection) {

        toggleVisibility(HaloBranch,config.showPaths, 0.5);
        toggleVisibility(HaloSelect,config.showHalos, 0.05);
    } else{
        displayHaloData();
    };


}


function rgbToHex(R,G,B){
    function toHex(c) {

        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    return "#" + toHex(R) + toHex(G) + toHex(B)

}