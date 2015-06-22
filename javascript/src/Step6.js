/**
 * Created by krbalmryde on 6/6/15.
 */

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container;
var head, tail;
var scene, renderer;
var camera, slider;
var mouse, raycaster, ambient;
var HaloLUT, TimePeriods, Traversed={};
var HaloLinesObjs = [];
var HaloLines = [], HaloSpheres = [];
var hits = [], curTarget, prevTarget;
var nDivisions = 10, NUMTIMEPERIODS = 12;
var numPoints = NUMTIMEPERIODS * nDivisions;
var guiControls;
var DATASETS = {"Path257":PATH257, "SampleTree":HALOTREE, "Tree676638":TREE676638};

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
    initHaloTree(TREE676638, true);

    // **** Make some Spline Geometry ***
    createHaloGeometry();

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
        //console.log("initRayCaster()", head, HaloSpheres);
        // **** Have to set this so it doesnt complain! ***
        var halo;
        for (var i = head; i < tail; i++) {
            if (halo) break;
            for (var j = 0; j < HaloSpheres[i].length; j++){
                halo = HaloSpheres[i][j];
                if ( halo ) break;
            }
        }

        prevTarget = curTarget = {object: halo};
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
    window.addEventListener( 'mousedown', onMouseClick, true );
    //window.addEventListener( 'keypress', onKeyPress, false );
}


function initGUI() {

    var gui = new dat.GUI({ autoPlace: false });
    var guiContainer = $('.ma-gui').append($(gui.domElement));
    var guiBox = gui.addFolder("Halos in a Dark Sky");
    guiBox.open();

    function updateData(dataset) {
        console.log("Gui Event Fired! .onChange", dataset);
        resetGlobalStructures();
        initHaloTree(dataset, false);
        createHaloGeometry();
        //var halo;
        //for (var i = head; i < tail; i++) {
        //    if (halo) break;
        //    for (var j = 0; j < HaloSpheres[i].length; j++){
        //        halo = HaloSpheres[i][j];
        //        if ( halo ) break;
        //    }
        //}
        //prevTarget = curTarget = {object: halo};
        //onFrame();
    }

    var GUIcontrols = function() {
        this.showPaths = true;
        this.showHalos = true;
        this.Path257 = function () { updateData(PATH257) };
        this.SampleTree = function () { updateData(HALOTREE) };
        this.Tree676638 = function () { updateData(TREE676638) };
        this.reset = function() {
            prevTarget = curTarget.object = HaloSpheres[head][0];
            tweenToPosition();
        }
    };

    var config = new GUIcontrols();

    var spheresController = guiBox.add(config, "showHalos");
    spheresController.onFinishChange(function(){
        console.log("spheresController.onFinishChange");
        for (var i=head; i< tail+1; i++) {
            for (var j=0; j < HaloSpheres[i].length; j++) {
                HaloSpheres[i][j].visible = config.showHalos;
            }
        }
    });


    var linesController = guiBox.add(config, "showPaths");
    linesController.onFinishChange(function(){
        console.log("linesController.onFinishChange");
        for (var i=head; i< tail+1; i++) {
            for (var j=0; j < HaloLinesObjs[i].length; j++) {
                HaloLinesObjs[i][j].visible = config.showPaths;
            }
        }
    });

    //var dataSetBox = guiBox.addFolder("Choose a dataset!");
    //dataSetBox.open();
    //dataSetBox.add(config, "Path257");
    //dataSetBox.add(config, "SampleTree");
    //dataSetBox.add(config, "Tree676638");

    guiBox.add(config, "reset");

}


