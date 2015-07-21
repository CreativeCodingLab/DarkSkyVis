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
    this.scale = 1.0; // Eventually this will apply to scaling the halos

    this.animateTime = function() {};
    this.isPlaying = false;

    this.screenshot = function() {};

    // Cosmetic manipulations
    this.color0 = rgbToHex(255, 0, 0);
    this.color1 = rgbToHex(255, 0, 255);
    this.color2 = rgbToHex(0, 0, 255);
    this.color3 = rgbToHex(0, 255, 255);
    this.color4 = rgbToHex(0, 255, 0);

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
    if (HaloSelect.length > 1) {
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

        // // Halo Properties display
        // var statsController = displayBox.add(config, "showStats").name("Properties");
        // {
        //     statsController.onFinishChange(function() {
        //         console.log("statsController.onFinishChange");
        //         haloStats
        //             .style("display", function() {
        //                 if (config.showStats)
        //                     return "block";
        //                 else
        //                     return "none";
        //             })
        //     })
        // }
        displayBox.open();
    }


    /*
     * Add or Remove Datasets
     */
    // var dataSetBox = guiBox.addFolder("Choose a Dataset");
    // {
    //     var data = dataSetBox.add(config, "dataset", [
    //         "None",
    //         "676638 777K", "681442 867K",
    //         "678449 911K", "676674 925K",
    //         "674518 945K", "675540 1.1M",
    //         "680478 1.2M", "677567 1.3M",
    //         "677601 1.3M", "680500 1.4M",
    //         "680488 1.4M", "676657 1.5M",
    //         "676579 1.5M", "675530 1.7M",
    //         "679604 1.7M", "679642 1.9M",
    //         "674567 2.4M", "676540 2.4M",
    //         "679619 2.8M", "674539 2.9M",
    //         "681422 2.9M", "677545 2.9M",
    //         "677521 3.6M", "680462 4.0M",
    //         "679582 6.0M"
    //     ]).listen();
    //     data.name("Tree #");
    //     data.onFinishChange(function() {
    //         config.__updateData();
    //     });

    //     dataSetBox.open();
    // }


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
//                resetHaloBranchs();
//                console.log("selectionController.onFinishChange");
                if (config.enableSelection) {

                    console.log("Selection Mode is active!");
                    renderer.setClearColor(rgbToHex(150, 150, 150), 1);
                } else {
//                    toggleVisibility(linesGroup, config.showPaths);
//                    toggleVisibility(sphereGroup, config.showHalos);
                    renderer.setClearColor(rgbToHex(50, 50, 50), 1);
                }

            })
        }

        var scalingController = haloInteractionBox.add(config, "scale").min(0.01).step(0.01).name("Scale Halo");
        {
            scalingController.onFinishChange(function() {
                console.log("trying out scaling");
                var scale = config.scale <= 0.0 ? 0.001 : config.scale;
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


        var screenCapture = haloInteractionBox.add(config, "screenshot").name("Take Picture");
        {
            screenCapture.onFinishChange(function() {
                window.open( renderer.domElement.toDataURL("image/png"), "Final");
                return false;
            });
        }
    }



    //     var haloFilterBox = guiBox.addFolder("Filter Halos by Properties");
    //     {

    //     "scale": str(data[0] + 0.000000000000000001), #Scale: Scale factor of halo.,
    //     "id": int(data[1]), #ID: ID of halo (unique across entire simulation).,
    //     "desc_scale": data[2], #Desc_Scale: Scale of descendant halo, if applicable.,
    //     "desc_id": int(data[3]), #Descid: ID of descendant halo, if applicable.,
    //     "num_prog": int(data[4]), #Num_prog: Number of progenitors.,

    //     "pid": int(data[5]), #Pid: Host halo ID (-1 if distinct halo).,
    //     "upid": int(data[6]), #Upid: Most massive host halo ID (only different from Pid in cases of sub-subs, or sub-sub-subs, etc.).,
    //     "desc_pid": data[7], #Desc_pid: Pid of descendant halo (if applicable).,
    //     "phantom": data[8], #Phantom: Nonzero for halos interpolated across timesteps.,

    //     "sam_mvir": data[9], #SAM_Mvir: Halo mass, smoothed across accretion history; always greater than sum of halo masses of contributing progenitors (Msun/h).  Only for use with select semi-analytic models.,
    //     "mvir": data[10], #Mvir: Halo mass (Msun/h).,
    //     "rvir": data[11], #Rvir: Halo radius (kpc/h comoving).,
    //     "rs": data[12], #Rs: Scale radius (kpc/h comoving).,
    //     "vrms": data[13], #Vrms: Velocity dispersion (km/s physical).,

    //     "mmp": data[14], #mmp?: whether the halo is the most massive progenitor or not.,
    //     "scale_of_last_MM": data[15], #scale_of_last_MM: scale factor of the last major merger (Mass ratio > 0.3).,

    //     "vmax": data[16], #Vmax: Maxmimum circular velocity (km/s physical).,

    //     "position": list([float(data[17]), float(data[18]), float(data[19])]), #X/Y/Z: Halo position (Mpc/h comoving).,
    //     "x": float(data[17]), #X/Y/Z: Halo position (Mpc/h comoving).,
    //     "y": float(data[18]),
    //     "z": float(data[19]),

    //     "velocity": list([float(data[20]), float(data[21]), float(data[22])]), #VX/VY/VZ: Halo velocity (km/s physical).,
    //     "vx": float(data[20]), #VX/VY/VZ: Halo velocity (km/s physical).,
    //     "vy": float(data[21]),
    //     "vz": float(data[22]),

    //     "angVel": list([float(data[23]), float(data[24]), float(data[25])]), #JX/JY/JZ: Halo angular momenta ((Msun/h) * (Mpc/h) * km/s (physical)).,
    //     "Jx": float(data[23]), #JX/JY/JZ: Halo angular momenta ((Msun/h) * (Mpc/h) * km/s (physical)).,
    //     "Jy": float(data[24]),
    //     "Jz": float(data[25]),

    //     "Spin": data[26], #Spin: Halo spin parameter.,
    //     "Breadth_first_ID": data[27], #Breadth_first_ID: breadth-first ordering of halos within a tree.,
    //     "Depth_first_ID": data[28], #Depth_first_ID: depth-first ordering of halos within a tree.,
    //     "Tree_root_ID": data[29], #Tree_root_ID: ID of the halo at the last timestep in the tree.,
    //     "Orig_halo_ID": data[30], #Orig_halo_ID: Original halo ID from halo finder.,
    //     "Snap_num": data[31], #Snap_num: Snapshot number from which halo originated.,
    //     "Next_coprogenitor_depthfirst_ID": data[32], #Next_coprogenitor_depthfirst_ID: Depthfirst ID of next coprogenitor.,
    //     "Last_progenitor_depthfirst_ID": data[33], #Last_progenitor_depthfirst_ID: Depthfirst ID of last progenitor.,
    //     "Rs_Klypin": data[34], #Rs_Klypin: Scale radius determined using Vmax and Mvir (see Rockstar paper),

    //     "M_all": data[35], #M_all: Mass enclosed within the specified overdensity, including unbound particles (Msun/h),
    //     "M200b": data[36], #M200b--M2500c: Mass enclosed within specified overdensities (Msun/h),
    //     "M200c": data[37],
    //     "M500c": data[38],
    //     "M2500c": data[39],

    //     "Xoff": data[40], #Xoff: Offset of density peak from average particle position (kpc/h comoving),
    //     "Voff": data[41], #Voff: Offset of density peak from average particle velocity (km/s physical),

    //     "Spin_Bullock": data[42], #Spin_Bullock: Bullock spin parameter (J/(sqrt(2)*GMVR)),

    //     "b_to_a": data[43], #b_to_a, c_to_a: Ratio of second and third largest shape ellipsoid axes (B and C) to largest shape ellipsoid axis (A) (dimensionless).,
    //     "c_to_a": data[44], #  Shapes are determined by the method in Allgood et al. (2006). #  (500c) indicates that only particles within R500c are considered.,

    //     "a": [data[45], data[46], data[47]], #A[x],A[y],A[z]: Largest shape ellipsoid axis (kpc/h,
    //     "b_to_a500c": data[48],
    //     "c_to_a500c": data[49],

    //     "a500c": [data[50], data[51] , data[52]],
    //     "kinToPotRatio": data[53], #T/|U|: ratio of kinetic to potential energies,
    //     "M_pe_Behroozi": data[54],
    //     "M_pe_Diemer": data[55],

    //     "rootHaloID": -1,
    //     "nextDesc_id": -1,

    //     "trackedPos": list(np.empty(0)),
    //     "trackedVel": list(np.empty(0))
    //     }
    // // /*
    // //  *  Color configuration stuff
    // //  */
    // // var colorBox = guiBox.addFolder("Cosmetic");
    // // {
    // //     colorBox.addColor(config, "color0").onChange(function() {
    // //         config.__setColor()
    // //     });
    // //     colorBox.addColor(config, "color1").onChange(function() {
    // //         config.__setColor()
    // //     });
    // //     colorBox.addColor(config, "color2").onChange(function() {
    // //         config.__setColor()
    // //     });
    // //     colorBox.addColor(config, "color3").onChange(function() {
    // //         config.__setColor()
    // //     });
    // //     colorBox.addColor(config, "color4").onChange(function() {
    // //         config.__setColor()
    // //     });
    // }
};