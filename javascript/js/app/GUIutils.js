/**
 * Created by krbalmryde on 7/9/15.
 */

"use strict";

function GUIcontrols() {

    // Display Halo Properties
    this.showPaths = false;
    this.showHalos = true;
    this.showStats = false;
    this.showHaloMap = true;

    // Set colors

    // Choose Dataset
    this.treeNum = ""
    this.dataset = "None";
    prepGlobalStructures()

    // Reset Position
    this.goToHead = function() {
        this.__goToHead()
    };
    this.goToCenter = function() {
        this.__goToCenter()
    };
    this.goToTail = function() {
        this.__goToTail()
    };

    // Interaction Components
    this.enableSelection = false;
    this.scale = 0.001; // Eventually this will apply to scaling the halos

    this.animateTime = function() {};
    this.isPlaying = false;


    this.byTime = true;
    this.byMass = false;

    // Cosmetic manipulations
    // this.color0 = rgbToHex(255, 0, 0);
    // this.color1 = rgbToHex(255, 0, 255);
    // this.color2 = rgbToHex(0, 0, 255);
    // this.color3 = rgbToHex(0, 255, 255);
    // this.color4 = rgbToHex(0, 255, 0);

}


GUIcontrols.prototype.__setColor = function() {

    colorKey = d3.scale.linear()
        .domain([0, 18, 36, 53, 71, NUMTIMEPERIODS])
        .range([this.color0, this.color1, this.color2, this.color3, this.color4]);

    for (var id in HaloLUT) {

        var i = +HaloLUT[id].time;

        // Set Halo Line Visibility
        if (linesGroup.getObjectByName(id)) {
            // console.log("\tdisplaying Halo line?", i, id, config.showPaths, EPOCH_HEAD, EPOCH_TAIL)
            linesGroup.getObjectByName(id).visible = (i >= EPOCH_HEAD && i < EPOCH_TAIL) ? config.showPaths : false;
            linesGroup.getObjectByName(id).material.color.set(colorKey(i));
        }

        // Set Halo Spheres Visibility
        if (sphereGroup.getObjectByName(id)) {
            sphereGroup.getObjectByName(id).visible = (i >= EPOCH_HEAD && i <= EPOCH_TAIL) ? config.showHalos : false;
            sphereGroup.getObjectByName(id).material.color.set(colorKey(i));
        }
    }
};


GUIcontrols.prototype.__animateSlider = function(offset) {
    if (this.isPlaying){
        TWEEN.removeAll();
        this.isPlaying = false;
    } else {
        this.isPlaying = true;
        var step = slider.noUiSlider('step');
        console.log("animate", step, slider.val());
        // Frist we position the camera so it is looking at our Halo of interest
        var _dur = 3500;
        var TweenDur = _dur - (EPOCH_TAIL/NUMTIMEPERIODS * _dur)
        var tweenToTail = new TWEEN.Tween({
                x: EPOCH_HEAD,
                y: EPOCH_TAIL
            })
            .to({
                x: 88 - offset,
                y: 88
            }, TweenDur)
            .onUpdate(function() {
                slider.val([this.x, this.y]);
            });

        // Then we zoom in
        var tweenToHead = new TWEEN.Tween({
                x: 88 - offset,
                y: 88
            })
            .to({
                x: 0,
                y: offset
            }, TweenDur)
            .onUpdate(function() {
                slider.val([this.x, this.y]);
            });

        tweenToTail.chain(tweenToHead);
        tweenToTail.start();
    }
    console.log("this.isPlaying", this.isPlaying);
    this.isPlaying = false;

};

GUIcontrols.prototype.__goToHead = function() {
    var halo;
    for (var i = EPOCH_HEAD; i <= EPOCH_TAIL; i++) {

        if (halo) break;
        for (var j = 0; j < EPOCH_PERIODS[i].length; j++) {

            var id = EPOCH_PERIODS[i][j];
            if (sphereGroup.getObjectByName(id)) {
                halo = sphereGroup.getObjectByName(id);
                if (halo !== undefined) break;
            }
        }
    }
    this.__resetView(halo);
};

GUIcontrols.prototype.__goToCenter = function() {
    var halo;
    var i = (EPOCH_HEAD < EPOCH_TAIL) ? (EPOCH_HEAD + parseInt((EPOCH_TAIL - EPOCH_HEAD) / 2)) : 0;
    for (var j = 0; j < EPOCH_PERIODS[i].length; j++) {

        var id = EPOCH_PERIODS[i][j];
        if (sphereGroup.getObjectByName(id)) {
            halo = sphereGroup.getObjectByName(id);
            if (halo !== undefined) break;
        }
    }

    this.__resetView(halo);
};

