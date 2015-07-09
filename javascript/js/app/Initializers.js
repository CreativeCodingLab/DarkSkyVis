/**
 * Created by krbalmryde on 7/7/15.
 */


// *****************************
//      Order does matter
// *****************************

function initScene() {
    console.log("initScene()")
    scene = new THREE.Scene();

    // **** Adding our Group object ***
    {
        linesGroup = new THREE.Object3D();
        sphereGroup = new THREE.Object3D();

        scene.fog = new THREE.Fog( 0x050505, 2000, 3500 );

        scene.add( linesGroup );
        scene.add( sphereGroup );

    }

}


function initRenderer() {
    console.log("initRenderer()")
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    {
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.setClearColor(rgbToHex(10,10,10), 1);
        renderer.gammaInput = true;
        renderer.gammaOutput = true;
    }

}


function initContainer() {
    console.log("initContainer()")
    container = document.getElementById( 'Sandbox' );
    container.appendChild( renderer.domElement );

}

// *****************************
//      Order doesnt matter
// *****************************


function initLights() {
    console.log("initLights()")
    // ambient = new THREE.AmbientLight(0xFFFFFF); //rgbToHex(197, 176, 255)
    // scene.add(ambient);

    light = new THREE.PointLight( 0xffffff, 0.5, 100);
    light.position.set( 1, 1, 1 );
    scene.add( light );


}

function initRayCaster() {
    console.log("initRayCaster()")
    raycaster = new THREE.Raycaster();
    {
        mouse = new THREE.Vector2();
        // **** Have to set this so it doesnt complain! ***
        var halo;

        for (var i = EPOCH_HEAD; i < EPOCH_TAIL; i++) {

            if (halo) break;
            for (var j = 0; j < EPOCH_PERIODS[i].length; j++) {

                var id = EPOCH_PERIODS[i][j];
                halo = HaloSpheres[id];
                if ( halo ) break;
            }
        }
        prevTarget = curTarget = {object: halo};
        curTarget.object.material.opacity = 0.7;
        tweenToPosition(250, 250, false);
    }

}

function initCamera() {
    console.log("initCamera()")
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
    {
        // **** position the camera near the first halo; ***
        var pos = sphereGroup.children[3].position;
        //var pos = pointCloud.position;
        light.position.set(pos.x, pos.y+0.1, pos.z-(pos.z*0.5));
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
        updateLightPosition();
    }

}

