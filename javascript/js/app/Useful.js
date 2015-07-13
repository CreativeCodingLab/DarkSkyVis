
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
        sphereGroup.children.forEach(function(mesh) {
            i = mesh.halo_period;
            mesh.visible = (i >= EPOCH_HEAD && i <= EPOCH_TAIL)? config.showHalos : false;
            if (curTarget && mesh.position !== curTarget.object.position){
                mesh.material.color.set(colorKey(i));
                mesh.material.opacity = 0.4;
            }

        });

        linesGroup.children.forEach(function(lineMesh) {
            lineMesh.visible = (i >= EPOCH_HEAD && i < EPOCH_TAIL)? config.showPaths : false;
        });


        //for(id in HaloLUT) {
        //
        //    if (id !== "length" || id !== "min" || id !== "max"){
        //
        //        var i = HaloLUT[id].time;
        //        // console.log("HaloLUT foreach", i, id)
        //        if (HaloLines[id])
        //            // console.log("\tdisplaying Halo line?", i, id, config.showPaths, EPOCH_HEAD, EPOCH_TAIL)
        //            HaloLines[id].visible = (i >= EPOCH_HEAD && i < EPOCH_TAIL)? config.showPaths : false;
        //
        //        if (sphereGroup.getObjectByName(id)){
        //            // Set Halo Spheres Visibility
        //            sphereGroup.getObjectByName(id).visible = (i >= EPOCH_HEAD && i <= EPOCH_TAIL)? config.showHalos : false;
        //
        //            if (curTarget && sphereGroup.getObjectByName(id).position !== curTarget.object.position){
        //                console.log("displayHalos adjust colors", colorKey(i));
        //                sphereGroup.getObjectByName(id).material.color.set(colorKey(i));
        //                sphereGroup.getObjectByName(id).material.opacity = 0.4;
        //            }
        //        }
        //
        //    }
        //}


        // for (var i = 0; i < EPOCH_PERIODS.length; i++) {

        //     for (var j = 0; j < EPOCH_PERIODS[i].length; j++) {

        //         var id = EPOCH_PERIODS[i][j];
        //         // Set Halo Line Visibility
        //         if (HaloLines[id])
        //             // console.log("\tdisplaying Halo line?", i, id, config.showPaths, EPOCH_HEAD, EPOCH_TAIL)
        //             HaloLines[id].visible = (i >= EPOCH_HEAD && i < EPOCH_TAIL)? config.showPaths : false;

        //         if (sphereGroup.getObjectByName(id))
        //             // Set Halo Spheres Visibility
        //             sphereGroup.getObjectByName(id).visible = (i >= EPOCH_HEAD && i <= EPOCH_TAIL)? config.showHalos : false;

        //         if (curTarget && sphereGroup.getObjectByName(id).position !== curTarget.object.position){
        //             console.log("displayHalos adjust colors", colorKey(i));
        //             sphereGroup.getObjectByName(id).material.color.set(colorKey(i));
        //             sphereGroup.getObjectByName(id).material.opacity = 0.4;
        //         }
        //     }
        // }
    }
}

// Controls the visibility of the object in question
function toggleVisibility(HaloObject, isVisible, opacity) {

    for (var i=EPOCH_HEAD; i<EPOCH_TAIL+1; i++) {

        for (var j = 0; j < EPOCH_PERIODS[i].length; j++) {

            var id = EPOCH_PERIODS[i][j];

            if(HaloObject.getObjectByName(id)){

                HaloObject.getObjectByName(id).visible = isVisible;

                if (opacity){
                    console.log("toggleVisibility", i, opacity);
                    HaloObject.getObjectByName(id).material.opacity = opacity;

                }
            }

        }
    }
}


// Display currently selected Halo's Attribute information
function displayHaloStats() {

    var haloData = HaloLUT[curTarget.object.halo_id];
    console.log(haloStats, haloData,curTarget);

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

    console.log("we are tweenToPosition! Pre");
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
