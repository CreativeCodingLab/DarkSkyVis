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
