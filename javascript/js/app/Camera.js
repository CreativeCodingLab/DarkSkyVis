define(function(require) {
    var THREE = require("three"),
        EPOCH = require("Epoch"),
        controls = require("Controls"),
        noUiSlider = require("nouislider");

    var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
    {
        // **** position the camera near the first halo; ***
        var pos = sphereGroup.children[3].position;
        camera.position.set(pos.x, pos.y+0.1, pos.z-(pos.z*0.5));
        controls = new THREE.TrackballControls( camera, renderer.domElement );
        {
            controls.rotateSpeed = 4.0;
            controls.zoomSpeed = 1.5;
            controls.panSpeed = 1.0;

            controls.noZoom = false;
            controls.noPan = false;

            controls.staticMoving = false;
            controls.dynamicDampingFactor = 0.3;

            controls.keys = [ 65, 83, 68 ];
            controls.enabled = true;
        }
        camera.lookAt(pos);
        controls.target.set(pos.x, pos.y, pos.z);
        controls.update();
    }

    sideCam = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
    sideCam.position.set(pos.x, pos.y+0.1, pos.z-(pos.z*0.5));
    sideCam.lookAt(pos);
});



function initCamera() {


}
