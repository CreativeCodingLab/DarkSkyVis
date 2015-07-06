define(function(require) {
    var THREE = require("three"),
        utils = require("Utils");

    var renderer = new THREE.WebGLRenderer( { antialias: true } );
    {
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.setClearColor(utils.rgbToHex(55,55,55), 1);
        renderer.gammaInput = true;
        renderer.gammaOutput = true;
    }

    return renderer;
})