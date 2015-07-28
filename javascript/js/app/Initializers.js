/**
 * Created by krbalmryde on 7/7/15.
 */

"use strict";

// *****************************
//      Order does matter
// *****************************

function initScene() {
    console.log("initScene()");
    scene = new THREE.Scene();

    // **** Adding our Group object ***
    {
        linesGroup = new THREE.Object3D();
        sphereGroup = new THREE.Object3D();
        traceGroup = new THREE.Object3D();
        arrowGroup = new THREE.Object3D();
        pointCloud = new THREE.PointCloud();

        scene.fog = new THREE.Fog(0x050505, 2000, 3500);

        scene.add(linesGroup);
        scene.add(sphereGroup);
        scene.add(traceGroup);
        scene.add(arrowGroup);
        scene.add(pointCloud);

    }

}


function initRenderer() {
    console.log("initRenderer()");
    // preserveDrawingBuffer allows us to take a screenshot!
    // There is a performance implication to this however, so dont use it if not needed
    // http://stackoverflow.com/questions/15558418/how-do-you-save-an-image-from-a-three-js-canvas
    // renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer = new THREE.WebGLRenderer({ antialias: true });
    {
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(1,1,1, 1);
        renderer.gammaInput = true;
        renderer.gammaOutput = true;
    }

}


function initContainer() {
    console.log("initContainer()")
    container = document.getElementById('DarkSky');
    container.appendChild(renderer.domElement);

}

// *****************************
//      Order doesnt matter
// *****************************


function initLights() {
    console.log("initLights()")
         var ambient = new THREE.AmbientLight(0xFFFFFF); //rgbToHex(197, 176, 255)
         scene.add(ambient);

    //light = new THREE.PointLight(0xffffff, 0.5, 1000);
    //light.position.set(1, 1, 1);
    //
    var dir1 = new THREE.DirectionalLight(0xffffff, 0.5)
    //light.position.set(0, 0, 0);
    //scene.add(light);
    scene.add(dir1);

}

function initRayCaster() {
    console.log("initRayCaster()")
    raycaster = new THREE.Raycaster();
    {
        raycaster.params.PointCloud.threshold = 0.1;
        mouse = new THREE.Vector2();
        // curTarget.object.material.opacity = 0.7;
        // tweenToPosition(250, 250, false);
    }

}

function initCamera() {
    console.log("initCamera()", curTarget);
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    {
        // **** position the camera near the first halo; ***
        // var pos = sphereGroup.children[0].position;
        // var pos = curTarget.object.position;
        // console.log("\t", pos)
            // var pos = pointCloud.position;
        // light.position.set(pos.x, pos.y + 0.1, pos.z - (pos.z * 0.5));
        // camera.position.set(-1, -1, -1);
        controls = new THREE.TrackballControls(camera, renderer.domElement); {
            controls.rotateSpeed = 4.0;
            controls.zoomSpeed = 1.5;
            controls.panSpeed = 1.0;

            controls.noZoom = false;
            controls.noPan = false;

            controls.staticMoving = false;
            controls.dynamicDampingFactor = 0.3;

            controls.keys = [65, 83, 68];
            controls.enabled = true;
        }
        // camera.lookAt(pos);
        // controls.target.set(-1, -1, -1);
        // controls.update();
        // updateLightPosition();
    }

}

function initListeners() {
    console.log("initListeners()")
    window.addEventListener('resize', onReshape, false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('click', onMouseClick, true);
    window.addEventListener('dblclick', onMouseDoubleClick, true);
    window.addEventListener('keypress', onKeyPress, false);

}

function initStatsInfo() {
    console.log("initStatsInfo\n");
    haloStats = d3.select("#DarkSky")
        .append("div")
        .attr("class", "haloStats");

    $('.haloStats').append($(haloStats.domElement));
    console.log(haloStats);

}

function initSlider() {
    console.log("initSlider()");
    slider = $('.tslider');
    slider.noUiSlider({
        start: [0, 88],
        connect: true, // shows areas of coverage
        orientation: "vertical",
        direction: "ltr", //
        behaviour: 'drag-tap', // allows user to drag center around
        step: 1, // steps between values
        format: wNumb({ // determines number format
            decimals: 0
        }),
        range: { // min and max of range
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



function initSpinner() {
    var opts = {
        lines: 20, // The number of lines to draw
        length: 50, // The length of each line
        width: 12, // The line thickness
        radius: 84, // The radius of the inner circle
        scale: 1, // Scales overall size of the spinner
        corners: 1, // Corner roundness (0..1)
        color: rgbToHex(255, 255, 255), // #rgb or #rrggbb or array of colors
        opacity: 0, // Opacity of the lines
        rotate: 90, // The rotation offset
        direction: 1, // 1: clockwise, -1: counterclockwise
        speed: 0.5, // Rounds per second
        trail: 100, // Afterglow percentage
        fps: 20, // Frames per second when using setTimeout() as a fallback for CSS
        zIndex: 2e9, // The z-index (defaults to 2000000000)
        className: 'spinner', // The CSS class to assign to the spinner
        top: '43%', // Top position relative to parent
        left: '50%', // Left position relative to parent
        shadow: false, // Whether to render a shadow
        hwaccel: true, // Whether to use hardware acceleration
        position: 'absolute' // Element positioning
    };
    var target = document.getElementById('loading')
    spinner = new Spinner(opts).spin(target);
    spinner.stop();
    console.log("Initializing the spinner!", target, spinner)
}