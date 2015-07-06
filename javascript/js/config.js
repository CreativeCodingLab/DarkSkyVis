var require ={
    baseUrl: 'js/app',
    shim: {
        // --- Use shim to mix together all THREE.js subcomponents
        'threeCore': { exports: 'THREE' },
        'TrackballControls': { deps: ['threeCore'], exports: 'THREE' },
        // --- end THREE sub-components
        'detector': { exports: 'Detector' },
        'stats': { exports: 'Stats' }
    },

    paths: {
        three: '../lib/three',
        threeCore: '../lib/three.min',
        Detector: "../lib/Detector",
        TrackballControls: "../lib/TrackballControls",

        //nifti: "../lib/nifti"
        dat: "../lib/dat.gui.min",
        jquery: "../lib/jquery",
        nouislider: "../lib/jquery.nouislider.all.min",


        d3: "../lib/d3.min",
        stats: "../lib/stats.min",
        tween: "../lib/tween.min",
        colorbrewer: "../lib/colorbrewer",

        oboe: "../lib/obe-browser"

    }
};
