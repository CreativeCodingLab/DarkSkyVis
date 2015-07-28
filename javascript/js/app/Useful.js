"use strict";

// Useful function to help me and my lack of hex understanding
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
// Differs from toggleVisibility because it controls color as well
function displayHalos() {
    if (!DEFERRED) {
        var i;
        if (config.showHalos)
            sphereGroup.children.forEach(function(mesh) {
                i = +mesh.period;
                mesh.visible = !!(i >= EPOCH_HEAD && i <= EPOCH_TAIL);
                if (curTarget && mesh.position !== curTarget.object.position){
                    // mesh.material.color.set(colorKey(i));
                    mesh.material.opacity = 0.4;
                }
            });

        if (config.showPaths)
            linesGroup.children.forEach(function(lineMesh) {
                i = lineMesh.period;
                lineMesh.visible = !!(i >= EPOCH_HEAD && i < EPOCH_TAIL);
            });
    }
}

// Controls the visibility of the object in question
function toggleVisibility(haloObjectGroup, isVisible, opacity) {
    console.log("toggleVisibility?", haloObjectGroup)
    if (isVisible)
        haloObjectGroup.children.forEach(function(objMesh) {
            i = +objMesh.period;
            objMesh.visible = !!(i >= EPOCH_HEAD && i < EPOCH_TAIL);
            if (opacity){
                console.log("toggleVisibility", i, opacity);
                objMesh.material.opacity = opacity;

            }

        });


    for (var i=EPOCH_HEAD; i<EPOCH_TAIL+1; i++) {

        for (var j = 0; j < EPOCH_PERIODS[i].length; j++) {

            var id = EPOCH_PERIODS[i][j];

            if(haloObjectGroup.getObjectByName(id)){

                haloObjectGroup.getObjectByName(id).visible = isVisible;

                if (opacity){
                    console.log("toggleVisibility", i, opacity);
                    haloObjectGroup.getObjectByName(id).material.opacity = opacity;

                }
            }

        }
    }
}




function tweenToPosition(durationA, durationB, zoom) {

    console.log("we are tweenToPosition!",durationA, durationB, zoom);
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
    console.log("we are tweenToPosition! Post");
}


// Displays the loading image
function showSpinner(value) {
    console.log("\tLoading Screen!!", value)
    //document.getElementById(id).style.display = value ? 'block' : 'none';
    var loading = $("#loading")[0];

    if (value)
        spinner.spin(loading);
    else
        spinner.stop();

}
