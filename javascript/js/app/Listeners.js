/**
 * Created by krbalmryde on 7/7/15.
 */


// ==========================================
//        onReshape, onMouseMove
// And associated Event Listeners
// ==========================================
function onReshape() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}


function onMouseMove( event ) {

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}


function onMouseClick() {

    console.log("Single Click!!");
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera( mouse, camera );
    // calculate objects intersecting the picking ray
    var hit, hits = raycaster.intersectObjects( sphereGroup.children );

    for (var i = 0; i < hits.length; i++) {

        //hit = raycaster.intersectObjects( sphereGroup.children )[i];
        hit = hits[i];
        console.log(i, "hit?", hit);
        if (hit.object.visible) break;

    }

    if (hit && (hit.object.material.opacity !== 0.0 && hit.object.visible)) {

        console.log("we got something!", hit);
        if (!prevTarget)
            prevTarget = curTarget = hit;
        else {
            prevTarget = curTarget;
            curTarget = hit;
        }

        prevTarget.object.material.opacity = 0.4;
        curTarget.object.material.opacity = 0.8;

        displayHaloStats();
    }
}


function onMouseDoubleClick() {

    console.log("Double Click!!", curTarget.object.halo_id);
    // update the picking ray with the camera and mouse position

    if(config.enableSelection) {

        toggleVisibility(HaloLines, false);
        toggleVisibility(HaloSpheres, false);

        var id = curTarget.object.halo_id;
        var period = curTarget.object.halo_period;
        // just need to use the halo-id's to turn the spheres on, no sense in rebuilding existing data.
        var points = intoTheAbyss(id, period, []);
        createSpline(points, id, period);

    } else
        tweenToPosition(1500, 500, false);

}


function onKeyPress( event ) {

    console.log("Key is",event.keyCode);
    switch (event.keyCode) {

        case 49:
            camera.position.set(camera.position.x, camera.position.y, camera.position.z-0.3);
            controls.update();
            updateLightPosition();
            console.log(camera, light)
            break;
        case 50:
            camera.position.set(camera.position.x, camera.position.y, camera.position.z+0.3);
            controls.update();
            updateLightPosition();
            console.log(camera, light);
            break;
    }

}
