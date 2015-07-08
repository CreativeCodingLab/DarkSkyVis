/**
 * Created by krbalmryde on 7/7/15.
 */


// *****************************
//      Order does matter
// *****************************

function initScene() {

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

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    {
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.setClearColor(rgbToHex(50,50,50), 1);
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

    light = new THREE.PointLight( 0xffffff, 0.5, 100);
    light.position.set( 1, 1, 1 );
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
            for (var j = 0; j < EPOCH_PERIODS[i].length; j++) {

                var id = EPOCH_PERIODS[i][j];
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
        camera.lookAt(pos)
        controls.target.set(pos.x, pos.y, pos.z);
        controls.update();
        updateLightPosition();
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

function initGUI() {

    var gui = new dat.GUI({ autoPlace: false });
    console.log("ma gui", gui);
    var guiContainer = $('.ma-gui').append($(gui.domElement));
    var guiBox = gui.addFolder("Halos in a Dark Sky");
    guiBox.open();


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
                renderer.setClearColor(rgbToHex(150,150,150), 1);
            } else {
                __resetHaloBranch();
                toggleVisibility(HaloLines, config.showPaths);
                toggleVisibility(HaloSpheres, config.showHalos);
                renderer.setClearColor(rgbToHex(50,50,50), 1);
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