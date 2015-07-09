/**
 * Created by krbalmryde on 7/9/15.
 */

function GUIcontrols() {

    this.showPaths = false;
    this.showHalos = true;
    this.showStats = false;
    this.showHaloMap = true;
    this.enableSelection = false;

    this.color0 = rgbToHex(255,0,0);
    this.color1 = rgbToHex(255,0,255);
    this.color2 = rgbToHex(0,0,255);
    this.color3 = rgbToHex(0,255,255);
    this.color4 = rgbToHex(0,255,0);

    this.dataset = "676638 777K";
    this.goToHead = function () { this.__resetView(0) };
    this.goToCenter = function () { this.__resetView(1) };
    this.goToTail = function () { this.__resetView(2) };
    this.animateTime = function () {};
}


GUIcontrols.prototype.__setColor = function() {

    colorKey = d3.scale.linear()
        .domain([0, 18, 36, 53, 71, NUMTIMEPERIODS])
        .range([this.color0, this.color1, this.color2, this.color3, this.color4]);

    for (var i = 0; i < EPOCH_PERIODS.length; i++) {

        for (var j = 0; j < EPOCH_PERIODS[i].length; j++) {

            var id = EPOCH_PERIODS[i][j];
            // Set Halo Line Visibility
            if (HaloLines[id]){
                // console.log("\tdisplaying Halo line?", i, id, config.showPaths, EPOCH_HEAD, EPOCH_TAIL)
                HaloLines[id].visible = (i >= EPOCH_HEAD && i < EPOCH_TAIL)? config.showPaths : false;
                HaloLines[id].material.color.set(colorKey(i));
            }
            // Set Halo Spheres Visibility
            HaloSpheres[id].visible = (i >= EPOCH_HEAD && i <= EPOCH_TAIL)? config.showHalos : false;
            HaloSpheres[id].material.color.set(colorKey(i));
        }
    }
};


GUIcontrols.prototype.__animateSlider = function(offset) {
    var step = slider.noUiSlider('step');
    console.log("animate", step, slider.val());
    // Frist we position the camera so it is looking at our Halo of interest
    var tweenToTail = new TWEEN.Tween({x: EPOCH_HEAD, y: EPOCH_TAIL})
        .to({x: 88 - offset, y: 88}, 3500)
        .onUpdate(function() {
            slider.val([this.x, this.y]);
        });

    // Then we zoom in
    var tweenToHead = new TWEEN.Tween({x: 88 - offset, y: 88})
        .to({x: 0, y: offset}, 3500)
        .onUpdate(function() {
            slider.val([this.x, this.y]);
        });

    tweenToTail.chain(tweenToHead);
    tweenToTail.start();

}



GUIcontrols.prototype.__resetView = function(toPosition) {

    console.log("You hit the reset button!!", toPosition);
    var halo;
    if (toPosition === 0) {
        (function () {
            for (var i = EPOCH_HEAD; i <= EPOCH_TAIL; i++) {

                if (halo) break;
                for (var j = 0; j < EPOCH_PERIODS[i].length; j++) {

                    var id = EPOCH_PERIODS[i][j];
                    if (HaloSpheres[id]) {
                        halo = HaloSpheres[id];
                        if (halo !== undefined) break;
                    }
                }
            }
        }());
    } else if (toPosition === 1) {
        (function () {

            var i = (EPOCH_HEAD < EPOCH_TAIL) ? (EPOCH_HEAD + parseInt((EPOCH_TAIL - EPOCH_HEAD) / 2)) : 0;
            for (var j = 0; j < EPOCH_PERIODS[i].length; j++) {

                var id = EPOCH_PERIODS[i][j];
                if (HaloSpheres[id]) {
                    halo = HaloSpheres[id];
                    if (halo !== undefined) break;
                }
            }
        }());
    } else if (toPosition === 2) {
        (function () {

            for (var i = EPOCH_TAIL; i >= EPOCH_HEAD; i--) {

                if (halo !== undefined) break;
                for (var j = 0; j < EPOCH_PERIODS[i].length; j++) {

                    var id = EPOCH_PERIODS[i][j];
                    if (HaloSpheres[id]) {
                        halo = HaloSpheres[id];
                        if (halo) break;
                    }
                }
            }
        }());
    }

    if (halo !== undefined) { // This implies we are in the wrong time-frame
        console.log("\tnew halo is", halo)
        if (curTarget.object)
            curTarget.object = halo;
        else
            prevTarget = curTarget = {object: halo};
        console.log("\tprevTarget, curTarget", prevTarget, curTarget);
        curTarget.object.material.opacity = 0.7;

        displayHaloStats();
        // displayHalos();
        tweenToPosition(1500, 500, true);
    } else {
        alert(
              "No Halos found in Selected Range!\n" +
              "Please Adjust Range and press\n" +
              "'Reset Position' -> 'Jump to Head'"
              )
    }
};


