
function GUIcontrols() {

    this.showPaths = false;
    this.showHalos = true;
    this.showStats = false;
    this.showHaloMap = true;
    this.enableSelection = false;

    this.color0 = rgbToHex(255,0,0);
    this.color1 = rgbToHex(255,255,0);
    this.color2 = rgbToHex(0,0,255);
    this.color3 = rgbToHex(0,255,0);

    this.Path257 = function () { this.__updateData(PATH257) };
    this.SampleTree = function () { this.__updateData(HALOTREE) };
    this.Tree676638 = function () { this.__updateData(TREE676638) };
    //this.Tree676638 = function () { __updateData(TREE679582) };
    this.goToHead = function () { this.__resetView(0) };
    this.goToCenter = function () { this.__resetView(1) };
    this.goToTail = function () { this.__resetView(2) };
}

GUIcontrols.prototype.__resetView = function(toHead) {

    console.log("You hit the reset button!!");
    var halo = null;
    if (toHead === 0) {
        (function () {

            for (var i = EPOCH_HEAD; i <= EPOCH_TAIL; i++) {

                if (halo) break;
                for (var j = 0; j < EPOCH_Periods[i].length; j++) {

                    var id = EPOCH_Periods[i][j];
                    halo = HaloSpheres[id];
                    if (halo) break;
                }
            }
        }());
    } else if (toHead === 1) {
        (function () {

            var i = (EPOCH_HEAD < EPOCH_TAIL) ? (EPOCH_HEAD + parseInt((EPOCH_TAIL - EPOCH_HEAD) / 2)) : 0;
            for (var j = 0; j < EPOCH_Periods[i].length; j++) {

                var id = EPOCH_Periods[i][j];
                halo = HaloSpheres[id];
                if (halo) break;
            }
        })();
    } else if (toHead === 2) {
        (function () {

            for (var i = EPOCH_TAIL; i >= EPOCH_HEAD; i--) {

                if (halo) break;
                for (var j = 0; j < EPOCH_Periods[i].length; j++) {

                    var id = EPOCH_Periods[i][j];
                    halo = HaloSpheres[id];
                    if (halo) break;
                }
            }
        })();
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
};

GUIcontrols.prototype.__updateData = function(dataset) {

    initHaloTree(dataset, false);
    createHaloGeometry(EPOCH_Periods);
    this.__resetView(0);
};



function rgbToHex(R,G,B){
    function toHex(c) {

        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    return "#" + toHex(R) + toHex(G) + toHex(B)
}



function toggleVisibility(HaloObject, isVisible, opacity) {

    for (var i=EPOCH_HEAD; i<EPOCH_TAIL+1; i++) {

        for (var j = 0; j < EPOCH_Periods[i].length; j++) {

            var id = EPOCH_Periods[i][j];
            if(HaloObject[id]){
                HaloObject[id].visible = isVisible;
                if (opacity){
                    console.log("toggleVisibility", i, opacity);
                    HaloObject[id].material.opacity = opacity;
                }
            }

        }
    }
}


function tweenToPosition(durationA, durationB) {

    console.log("we are tweenToPosition!");
    TWEEN.removeAll();

    durationA = (durationA) ? durationA: 1500;
    durationB = (durationB) ? durationB : 500;

    var cameraPosition = camera.position;  // The current Camera position
    var currentLookAt = controls.target;   // The current lookAt position

    var haloDestination = {   // Our destination
        x: curTarget.object.position.x,
        y: curTarget.object.position.y,
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

    //tweenLookAt.chain(tweenPosition);
    tweenLookAt.start();

}

function updateLightPosition() {
    light.position.set(camera.position.x, camera.position.y, camera.position.z);
}