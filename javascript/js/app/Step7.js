/**
 * Created by krbalmryde on 6/24/15.
 */

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container;
var EPOCH_HEAD, EPOCH_TAIL;
var scene, renderer;
var camera, slider;
var mouse, raycaster, ambient;
var HaloLUT, TimePeriods, Traversed={};
var HaloLines = [];
var Lines = [], HaloSpheres = [];
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
        //renderer.setClearColor(rgbToHex(50,50,50), 1);
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
    ambient = new THREE.AmbientLight(0xFFFFFF); //rgbToHex(197, 176, 255)
    scene.add(ambient);
}

function initRayCaster() {
    raycaster = new THREE.Raycaster();
    {
        mouse = new THREE.Vector2();
        // **** Have to set this so it doesnt complain! ***
        var halo;
        for (var i = EPOCH_HEAD; i < EPOCH_TAIL; i++) {
            if (halo) break;
            for (var j = 0; j < HaloSpheres[i].length; j++){
                halo = HaloSpheres[i][j];
                if ( halo ) break;
            }
        }

        prevTarget = curTarget = {object: halo};
        curTarget.object.material.opacity = 0.8;
        tweenToPosition(250, 250);
    }
}

function initCamera() {
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
    {
        // **** position the camera near the first halo; ***
        var pos = sphereGroup.children[3].position;
        camera.position.set(pos.x, pos.y+0.1, pos.z-(pos.z*0.05));
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
        camera.lookAt(pos);
        controls.target.set(pos.x, pos.y, pos.z);
        controls.update();
    }
}