function initListeners() {
    console.log("initListeners()")
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

function initSlider() {
     console.log("initSlider()");
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

    slider.Link('upper').to("-inline-<div class='slider-value top'></div>", _insert);
    slider.Link('lower').to("-inline-<div class='slider-value bottom'></div>", _insert);

    function _insert(value) {
        // The tooltip HTML is 'this', so additional
        // markup can be inserted here.
        $(this).html(
            '<strong>Value: </strong>' +
            '<span>' + value + '</span>'
        );
    }

    EPOCH_HEAD = parseInt(slider.val()[0]);
    EPOCH_TAIL = parseInt(slider.val()[1]);
}


function initGUI() {
    console.log("initGUI()");
    var gui = new dat.GUI({ autoPlace: false });
    $('.ma-gui').append($(gui.domElement));
    var guiBox = gui.addFolder("Halos in a Dark Sky");
    guiBox.open();

    config = new GUIcontrols();

    var spheresController = guiBox.add(config, "showHalos").name("Display Halos");
    {
        spheresController.onFinishChange(function(){
            console.log("spheresController.onFinishChange");
            if (config.enableSelection)
                toggleVisibility(HaloSelect,config.showHalos);
            else
                toggleVisibility(HaloSpheres,config.showHalos);
        });
    }


    var linesController = guiBox.add(config, "showPaths").name("Display Paths");
    {
        linesController.onFinishChange(function(){
            console.log("linesController.onFinishChange");
            if (config.enableSelection)
                toggleVisibility(HaloBranch,config.showPaths);
            else
                toggleVisibility(HaloLines,config.showPaths);
        });
    }

    var statsController = guiBox.add(config, "showStats").name("Display Props");
    {
        statsController.onFinishChange(function() {
            console.log("statsController.onFinishChange");
            haloStats.style.display = config.showStats ? 'block' : 'none';

            // haloStats
            //     .style("display", function(){
            //         if (config.showStats )
            //             return "block";
            //         else
            //             return "none";
            //     })
        })
    }

    // Add or Remove Datasets
    var dataSetBox = guiBox.addFolder("Choose a Dataset");
    {
        var data = dataSetBox.add(config, "dataset", [
            "682265 3.9K", "676879 157K",
            "675650 209K", "675608 252K",
            "676638 777K", "679619 2.8M",
            "677545 2.9M", "677521 3.6M",
            "680462 4.0M", "679582 6.0M",
        ]);
        data.name("Tree #");
        data.onFinishChange(function(value) {
            config.__updateData();
        });

        dataSetBox.open();
    }


    var haloFocusBox = guiBox.addFolder("Reset Position!");
    {
        haloFocusBox.add(config, "goToHead").name("Jump to Head");
        haloFocusBox.add(config, "goToCenter").name("Jump to Center");
        haloFocusBox.add(config, "goToTail").name("Jump to Tail");
        //haloFocusBox.open();
    }

    var haloSelectionBox = guiBox.addFolder("Interaction Components");
    {
        var selectionController = haloSelectionBox.add(config, "enableSelection").name("Enable Selection");
        {
            selectionController.onFinishChange(function() {
                resetHaloBranchs();
                console.log("selectionController.onFinishChange");
                if (config.enableSelection) {

                    console.log("Selection Mode is active!");
                    renderer.setClearColor(rgbToHex(150,150,150), 1);
                } else {
                    toggleVisibility(HaloLines, config.showPaths);
                    toggleVisibility(HaloSpheres, config.showHalos);
                    renderer.setClearColor(rgbToHex(50,50,50), 1);
                }

            })
        }

        var animateTime = haloSelectionBox.add(config, "animateTime").name("Animate Time!");
        {
            animateTime.onFinishChange(function() {
                console.log((EPOCH_TAIL - EPOCH_HEAD), EPOCH_TAIL, EPOCH_HEAD)
                config.__animateSlider((EPOCH_TAIL - EPOCH_HEAD));
            })
        }

        haloSelectionBox.open();
    }


    var colorBox = guiBox.addFolder("Cosmetic");
    {
        console.log("gui cosmetics",config.color0);
        colorBox.addColor(config, "color0").onChange(function() { config.__setColor() } );
        colorBox.addColor(config, "color1").onChange(function() { config.__setColor() } );
        colorBox.addColor(config, "color2").onChange(function() { config.__setColor() } );
        colorBox.addColor(config, "color3").onChange(function() { config.__setColor() } );
        colorBox.addColor(config, "color4").onChange(function() { config.__setColor() } );

    }
}


/* ================================== *
 *          initHaloTree
 *  Our render function which renders
 *  the scene and its associated objects
 * ================================== */
function initHaloTree(DATA, firstTime) {

    console.log("\n\ninitHaloTree!!", firstTime, DATA.length);

    if (firstTime)
        prepGlobalStructures();
    else
        resetGlobalStructures();

    for (var i = 0; i < DATA.length; i++) {

        var halo = DATA[i];
        halo.rs1 = (halo.rvir / halo.rs);  // convenience keys, one divided by
        halo.rs2 = (halo.rvir * halo.rs);  // the other multiplied
        halo.vec3 = THREE.Vector3(halo.x, halo.y, halo.z);  // Convenience, make a THREE.Vector3
        halo.time = parseInt(halo.scale * 100) - 12;

        // add Halos to list by ID
        HaloLUT[halo.id] = halo;
        HaloLUT.length++;

        EPOCH_PERIODS[halo.time].push(halo.id);
    }

    // console.log("\n\tTimePeriods", EPOCH_PERIODS,"\n");
    console.log("\tHaloLUT", HaloLUT.length,"\n");

    // **** Make some Spline Geometry ***
    createHaloGeometry(EPOCH_PERIODS);
}


function initHaloMap(DATASET) {
    console.log("Init The Halo Map");
    var forestGeometry = new THREE.Geometry();

    for (var i = 0; i < DATASET.length; i++) {

        var _halo = DATASET[i];
        _halo.time = 1.0;  // We know a priori that this is the last time period
        console.log(_halo);
        var particle = new THREE.Vector3();
        particle.x = _halo.position[0];
        particle.y = _halo.position[1];
        particle.z = _halo.position[2];

        particle.vx = _halo.velocity[0];
        particle.vy = _halo.velocity[1];
        particle.vz = _halo.velocity[2];

        particle.halo_id = _halo.id;
        particle.halo_time = _halo.time;

        forestGeometry.vertices.push(particle);
        //console.log("\tHalo.id ", halo.id, "Halo.scale",halo.scale, "Halo.time",halo.time);
    }
    var material = new THREE.PointCloudMaterial( {
        color: rgbToHex(255,0,0),
        size: 0.5,
        blending: THREE.AdditiveBlending,
        transparent: true
    });

    pointCloud = new THREE.PointCloud( forestGeometry, material );
    scene.add(pointCloud);
    console.log(pointCloud );

}