function initSlider() {
    // console.log("\t initSlider()");
    slider = $('.tslider');
    slider.noUiSlider({
        start: [0, 88],
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
    head = parseInt(slider.val()[0]);
    tail = parseInt(slider.val()[1]);

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


function onMouseClick() {
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera( mouse, camera );
    // calculate objects intersecting the picking ray
    var hit = raycaster.intersectObjects( sphereGroup.children )[0];
    if (hit && (hit.object.material.opacity !== 0.0 && hit.object.visible)) {
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
 *          render
 *  Our render function which renders
 *  the scene and its associated objects
 * ================================== */
function initHaloTree(DATASET, firstTime) {
    console.log("\n\ninitHaloTree!!", firstTime);
    HaloLUT = {length: 0};  // just to keep track of how many objects we have

    if (firstTime)
        prepGlobalStructures();
    else
        resetGlobalStructures();

    // PATH257, HALOTREE, TREE676638
    for (var i = 0; i < DATASET.length; i++) {
        var halo = DATASET[i];
        halo.children = [];  // add list for children/descendants
        halo.parents = [];  // add list for halo parents
        halo.rs1 = (halo.rvir / halo.rs);  // convenience keys, one divided by
        halo.rs2 = (halo.rvir * halo.rs);  // the other multiplied
        halo.vec3 = THREE.Vector3(halo.x, halo.y, halo.z);  // Convenience, make a THREE.Vector3
        halo.parentID = []; // This will keep track of its parent, use it as an array in order to store multiple parents as the case may be
        halo.time = parseInt(halo.scale * 100) - tree_offset;
        //console.log("\tHalo.id ", halo.id, "Halo.scale",halo.scale, "Halo.time",halo.time);
        // add Halos to list by ID
        HaloLUT[halo.id] = halo;
        HaloLUT.length++;

        TimePeriods[halo.time].push(halo.id);
    }

    console.log("\n\tTimePeriods", TimePeriods,"\n");
    console.log("\tHaloLUT", HaloLUT,"\n");
}


// Helper Function, closure
function prepGlobalStructures() {
    console.log("calling prepGlobalStructures()!");
    HaloLines = [];
    HaloSpheres = [];
    HaloLinesObjs = [];

    TimePeriods = [];
    for (var i = 0; i < 89; i++) {
        HaloLines[i] = [];
        HaloSpheres[i] = [];
        TimePeriods[i] = [];
        HaloLinesObjs[i] = [];
    }
}

function resetGlobalStructures() {
    console.log("calling resetGlobalStructures()!");
    for (var i = 0; i < TimePeriods.length; i++) {
        console.log(i);
        for (var j = 0; j < HaloLinesObjs[i].length; j++) {
            console.log(i,j,  HaloSpheres[i], HaloLinesObjs[i]);
            var line = HaloLinesObjs[i][j];
            var sphere = HaloSpheres[i][j];


            if (sphere) {
                console.log("its a bingo!");
                console.log(sphere, sphereGroup.children.length);
                sphereGroup.remove(sphere);
                scene.remove(sphere);
                //sphere.dispose();
                sphere.material.dispose();
                sphere.geometry.dispose();
                console.log(sphere, sphereGroup.children.length);
                //HaloSpheres[i][j] = "fuck yo sphere";
            }
            if (line) {
                console.log(line, linesGroup.children);
                linesGroup.remove(line);
                scene.remove(line);
                //line.dispose();
                line.material.dispose();
                line.geometry.dispose();
                console.log(line, linesGroup.children.length);
                //HaloLinesObjs[i][j] = "fuck yo line";
            }

        }
    }
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
function createHaloGeometry() {
    console.log("\n\ncreateHaloGeometry()!!");
    console.log("\n\tTimePeriods", Array.isArray(TimePeriods), TimePeriods,"\n");

    var color = d3.scale.category20();

    // We only need to iterate around the head and tail
    for (var i = 0; i < TimePeriods.length; i++) {
    //for (var i = head; i < tail + 1; i++) {
        var Halos = TimePeriods[i];

        for (var j = 0; j < Halos.length; j++) {
            //console.log(j, "Halos.length", Halos.length, "Halos",Halos);
            var id = Halos[j];
            //console.log("\thalo is", id);

            //if (i >= head && i <= tail) {
                if (!(id in Traversed)) {
                    var points = intoTheVoid(id, []);
                    HaloLines[i].push(points);
                } else
                    console.log("\tWe have traversed it!");

            //}
            createSphere(id, i);
        }
    }
    for (i =0; i < HaloLines.length; i++) {
        for (j = 0; j < HaloLines[i].length; j++){
            var segment = HaloLines[i][j];
            if (segment.length > 1)
                createPathLine(segment, color(i), i);
        }
    }

    //console.log("\nfinal HaloLines", HaloLines);
    //console.log("final HaloSpheres", HaloSpheres);

    // set the visibility of the halo data
    displayHaloData();
}


function displayHaloData() {
    for (var i = 0; i < TimePeriods.length; i++) {
        console.log(i);
        for (var j = 0; j < HaloLinesObjs[i].length; j++) {
            HaloLinesObjs[i][j].visible = !!(i >= head && i <= tail);
        }
        for (var k = 0; k < HaloSpheres[i].length; k++) {
            HaloSpheres[i][k].visible = !!(i >= head && i <= tail);
        }
    }
}


// Helper function
function intoTheVoid(id, points) {
    var halo = HaloLUT[id];  // use the ID to pull the halo
    //console.log("\tintoTheVoid(halo, points)", halo.id, points);
    //points.push(halo.position);
    points.push([halo.x,halo.y,halo.z,halo.id,halo.desc_id]);

    //if (halo.desc_id in HaloLUT && halo.time < tail) {
    if (halo.desc_id in HaloLUT) {
        var next = HaloLUT[halo.desc_id];
        if (halo.desc_id in Traversed) {
            //points.push(next.position);
            points.push([next.x,next.y,next.z,next.id,next.desc_id]);
            return points;
        } else {
            Traversed[halo.id] = true;
            //console.log("\t\tAdding", halo.id, "to Traversed", Traversed);
            return intoTheVoid(next.id, points);
        }
    } else {
        //console.log("\t\thalo->id:",halo.id, "!= halo.desc_id:", halo.desc_id);
        return points;
    }
}

function createPathLine(points, color, period) {
    // if points is defined at all...
    if (points && points.length > 1) {
        console.log("creating PathLine!", points);
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
            color: rgbToHex(255, 255, 255),
            linewidth: 2,
            vertexColors: THREE.VertexColors,
            transparent: true,
            opacity: 1.0
        });

        var lineMesh = new THREE.Line(splineGeometry, material);
        HaloLinesObjs[period].push(lineMesh);
        linesGroup.add(lineMesh);
    }
}


function createSphere(id, index) {
    var halo = HaloLUT[id];
    var mesh = new THREE.Mesh(
        new THREE.SphereGeometry(halo.rs1/50),
        new THREE.MeshBasicMaterial({
            color: rgbToHex(255, 255, 255),
            vertexColors: THREE.VertexColors,
            transparent: true,
            opacity: (index < head || index > tail) ? 0.0 : 0.2
        })
    );

    mesh.position.set( halo.x, halo.y, halo.z);
    mesh.updateMatrix();
    HaloSpheres[index].push(mesh);
    sphereGroup.add(mesh);
    console.log("Halospheres", index, mesh, HaloSpheres[index], HaloSpheres);
}

/* ================================== *
 *          Deprecated Functions
 *  Draws the actual Halo objects
 *  represented as spheres.

function createHaloSplineGeometry() {
    console.log("\n\n=======================================================");
    console.log("createHaloSplineGeometry()", TimePeriods.length, TimePeriods);
    console.log("=======================================================");
    var color = d3.scale.category20();
    var TimePeriodSlice = TimePeriods.slice(head, tail+1);
    console.log("\nTimeSlice.length", TimePeriodSlice.length, TimePeriodSlice);

    for (var i = 0; i < TimePeriodSlice.length; i++) {
        var Halos = TimePeriodSlice[i];
        console.log("\nTimePeriodSlice[",i,"]");

        for (var j = 0; j < Halos.length; j++) {
            console.log(j, "Halos.length", Halos.length, "Halos",Halos);
            var halo = Halos[j];
            console.log("\thalo is", halo.id);

            if (!(halo.id in Traversed)) {
                var points = intoTheVoid(halo, [ ]);
                HaloLines[i].push(points);

            } else
                console.log("\tWe have traversed it!");

        }
    }
    console.log("\nlines", HaloLines);

    for (i =0; i < HaloLines.length; i++) {
        for (j = 0; j < HaloLines[i].length; j++){
            var segment = HaloLines[i][j];
            if (segment.length > 1)
                createPathLine(segment, color(i));
        }
    }

    console.log("end createHaloSplineGeometry");
}


function createHaloSphereGeometry() {
    console.log("\n\ncreateHaloGeometry()!!");
    console.log("\n\tTimePeriods", Array.isArray(TimePeriods), TimePeriods,"\n");

    for (var i=0; i < TimePeriods.length; i++) {
        console.log("In Loop TimePeriods", i, TimePeriods.length, TimePeriods[i].length, TimePeriods[i]);
        var Halos = TimePeriods[i];

        if (Halos.length > 1) {
            console.log("HaloPositions ", Halos );
            for ( var j=0; j < Halos.length; j++){
                var halo = Halos[j];
                console.log("\t\thalo", i, j, halo.id);

                var mesh = new THREE.Mesh(
                    new THREE.SphereGeometry(halo.rs1/100),
                    new THREE.MeshBasicMaterial({
                        color: rgbToHex(255, 255, 255) ,
                        vertexColors: THREE.VertexColors,
                        transparent: true,
                        opacity: (i < head || i > tail) ? 0.0 : 0.2
                    })
                );

                mesh.position.set( halo.x, halo.y, halo.z);
                mesh.updateMatrix();
                HaloSpheres[i].push(mesh);
                sphereGroup.add(mesh);
                console.log("Halospheres", i, mesh, HaloSpheres[i], HaloSpheres);
            }
        }
    }
}
 * ================================== */


/* ================================== *
 *          updateAllTheGeometry
 *  Redraws the Splines for the paths
 *  and turns sphere opacity on or off
 * ================================== */
function updateAllTheGeometry(nDivisions) {

    //resetGlobalStructures();
    displayHaloData();
    //for (var i = 0; i < TimePeriods.length; i++) {
    //    //for (var i = head; i < tail + 1; i++) {
    //    var Halos = TimePeriods[i];
    //
    //    for (var j = 0; j < Halos.length; j++) {
    //        console.log(j, "Halos.length", Halos.length, "Halos", Halos);
    //        var id = Halos[j];
    //        console.log("\thalo is", id);
    //
    //        if (i >= head && i <= tail)
    //            if (!(id in Traversed)) {
    //                var points = intoTheVoid(id, []);
    //                HaloLines[i].push(points);
    //            } else
    //                console.log("\tWe have traversed it!");
    //        else
    //            HaloLinesObjs[i][j].geometry.dispose();  // Kill it!
    //        createSphere(id, i);
    //    }
    //}
    //for (i =0; i < HaloLines.length; i++) {
    //    for (j = 0; j < HaloLines[i].length; j++){
    //        var segment = HaloLines[i][j];
    //        if (segment.length > 1)
    //            createPathLine(segment, color(i), i);
    //    }
    //}

}

function updateSpheres() {
    //Adjust the sphere's opacity!
    var index;
    for (var i = 0; i < HaloSpheres.length; i++) {
        HaloSpheres[i].material.opacity = 0.2;
    }
    if ((tail - head) == 0)
        curTarget.object = HaloSpheres[head];
    else {
        //index = parseInt(head + (tail - head)/2);
        curTarget.object = HaloSpheres[tail];
    }
    //curTarget.object.material.color.set( rgbToHex(255,0,0) );  // line green
    //curTarget.object.material.opacity = 0.8;
    tweenToPosition(500, 250);
}



function rgbToHex(R,G,B){
    function toHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    return "#" + toHex(R) + toHex(G) + toHex(B)
}