GUIcontrols.prototype.__goToTail = function() {
    var halo;
    for (var i = EPOCH_TAIL; i >= EPOCH_HEAD; i--) {

        if (halo !== undefined) break;
        for (var j = 0; j < EPOCH_PERIODS[i].length; j++) {

            var id = EPOCH_PERIODS[i][j];
            if (sphereGroup.getObjectByName(id)) {
                halo = sphereGroup.getObjectByName(id);
                if (halo) break;
            }
        }
    }
    this.__resetView(halo);
};

GUIcontrols.prototype.__resetView = function(halo) {
    console.log("You hit the reset button!!", halo);

    // if (this.showHaloMap) {

    //     tweenToPosition

    // } else
    if (halo !== undefined) { // This implies we are in the wrong time-frame
        console.log("\tnew halo is", halo)
        if (curTarget.object)
            curTarget.object = halo;
        else
            prevTarget = curTarget = {
                object: halo
            };
        console.log("\tprevTarget, curTarget", prevTarget, curTarget);
        curTarget.object.material.opacity = 0.7;

        displayHaloStats();
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
    showSpinner(true);
    var that = this;
    if (HaloSelect.hasOwnProperty("length") && HaloSelect.length > 1) {
        console.log("Adding MULTIPLE HALOS")
        for (var i = 0; i < HaloSelect.length; i++) {
            console.log(HaloSelect[i])
            var URL = "js/assets/trees/tree_" + HaloSelect[i].toString() + ".json";
            console.log("\nAdding..", URL)
            initHaloTree(URL, false);
        };
    } else {
        var URL = "js/assets/trees/tree_" + this.dataset.split(' ')[0] + ".json";
        console.log("\nUpdating!", URL)
        initHaloTree(URL, true);
        tweenToPosition(1500, 1500, true);
    };
};


function initGUI() {
    console.log("initGUI()");
    var gui = new dat.GUI({
        autoPlace: false
    });
    $('.ma-gui').append($(gui.domElement));
    var guiBox = gui.addFolder("Halos in a Dark Sky");
    guiBox.open();

    config = new GUIcontrols();

    /*
     * Halo Display Box
     */
    var displayBox = guiBox.addFolder("Display Halo Properties");
    {
        //Turn Halo Spheres On/Off
        var spheresController = displayBox.add(config, "showHalos").name("Halos").listen();
        {
            spheresController.onFinishChange(function() {
                console.log("spheresController.onFinishChange");
                if (config.enableSelection)
                    toggleVisibility(HaloSelect, config.showHalos);
                else
                    sphereGroup.visible = config.showHalos;
                // toggleVisibility(sphereGroup.getObjectByName,config.showHalos);
            });
        }

        // Turn Halo Lines On/Off
        var linesController = displayBox.add(config, "showPaths").name("Paths").listen();
        {
            linesController.onFinishChange(function() {
                console.log("linesController.onFinishChange");
                if (config.enableSelection)
                    toggleVisibility(HaloBranch, config.showPaths);
                else
                    linesGroup.visible = config.showPaths;
            });
        }

        var cloudController = displayBox.add(config, "showHaloMap").name("Cluster").listen();
        {
            cloudController.onFinishChange(function() {
                console.log("cloudController.onFinishChange");
                pointCloud.visible = config.showHaloMap;
            })
        }

        // Halo Properties display
        var statsController = displayBox.add(config, "showStats").name("Properties");
        {
            statsController.onFinishChange(function() {
                console.log("statsController.onFinishChange");
                haloStats
                    .style("display", function() {
                        if (config.showStats)
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
        var text = dataSetBox.add(config, "treeNum").name("Enter Tree #").listen();
        {
            text.onFinishChange(function(){
                config.dataset = config.treeNum;
                console.log("\tTreeNum entered!", config.treeNum, config.dataset)
                config.__updateData();
            });
        }


        var data = dataSetBox.add(config, "dataset", [
            "None",
            "676638 777K", "681442 867K",
            "678449 911K", "676674 925K",
            "674518 945K", "675540 1.1M",
            "680478 1.2M", "677567 1.3M",
            "677601 1.3M", "680500 1.4M",
            "680488 1.4M", "676657 1.5M",
            "676579 1.5M", "675530 1.7M",
            "679604 1.7M", "679642 1.9M",
            "674567 2.4M", "676540 2.4M",
            "679619 2.8M", "674539 2.9M",
            "681422 2.9M", "677545 2.9M",
            "677521 3.6M", "680462 4.0M",
            "679582 6.0M"
        ]).listen();
        data.name("Tree #");
        data.onFinishChange(function() {
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
    var haloInteractionBox = guiBox.addFolder("Interaction Components");
    {
        // Turn Halo Selection Mode On/Off
        var selectionController = haloInteractionBox.add(config, "enableSelection").name("Enable Selection");
        {
            selectionController.onFinishChange(function() {
               resetHaloBranchs();
//                console.log("selectionController.onFinishChange");
                if (config.enableSelection) {

                    console.log("Selection Mode is active!");
                    renderer.setClearColor(rgbToHex(150, 150, 150), 1);
                } else {
                    toggleVisibility(linesGroup, config.showPaths);
                    toggleVisibility(sphereGroup, config.showHalos);
                    renderer.setClearColor(rgbToHex(0, 0, 0), 1);
                }

            })
        }

        var scalingController = haloInteractionBox.add(config, "scale").min(0.0001).step(0.0001).name("Scale Halo");
        {
            scalingController.onFinishChange(function() {
                console.log("trying out scaling");
                var scale = config.scale <= 0.0 ? 0.0001 : config.scale;
                sphereGroup.children.forEach(function(mesh) {
                    var _s = scale * mesh.rs1;
                    mesh.scale.set(_s, _s, _s);
                });
            });
        }

        // Animate Time Button
        var animateTime = haloInteractionBox.add(config, "animateTime").name("Animate Time!");
        {
            animateTime.onFinishChange(function() {
                console.log((EPOCH_TAIL - EPOCH_HEAD), EPOCH_TAIL, EPOCH_HEAD)
                config.__animateSlider((EPOCH_TAIL - EPOCH_HEAD));
            })
        }

        haloInteractionBox.open();
    }

    /*
     *  Color configuration stuff
    */
    var colorBox = guiBox.addFolder("Color Schemes");
    {
        var byTime = colorBox.add(config, "byTime").name("By Time").listen()
        {
            byTime.onFinishChange(function() {
                if (config.byTime) {
                    config.byMass = false;
                    sphereGroup.children.forEach(function(mesh) {
                        // console.log("byTime: there is mesh?", mesh.period, colorKey(+mesh.period));
                        mesh.material.color =  colorKey(+mesh.period)
                    })
                } else {
                    config.byTime = true;
                    config.byMass = false;
                    console.log("Else byTime still true?", config.byTime, config.byMass);
                };
            })
        }
        var byMass = colorBox.add(config, "byMass").name("By Mass").listen()
        {
            byMass.onFinishChange(function() {
                if (config.byMass) {
                    config.byTime = false;
                    sphereGroup.children.forEach(function(mesh) {
                        // console.log("byMass: there is mesh?", mesh);
                        mesh.material.color.set(
                                // new THREE.Color( 0.5 + 0.5*mesh.vr , mesh.mvir/sphereGroup.maxMASS, 0.5 - 0.5*mesh.vr )
                                new THREE.Color( 0.5 + 0.5*mesh.vr , mesh.mvir/pointCloud.maxMASS, 0.5 - 0.5*mesh.vr )
                                // new THREE.Color( 0.5 + 0.5*mesh.vr , mesh.mvir/mesh.maxMASS, 0.5 - 0.5*mesh.vr )

                            )
                    })

                } else {
                    config.byTime = false;
                    config.byMass = true;
                    console.log("Else byMass still true?", config.byMass, config.byTime);
                    // sphereGroup.children.forEach(function(mesh) {

                    // })
                };
            })
        }
        // colorBox.addColor(config, "color0").onChange(function() {
        //     config.__setColor()
        // });
        // colorBox.addColor(config, "color1").onChange(function() {
        //     config.__setColor()
        // });
        // colorBox.addColor(config, "color2").onChange(function() {
        //     config.__setColor()
        // });
        // colorBox.addColor(config, "color3").onChange(function() {
        //     config.__setColor()
        // });
        // colorBox.addColor(config, "color4").onChange(function() {
        //     config.__setColor()
        // });
    }
};