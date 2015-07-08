
function rgbToHex(R,G,B){
    function toHex(c) {

        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    return "#" + toHex(R) + toHex(G) + toHex(B)
}


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

    this.dataset = "676638";
    this.goToHead = function () { this.__resetView(0) };
    this.goToCenter = function () { this.__resetView(1) };
    this.goToTail = function () { this.__resetView(2) };
    this.animateTime = function () {};
}

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



GUIcontrols.prototype.__resetView = function(toHead) {

    console.log("You hit the reset button!!");
    var halo = null;
    if (toHead === 0) {
        (function () {

            for (var i = EPOCH_HEAD; i <= EPOCH_TAIL; i++) {

                if (halo) break;
                for (var j = 0; j < EPOCH_PERIODS[i].length; j++) {

                    var id = EPOCH_PERIODS[i][j];
                    halo = HaloSpheres[id];
                    if (halo) break;
                }
            }
        }());
    } else if (toHead === 1) {
        (function () {

            var i = (EPOCH_HEAD < EPOCH_TAIL) ? (EPOCH_HEAD + parseInt((EPOCH_TAIL - EPOCH_HEAD) / 2)) : 0;
            for (var j = 0; j < EPOCH_PERIODS[i].length; j++) {

                var id = EPOCH_PERIODS[i][j];
                halo = HaloSpheres[id];
                if (halo) break;
            }
        })();
    } else if (toHead === 2) {
        (function () {

            for (var i = EPOCH_TAIL; i >= EPOCH_HEAD; i--) {

                if (halo) break;
                for (var j = 0; j < EPOCH_PERIODS[i].length; j++) {

                    var id = EPOCH_PERIODS[i][j];
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
    displayHalos();
    tweenToPosition(1500, 500, true);
};


GUIcontrols.prototype.__updateData = function() {
    var that = this;
    DEFERRED = true;
    var URL = "js/assets/tree_" + this.dataset.split(' ')[0] + ".json";
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


// kind of a misleading function name
function displayHalos() {
    if (!DEFERRED) {
        for (var i = 0; i < EPOCH_PERIODS.length; i++) {

            for (var j = 0; j < EPOCH_PERIODS[i].length; j++) {

                var id = EPOCH_PERIODS[i][j];
                //console.log(i, id)
                // Set Halo Line Visibility
                if (HaloLines[id]){
                    // console.log("\tdisplaying Halo line?", i, id, config.showPaths, EPOCH_HEAD, EPOCH_TAIL)
                    HaloLines[id].visible = (i >= EPOCH_HEAD && i < EPOCH_TAIL)? config.showPaths : false;
                }
                // Set Halo Spheres Visibility
                HaloSpheres[id].visible = (i >= EPOCH_HEAD && i <= EPOCH_TAIL)? config.showHalos : false;
                if (curTarget && HaloSpheres[id].position !== curTarget.object.position){
                    HaloSpheres[id].material.color.set(colorKey(i));
                    HaloSpheres[id].material.opacity = 0.4;
                }
            }
        }
    }
}


function displayHaloStats() {

    console.log(haloStats);
    var haloData = HaloLUT[curTarget.object.halo_id];

    var result = "<b> time:</b> " + haloData['time'] + "</br>" +
        "<b>        id:</b> " + haloData['id'] + "</br>" +
        "<b>   desc_id:</b> " + haloData['desc_id'] + "</br>" +
        "<b>  num_prog:</b> " + haloData['num_prog'] + "</br>" +
        "<b>       pid:</b> " + haloData['pid'] + "</br>" +
        "<b>      upid:</b> " +  haloData['upid'] + "</br>" +
        "<b>  desc_pid:</b> " +  haloData['desc_pid'] + "</br>" +
        "<b>     scale:</b> " +  haloData['scale'] + "</br>" +
        "<b>desc_scale:</b> " +  haloData['desc_scale'] + "</br>" +
        "<b>   phantom:</b> " +  haloData['phantom'] + "</br>" +
        "<b>  position:</b> " +  haloData['position'] + "</br>" +
        "<b>  velocity:</b> " +  haloData['velocity'] + "</br>" +
        "<b>        rs:</b> " +  haloData['rs'] + "</br>" +
        "<b>      mvir:</b> " +  haloData['mvir'] + "</br>" +
        "<b>      rvir:</b> " +  haloData['rvir'] + "</br>" +
        "<b>      vrms:</b> " +  haloData['vrms'] + "</br>" +
        "<b>      vmax:</b> " +  haloData['vmax'] + "</br>" +
        "<b>  sam_mvir:</b> " +  haloData['sam_mvir'] + "</br>" +
        "<b>      Spin:</b> " +  haloData['Spin'] + "</br>"

    haloStats.html(result);
}


function toggleVisibility(HaloObject, isVisible, opacity) {

    for (var i=EPOCH_HEAD; i<EPOCH_TAIL+1; i++) {

        for (var j = 0; j < EPOCH_PERIODS[i].length; j++) {

            var id = EPOCH_PERIODS[i][j];
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


function tweenToPosition(durationA, durationB, zoom) {

    console.log("we are tweenToPosition!");
    TWEEN.removeAll();


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
        z: haloDestination.z - (haloDestination.z * .3)  // put us a little bit away from the point
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

    if (zoom)
        tweenLookAt.chain(tweenPosition);
    tweenLookAt.start();

}

function updateLightPosition() {
    light.position.set(camera.position.x, camera.position.y, camera.position.z);
}



function resetHaloBranchs() {

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

// given a clicked Halo id, traverse the tree with the given halo.

//
function intoTheAbyss(id, period, points) {

    var halo = HaloLUT[id];  // use the ID to pull the halo
    points.push(halo.position);
    HaloSelect[id] = true;
    HaloSpheres[id].visible = (period >= EPOCH_HEAD && period < EPOCH_TAIL)? config.showHalos : false;
    //points.push([halo.x,halo.y,halo.z,halo.id,halo.desc_id]); // for debugging purposes

    //if (halo.desc_id in HaloLUT && halo.time < EPOCH_TAIL) {

    if (halo.desc_id in HaloLUT && period < EPOCH_TAIL) {

        var next = HaloLUT[halo.desc_id];

        if (halo.desc_id in __traversed) {

            points.push(next.position);
            return points;
        } else {
            __traversed[halo.id] = true;
            return intoTheAbyss(next.id, next.time, points);
        }
    } else {
        //console.log("\t\thalo->id:",halo.id, "!= halo.desc_id:", halo.desc_id);
        return points;
    }

}

function traceBackPath(id, period, points) {

}


function createSpline(points, id, period) {

    // if points is defined at all...
    if (points && points.length > 1) {

        //console.log("creating PathLine!", period);
        var index, xyz;
        var colors = [];
        var spline = new THREE.Spline();
        var numPoints = points.length*nDivisions;

        var splineGeometry = new THREE.Geometry();

        spline.initFromArray(points);
        for (var i=0; i <= numPoints; i++) {

            index = i/numPoints;
            xyz = spline.getPoint(index);
            splineGeometry.vertices[i] = new THREE.Vector3( xyz.x, xyz.y, xyz.z );
            colors[ i ] = new THREE.Color(colorKey(index*points.length + period)); // this should give us an accurate color..I think

        }
        splineGeometry.colors = colors;
        splineGeometry.computeBoundingSphere();

        var material = new THREE.LineBasicMaterial({
            color: rgbToHex(255, 255, 255),
            linewidth: 2,
            vertexColors: THREE.VertexColors,
            transparent: true,
            opacity: 0.5
        });

        var mesh = new THREE.Line(splineGeometry, material);
        mesh.halo_id = id;
        mesh.halo_period = period;
        HaloBranch[id] = mesh;
        linesGroup.add(mesh);
    }

}


function get(url) {
    return new Promise( function(resolve, reject) {
        var req = new XMLHttpRequest();
        req.open('GET', url);
        req.onload = function() {
            if (req.status === 200) {
                resolve(req.response);

            } else {
                reject(Error(req.statusText));
            }
        };

        req.onerror = function() {
            reject(Error("Network Error"));
        };

        req.send();
    })
}

function getHaloTreeData(url) {
    showSpinner(true);
    return get(url).then(JSON.parse);
}




//function onReady(callback) {
//    var intervalID = window.setInterval(checkReady, 1000);
//
//    function checkReady() {
//        if (document.getElementsByTagName('body')[0] !== undefined) {
//            window.clearInterval(intervalID);
//            callback.call(this);
//        }
//    }
//}
//
//onReady(function () {
//    show('page', true);
//    show('#loading', false);
//});

function showSpinner(value, message) {
    message = message || 0;
    console.log("Loading!!", value)
    //document.getElementById(id).style.display = value ? 'block' : 'none';
    var loading = $("#loading")[0];
    loading.style.display = value ? 'block' : 'none';
    if (message > 30)
        loading.style.backgroundImage = 'url("http://i.stack.imgur.com/MnyxU.gif")';
}