GUIcontrols.prototype.__updateData = function() {
    var that = this;
    DEFERRED = true;
    var URL = "js/assets/tree_" + this.dataset.split(' ')[0] + ".json";
    console.log("\tloading", URL)
    getHaloTreeData(URL)
        .then(function(response) {
            //console.log("Fuck Yeah!", typeof response, response);
            initHaloTree(response, false);
        }).then(function() {
            showSpinner(false);
            // Always hide the spinner
            that.__resetView(0);
        });
};


function initGUI() {
    console.log("initGUI()");
    var gui = new dat.GUI({ autoPlace: false });
    $('.ma-gui').append($(gui.domElement));
    var guiBox = gui.addFolder("Halos in a Dark Sky");
    guiBox.open();

    config = new GUIcontrols();

    /*
     * Halo Display Box
     */
    var displayBox = guiBox.addFolder("Display Halo Properties")
    {
        //Turn Halo Spheres On/Off
        var spheresController = displayBox.add(config, "showHalos").name("Halos");
        {
            spheresController.onFinishChange(function(){
                console.log("spheresController.onFinishChange");
                if (config.enableSelection)
                    toggleVisibility(HaloSelect,config.showHalos);
                else
                    toggleVisibility(HaloSpheres,config.showHalos);
            });
        }

        // Turn Halo Lines On/Off
        var linesController = displayBox.add(config, "showPaths").name("Paths");
        {
            linesController.onFinishChange(function(){
                console.log("linesController.onFinishChange");
                if (config.enableSelection)
                    toggleVisibility(HaloBranch,config.showPaths);
                else
                    toggleVisibility(HaloLines,config.showPaths);
            });
        }

        // Halo Properties display
        var statsController = displayBox.add(config, "showStats").name("Properties");
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
        displayBox.open();
    }


    /*
     * Add or Remove Datasets
     */
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


    /*
     * Position Configurations
     */
    var haloFocusBox = guiBox.addFolder("Reset Position!");
    {
        haloFocusBox.add(config, "goToHead").name("Jump to Head");
        haloFocusBox.add(config, "goToCenter").name("Jump to Center");
        haloFocusBox.add(config, "goToTail").name("Jump to Tail");
        //haloFocusBox.open();
    }

    /*
     * Interaction Components
     */
    var haloSelectionBox = guiBox.addFolder("Interaction Components");
    {
        // Turn Halo Selection Mode On/Off
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

        // Animate Time Button
        var animateTime = haloSelectionBox.add(config, "animateTime").name("Animate Time!");
        {
            animateTime.onFinishChange(function() {
                console.log((EPOCH_TAIL - EPOCH_HEAD), EPOCH_TAIL, EPOCH_HEAD)
                config.__animateSlider((EPOCH_TAIL - EPOCH_HEAD));
            })
        }

        haloSelectionBox.open();
    }


    /*
     *  Color configuration stuff
     */
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
