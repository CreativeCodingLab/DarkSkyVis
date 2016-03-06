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

    // Choose Dataset
    this.dataset = "None";
    this.treeNum = ""
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
    this.enableInspection = false;
    this.depth = 2;
    this.scale = 0.001; // Eventually this will apply to scaling the halos
    this.scaleByRadius = true;

    this.animateTime = function() {};
    this.isPlaying = false;

    this.screenshot = function() {};

    // Cosmetic manipulations
    this.showSubs = true;
    this.showSupers = true;
    this.showDecendant = true;

}

GUIcontrols.prototype.__updateData = function() {
    showSpinner(true);
    var that = this;
    if (HaloSelect.length > 1) {
        console.log("Adding MULTIPLE HALOS")
        for (var i = 0; i < HaloSelect.length; i++) {
            console.log(HaloSelect[i])
            var URL = "js/assets/trees/tree_" + HaloSelect[i].toString() + ".json";
            console.log("\nAdding..", URL)
            initHaloTree(URL, false);
        };
    } else {
        if (this.dataset !== "None") {
            var URL = "js/assets/trees/tree_" + this.dataset + ".json";
            console.log("\nUpdating!", URL)
            initHaloTree(URL, true);
            tweenToPosition(1500, 1500, true);
        };
    };
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


GUIcontrols.prototype.__setColor = function() {

    epochColorKey = d3.scale.linear()
        .domain([0, 18, 36, 53, 71, NUMTIMEPERIODS])
        .range([this.color0, this.color1, this.color2, this.color3, this.color4]);

    for (var id in HaloLUT) {

        var i = +HaloLUT[id].time;

        // Set Halo Line Visibility
        if (linesGroup.getObjectByName(id)) {
            // console.log("\tdisplaying Halo line?", i, id, config.showPaths, EPOCH_HEAD, EPOCH_TAIL)
            linesGroup.getObjectByName(id).visible = (i >= EPOCH_HEAD && i < EPOCH_TAIL) ? config.showPaths : false;
            linesGroup.getObjectByName(id).material.color.set(epochColorKey(i));
        }

        // Set Halo Spheres Visibility
        if (sphereGroup.getObjectByName(id)) {
            sphereGroup.getObjectByName(id).visible = (i >= EPOCH_HEAD && i <= EPOCH_TAIL) ? config.showHalos : false;
            sphereGroup.getObjectByName(id).material.color.set(epochColorKey(i));
        }
    }
};

var __showStruct = function() {
    console.log("ShowStruct", config.showSupers, config.showSubs, config.showDecendant);
    mapGroup.children.forEach(function(mesh){
        if (mesh.isSub && !mesh.isSuper)
            mesh.visible = config.showSubs
        else
            mesh.visible = config.showDecendant
    })
}

var __showStruct2 = function() {
    console.log("ShowStruct", config.showSupers, config.showSubs, config.showDecendant);
    supGroup.children.forEach(function(mesh){
        mesh.visible = config.showSupers
    })
}

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
                if (config.enableInspection)
                    toggleVisibility(mapGroup, config.showHalos);
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
                if (config.enableInspection)
                    toggleVisibility(traceGroup, config.showPaths);
                else
                    linesGroup.visible = config.showPaths;
            });
        }

        // var cloudController = displayBox.add(config, "showHaloMap").name("Cluster").listen();
        // {
        //     cloudController.onFinishChange(function() {
        //         console.log("cloudController.onFinishChange");
        //         pointCloud.visible = config.showHaloMap;
        //     })
        // }

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
            "676638", "681442",
            "678449", "676674",
            "674518", "675540",
            "680478", "677567",
            "677601", "680500",
            "680488", "676657",
            "676579", "675530",
            "679604", "679642",
            "674567", "676540",
            "679619", "674539",
            "681422", "677545",
            "677521", "680462",
            "679582", "31410"
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
    var restPositionBox = guiBox.addFolder("Reset Position!");
    {
        restPositionBox.add(config, "goToHead").name("Jump to Head");
        restPositionBox.add(config, "goToCenter").name("Jump to Center");
        restPositionBox.add(config, "goToTail").name("Jump to Tail");
        //restPositionBox.open();
    }

    /*
     * Interaction Components
     */
    var haloInteractionBox = guiBox.addFolder("Interaction Components");
    {
        // Turn Halo Selection Mode On/Off
        var inspectionController = haloInteractionBox.add(config, "enableInspection").name("Inspect");
        {
            inspectionController.onFinishChange(function() {
                config.showHaloMap = false;
                // pointCloud.visible = false;

                if (config.enableInspection) {
                    showSpinner(true);
                    renderer.autoClear = false;
                    haloInteractionDisplayBox.open();
                    //resetGlobalStructures('point');
                    console.log("Selection Mode is active!");
                    sphereGroup.visible = false;

                    prepareHalosForInspection();
                    linesGroup.visible = false;

                    config.showPaths = true;
                    showSpinner(false);
                    // renderer.setClearColor(rgbToHex(255, 255, 255), 1);


                } else {
                    renderer.autoClear = true;
                    haloInteractionDisplayBox.close();
                    // toggleVisibility(linesGroup, config.showPaths);
                    // toggleVisibility(sphereGroup, config.showHalos);
                    showSpinner(true);
                    resetGlobalStructures('inspect');
                    createHaloTrajectories();
                    //initHaloMap("js/assets/hlist_1.0.json");
                    // renderer.setClearColor(rgbToHex(255, 255, 255), 1);
                    showSpinner(false);
                    // var map = THREE.ImageUtils.loadTexture( "js/assets/sprites/nova.png" );  // http://www.goktepeliler.com/vt22/images/414mavi_klar_11_.png
                    // map.minFilter = THREE.NearestFilter;
                    // sphereGroup.children.forEach(function(mesh) {
                    //         mesh.material.map = map;
                    // });
                }

            })
        }

        var depthController = haloInteractionBox.add(config, "depth"). min(0).step(1).name("Depth")

        var scaleByRadiusController = haloInteractionBox.add(config, "scaleByRadius").name("Scale By Radius");

        var scalingController = haloInteractionBox.add(config, "scale").min(0.0001).step(0.0001).name("Scale Halo");
        {
            scalingController.onFinishChange(function() {
                console.log("trying out scaling");
                var scale = config.scale <= 0.0 ? 0.0001 : config.scale;
                var _s;
                if (!config.enableInspection) {
                    sphereGroup.children.forEach(function(mesh) {
                        var id = +mesh.name;
                        if (config.scaleByRadius)
                            _s = scale * mesh.rs1;
                        else
                            _s = scale;

                        mesh.scale.set(_s, _s, _s);
                    });
                } else {
                    mapGroup.children.forEach(function(mesh) {
                        var id = +mesh.name;
                        if (HaloLUT[id]) {
                            if (HaloLUT[id].isSub)
                                _s = 0.05;
                            else {
                                if (config.scaleByRadius)
                                    _s = scale * mesh.rs1;
                                else
                                    _s = scale;
                            // } else {
                            //     _s = 0.1;
                            }
                        }
                        mesh.scale.set(_s, _s, _s);
                    });

                    supGroup.children.forEach(function(mesh) {
                        var id = +mesh.name;
                        if (HaloLUT[id]) {
                            if (config.scaleByRadius)
                                _s = scale * mesh.rs1;
                            else
                                _s = scale;
                        }
                        mesh.scale.set(_s, _s, _s);
                    });

                }

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

        var haloInteractionDisplayBox = haloInteractionBox.addFolder("Display Halo Structures");
        {
            var showSuper = haloInteractionDisplayBox.add(config, "showSupers").name("SuperStructs").listen()
            {
                showSuper.onFinishChange(__showStruct2);
            }

            var showSub = haloInteractionDisplayBox.add(config, "showSubs").name("SubStructs").listen()
            {
                showSub.onFinishChange(__showStruct);
            }

            var showDec = haloInteractionDisplayBox.add(config, "showDecendant").name("Decendants").listen()
            {
                showDec.onFinishChange(__showStruct);
            }
        }

    }


    // var haloColorBox = guiBox.addFolder("Color By Attributes");
    // {
    //     var colorByTime = haloColorBox.add(config, "byTime").name("By Time").listen();
    //     {
    //         colorByTime.onFinishChange(function() {
    //             console.log("color by Time!")
    //             if (config.byMass)
    //                 config.byMass = false;

    //             if  (config.enableInspection) {
    //                 mapGroup.children.forEach(function(mesh){
    //                     mesh.material.color.set(epochColorKey(+mesh.period))
    //                 });
    //             } else {
    //                 sphereGroup.children.forEach(function(mesh){
    //                     mesh.material.color.set(epochColorKey(+mesh.period))
    //                 });
    //             }
    //         });
    //     }

    //     var colorByMass = haloColorBox.add(config, "byMass").name("By Mass").listen();
    //     {
    //         colorByMass.onFinishChange(function() {
    //             console.log("color by mass!")
    //             if (config.byTime)
    //                 config.byTime = false;

    //             if  (config.enableInspection) {
    //                 mapGroup.children.forEach(function(mesh){
    //                     mesh.material.color.set(propertyColorKey(+mesh.mvir/maxMass))
    //                 });
    //             } else {
    //                 sphereGroup.children.forEach(function(mesh){
    //                     mesh.material.color.set(epochColorKey(+mesh.mvir/maxMass))
    //                 });
    //             }
    //         });
    //     }

    // }

};