function initListeners() {
    window.addEventListener( 'resize', onReshape, false );
    window.addEventListener( 'mousemove', onMouseMove, false );
    window.addEventListener( 'click', onMouseClick, true );
    window.addEventListener( 'dblclick', onMouseDblClick, true );
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

    var result = $.map(haloData, function(value, index) {
        return  "<b>"+ index  +":</b> " + value;
    }).join("</br>");

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
                        for (var j = 0; j < HaloSpheres[i].length; j++) {
                            halo = HaloSpheres[i][j];
                            if (halo) break;
                        }
                    }
                }());
                break;

            case 1:
                (function () {
                    var start = (EPOCH_HEAD < EPOCH_TAIL)? (EPOCH_HEAD + parseInt((EPOCH_TAIL - EPOCH_HEAD)/2)) : 0;
                    for (var j = 0; j < HaloSpheres[start].length; j++) {
                        halo = HaloSpheres[start][j];
                        if (halo) break;
                    }
                })();
                break;

            case 2:
                (function () {
                    for (var i = EPOCH_TAIL; i >= EPOCH_HEAD; i--) {
                        if (halo) break;
                        for (var j = 0; j < HaloSpheres[i].length; j++) {
                            halo = HaloSpheres[i][j];
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
        curTarget.object.material.opacity = 0.8;
        console.log("prevTarget, curTarget", prevTarget, curTarget);
        displayHaloData();
        tweenToPosition();
    }

    function __updateData(dataset) {
        initHaloTree(dataset, false);
        createHaloGeometry();
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
            toggleVisibility(HaloSpheres,config.showHalos);
        });
    }


    var linesController = guiBox.add(config, "showPaths");
    {
        linesController.onFinishChange(function(){
            console.log("linesController.onFinishChange");
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


function toggleVisibility(HaloObject, showIt) {
    for (var i=EPOCH_HEAD; i< EPOCH_TAIL+1; i++) {
        for (var j=0; j < HaloObject[i].length; j++) {
            HaloObject[i][j].visible = showIt;
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

function onMouseDblClick() {
    console.log("Double Click!!");
    // update the picking ray with the camera and mouse position
    toggleVisibility(HaloLines, false);
    toggleVisibility(HaloSpheres, false);
    //HaloBranch =
    // just need to use the halo-id's to turn the spheres on, no sense in rebuilding existing data.
    Traversed = {};
    var points = intoTheAbyss(curTarget.halo_id, [], 0);

    createPathLine(points, color(0), 0);

}

function intoTheAbyss(id, points, steps) {
    var maxSteps = 89;
    var halo = HaloLUT[id];  // use the ID to pull the halo
    points.push(halo.position);
    //points.push([halo.x,halo.y,halo.z,halo.id,halo.desc_id]); // for debugging purposes

    //if (halo.desc_id in HaloLUT && halo.time < EPOCH_TAIL) {
    if (halo.desc_id in HaloLUT && steps < maxSteps) {
        var next = HaloLUT[halo.desc_id];

        if (halo.desc_id in Traversed) {
            //if (halo.time === next.time){
            //    console.log('\t',halo.time, next.time, halo.id, next.id, halo.position, next.position);
            //    return [];
            //}
            //console.log("\t\tAdding", halo.id, "to points", halo.time, next.position);
            points.push(next.position);
            //points.push([next.x,next.y,next.z,next.id,next.desc_id]); // for debugging purposes
            return points;
        } else {
            Traversed[halo.id] = true;
            //console.log("\t\tAdding", halo.id, "to Traversed", halo.time);
            return intoTheVoid(next.id, points, steps+1);
        }
    } else {
        //console.log("\t\thalo->id:",halo.id, "!= halo.desc_id:", halo.desc_id);
        return points;
    }
}


function _createPathLine(points, color, period) {
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

        var lineMesh = new THREE.Line(splineGeometry, material);
        HaloLines[period].push(lineMesh);
        linesGroup.add(lineMesh);
    }
}



















function onMouseClick() {
    console.log("Single Click!!");
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera( mouse, camera );
    // calculate objects intersecting the picking ray
    var hit, hits = raycaster.intersectObjects( sphereGroup.children );
    for (var i = 0; hits.length; i++) {
        console.log(i, "hit?");
        hit = raycaster.intersectObjects( sphereGroup.children )[i];
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
        curTarget.object.material.opacity = 0.8;

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
                curTarget.object.material.opacity = 0.8;
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
                hits[i].object.material.opacity = 0.8;
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
        HaloSpheres = [];
        HaloLines = [];
        Traversed = { };
        HaloLUT = {length: 0};  // just to keep track of how many objects we have


        TimePeriods = [];
        for (var i = 0; i < NUMTIMEPERIODS; i++) {
            Lines[i] = [];
            HaloSpheres[i] = [];
            TimePeriods[i] = [];
            HaloLines[i] = [];
        }
    }

    function __resetGlobalStructures() {
        console.log("calling __resetGlobalStructures()!");
        for (var i = 0; i < TimePeriods.length; i++) {

            for (var j = 0; j < HaloLines[i].length; j++) {
                if (HaloLines[i][j]) {
                    linesGroup.remove(HaloLines[i][j]);
                    scene.remove(HaloLines[i][j]);
                    HaloLines[i][j].material.dispose();
                    HaloLines[i][j].geometry.dispose();
                }
            }

            for (var k = 0; k < HaloSpheres[i].length; k++) {
                //var sphere = HaloSpheres[i][k];
                if (HaloSpheres[i][k]) {
                    sphereGroup.remove(HaloSpheres[i][k]);
                    scene.remove(HaloSpheres[i][k]);
                    HaloSpheres[i][k].material.dispose();
                    HaloSpheres[i][k].geometry.dispose();
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
        halo.children = [];  // add list for children/descendants
        halo.parents = [];  // add list for halo parents
        halo.rs1 = (halo.rvir / halo.rs);  // convenience keys, one divided by
        halo.rs2 = (halo.rvir * halo.rs);  // the other multiplied
        //halo.x = (halo.x >= 60.0)? 60.0 - halo.x: halo.x;
        //halo.position[0] = halo.x
        halo.vec3 = THREE.Vector3(halo.x, halo.y, halo.z);  // Convenience, make a THREE.Vector3
        halo.parentID = []; // This will keep track of its parent, use it as an array in order to store multiple parents as the case may be
        halo.time = parseInt(halo.scale * 100) - tree_offset;
        //console.log("\tHalo.id ", halo.id, "Halo.scale",halo.scale, "Halo.time",halo.time);

        if (halo.x > 50.0 && halo.time)
            console.log(halo.time, halo.id, halo.desc_id, halo.position);

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

        var Halos = TimePeriods[i];

        for (var j = 0; j < Halos.length; j++) {

            var id = Halos[j];

            if (!(id in Traversed)) {
                var points = intoTheVoid(id, [], 0);
                Lines[i].push(points);
            }

            createSphere(id, colorKey(i),  i);
        }
    }
    for (i = 0; i < Lines.length; i++) {
        for (j = 0; j < Lines[i].length; j++){
            var segment = Lines[i][j];
            if (segment.length > 1)
                createPathLine(segment, colorKey(i), i);
        }
    }

    //console.log("\nfinal Lines", Lines);
    //console.log("final HaloSpheres", HaloSpheres);

    // set the visibility of the halo data
    displayHaloData();
}


function displayHaloData() {
    for (var i = 0; i < TimePeriods.length; i++) {
        // Set Halo Line Visibility
        for (var j = 0; j < HaloLines[i].length; j++) {
            HaloLines[i][j].visible = (i >= EPOCH_HEAD && i < EPOCH_TAIL)? config.showPaths : false;
        }

        // Set Halo Spheres Visibility
        for (var k = 0; k < HaloSpheres[i].length; k++) {
            HaloSpheres[i][k].visible = (i >= EPOCH_HEAD && i <= EPOCH_TAIL)? config.showHalos : false;
            if (curTarget && HaloSpheres[i][k].position !== curTarget.object.position){
                HaloSpheres[i][k].material.color.set(colorKey(i));
                HaloSpheres[i][k].material.opacity = 0.2;

            }

        }
    }
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

        if (halo.desc_id in Traversed) {
            //if (halo.time === next.time){
            //    console.log('\t',halo.time, next.time, halo.id, next.id, halo.position, next.position);
            //    return [];
            //}
            //console.log("\t\tAdding", halo.id, "to points", halo.time, next.position);
            points.push(next.position);
            //points.push([next.x,next.y,next.z,next.id,next.desc_id]); // for debugging purposes
            return points;
        } else {
            Traversed[halo.id] = true;
            //console.log("\t\tAdding", halo.id, "to Traversed", halo.time);
            return intoTheVoid(next.id, points, steps+1);
        }
    } else {
        //console.log("\t\thalo->id:",halo.id, "!= halo.desc_id:", halo.desc_id);
        return points;
    }
}


function createPathLine(points, color, period) {
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

        var lineMesh = new THREE.Line(splineGeometry, material);
        HaloLines[period].push(lineMesh);
        linesGroup.add(lineMesh);
    }
}



function createPathLineNoSpline(points, color, period) {
    // if points is defined at all...
    if (points && points.length > 1) {
        var xyz;
        var colors = [];

        var splineGeometry = new THREE.Geometry();

        for (var i=0; i < points.length; i++) {
            xyz = points[i];
            splineGeometry.vertices[i] = new THREE.Vector3( xyz[0], xyz[1], xyz[2] );
            colors[ i ] = new THREE.Color(color);

        }
        splineGeometry.colors = colors;
        splineGeometry.computeBoundingSphere();

        var material = new THREE.LineBasicMaterial({
            color: rgbToHex(255, 255, 255),
            linewidth: 1,
            vertexColors: THREE.VertexColors,
            transparent: true,
            opacity: 0.5
        });

        var lineMesh = new THREE.Line(splineGeometry, material);
        HaloLines[period].push(lineMesh);
        linesGroup.add(lineMesh);
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
    mesh.halo_id = id;
    mesh.halo_period = halo.time;
    mesh.position.set( halo.x, halo.y, halo.z);
    mesh.updateMatrix();
    HaloSpheres[index].push(mesh);
    sphereGroup.add(mesh);
    //console.log("created Halosphere", halo.id, index, HaloSpheres.length, HaloSpheres[index].length);
}

/* ================================== *
 *          updateAllTheGeometry
 *  Redraws the Splines for the paths
 *  and turns sphere opacity on or off
 * ================================== */
function updateAllTheGeometry() {
    displayHaloData();

}


function rgbToHex(R,G,B){
    function toHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    return "#" + toHex(R) + toHex(G) + toHex(B)
}