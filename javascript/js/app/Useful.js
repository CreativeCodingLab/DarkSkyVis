
function rgbToHex(R,G,B){
    function toHex(c) {

        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    return "#" + toHex(R) + toHex(G) + toHex(B)
}


// wrapper function to update the light position
function updateLightPosition() {
    light.position.set(camera.position.x, camera.position.y, camera.position.z);
}



// Used to display Halos and lines during initialization
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
                    console.log("displayHalos adjust colors", colorKey(i));
                    HaloSpheres[id].material.color.set(colorKey(i));
                    HaloSpheres[id].material.opacity = 0.4;
                }
            }
        }
    }
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


// Display currently selected Halo's Attribute information
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


// Wrapper for pulling the Json
function getHaloTreeData(url) {
    showSpinner(true);
    return get(url).then(JSON.parse);
}

// Uses promises to get the halo data.
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

function showSpinner(value) {
    console.log("Loading!!", value)
    //document.getElementById(id).style.display = value ? 'block' : 'none';
    var loading = $("#loading")[0];
    loading.style.display = value ? 'block' : 'none';
}