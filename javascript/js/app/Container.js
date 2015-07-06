define(function(require) {
    var THREE = require("three"),
        renderer = require("Renderer");

    var container = document.getElementById( 'Sandbox' );
    container.appendChild( renderer.domElement );

    return container;

});