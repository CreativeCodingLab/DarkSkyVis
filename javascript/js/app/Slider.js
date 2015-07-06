define(function(require) {
    var THREE = require("three"),
        EPOCH = require("Epoch"),
        noUiSlider = require("nouislider");

        // console.log("\t initSlider()");
    var slider = $('.tslider');
    noUiSlider.create( slider, {
        start: [0, 50],
        connect: true,  // shows areas of coverage
        orientation: "vertical",
        direction: "ltr",  //
        behaviour: 'drag-tap',  // allows user to drag center around
        step: 1,  // steps between values
        format: wNumb({   // determines number format
            decimals: 0
        }),
        range: {   // min and max of range
            'min': [0],
            '20%': [18],
            '40%': [36],
            '60%': [53],
            '80%': [71],
            'max': [88]
        },
        pips: {
            mode: 'count',
            values: 5,
            density: 3
        }
    });


    var snapValues = [
        $('#value-lower'),
        $('#value-upper')
    ];

    slider.noUiSlider.on('update', function(values, handle))
        snapValues[handle].innerHTML = values[handle];
    });

    EPOCH.HEAD = parseInt(slider.noUiSlider.get()[0]);
    EPOCH.TAIL = parseInt(slider.noUiSlider.get()[1]);

});
