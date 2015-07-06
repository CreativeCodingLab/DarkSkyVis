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
        renderer.setClearColor(rgbToHex(55,55,55), 1);
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
        camera.lookAt(pos);
        controls.target.set(pos.x, pos.y, pos.z);
        controls.update();
    }

    sideCam = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
    sideCam.position.set(pos.x, pos.y+0.1, pos.z-(pos.z*0.5));
    sideCam.lookAt(pos);

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




function initGUI() {

    var gui = new dat.GUI({ autoPlace: false });
    console.log("ma gui", gui);
    var guiContainer = $('.ma-gui').append($(gui.domElement));
    var guiBox = gui.addFolder("Halos in a Dark Sky");
    guiBox.open();


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



function rgbToHex(R,G,B){
    function toHex(c) {

        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    return "#" + toHex(R) + toHex(G) + toHex(B)
}

