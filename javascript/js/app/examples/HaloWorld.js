/*
 Copyright Damien George, thecmb.org, 2013.
 This work is licensed under the Creative Commons Attribution-NonCommercial 3.0 Unported License.
 To view a copy of this license, visit http://creativecommons.org/licenses/by-nc/3.0/.

 Modifed for LWA1 URO.

 Modified for Dark Sky Simulations, Samuel Skillman, 2014.
 */

var current_halo = 0;
var MAIN = (function ($) {
    "use strict";

    var camera, scene, effect, renderer, stats = null;
    var composer;
    var effect2;
    var element, controls;
    var enableVR = false;
    var lfsMaterials, materials, sqfaceTexture = null;
    var galacticPlane, equatorialPlane, sourceLabels;
    var halos;
    var center = [0., 0., 0.];

    var material;
    var jsonData
    var particle_chunks = []
    var particleSystem;
    var sphere;
    var total_particles = 0;

    var initLng = 4.0, initLat = 0.0, initZ = 100;
    var sceneDirty = true, wantedLat = initLat, wantedLng = initLng, wantedZ = initZ;

    var mouseX = 0, mouseY = 0;
    var mouseHeld = false;
    var clock = new THREE.Clock();
    var uniforms;
    var moving = false;

    var testParams;
    var testPass;

    function pad(n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }

    var doingAnimationLoop = false;
    function updateScene(forceUpdate) {
        if (!doingAnimationLoop) {
            if (forceUpdate) {
                sceneDirty = true;
            }
            if (moving){
                sceneDirty = true;
            }
            if (sphere == undefined)
                sceneDirty = true;
            if (!sceneDirty && (Math.abs(wantedLat - sphere.rotation.x) > 2e-3
                || Math.abs(wantedLng - sphere.rotation.y) > 2e-3 ||
                Math.abs(wantedZ - camera.position.z) > 1e-1))
            { sceneDirty = true;
            }
            if (sceneDirty) {
                doingAnimationLoop = true;
                requestAnimationFrame(animate);
            }
        }
    }

    function animate() {
        doingAnimationLoop = false;
        sceneDirty = false;
        render();
        if (stats !== null) {
            stats.update();
        }
        updateScene();
    }

    function render() {
        if (sphere != undefined){
            sphere.rotation.y += (wantedLng - sphere.rotation.y) * 0.04;
            sphere.rotation.x += (wantedLat - sphere.rotation.x) * 0.04;
        }
        for (var i=0; i<particle_chunks.length; i++){
            var c = particle_chunks[i];
            c.rotation.x = sphere.rotation.x;
            c.rotation.y = sphere.rotation.y;
        }
        if (halos != undefined){
            halos.rotation.y = sphere.rotation.y;
            halos.rotation.x = sphere.rotation.x;
        }
        camera.position.z += (wantedZ - camera.position.z) * 0.04;
        //camera.position.z += (wantedZ - camera.position.z) * 0.06;

        if (moving){
            var delta = 5 * clock.getDelta();
            uniforms.time.value += 0.2 * delta;
        } else {
            var delta = 5 * clock.getDelta();
            uniforms.time.value = 0.0;
        }

        if (controls != undefined){
            controls.update();
        }
        if (enableVR){
            effect.render(scene, camera);
        } else {
            composer.render();
        }

    }
    function doScroll(dx, dy) {
        var zoomFac = 2.0e-3;//2e-5 * camera.position.z;
        wantedLng += dx * zoomFac;
        wantedLat += dy * zoomFac;
        if (wantedLat < -0.6 * Math.PI) {
            wantedLat = -0.6 * Math.PI;
        } else if (wantedLat > 0.6 * Math.PI) {
            wantedLat = 0.6 * Math.PI;
        }
        updateScene();
    }

    function doZoom(amount) {
        wantedZ -= amount * wantedZ / 200.0;
        if (wantedZ < 1) {
            wantedZ = 1;
        }
        if (wantedZ > 10000) {
            wantedZ = 10000;
        }
        updateScene();
    }


    function windowResize(event) {
        $("#heading").css('left', window.innerWidth / 2 - $("#heading").width() / 2);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight - 40);
        effect.setSize(window.innerWidth, window.innerHeight-40);
        updateScene(true);
    }

    function mouseLeave(event) {
        mouseHeld = false;
    }

    function mouseDown(event) {
        mouseHeld = true;
    }

    function mouseUp(event) {
        mouseHeld = false;
    }

    function mouseMove(event) {
        var newMouseX = event.clientX;
        var newMouseY = event.clientY;
        if (mouseHeld) {
            doScroll(newMouseX - mouseX, newMouseY - mouseY);
        }
        mouseX = newMouseX;
        mouseY = newMouseY;
    }

    function mouseWheel(event, delta) {
        doZoom(10 * delta);
    }

    function mouseDoubleClick(event) {
        doZoom(50);
    }

    var touchPrevNumTouches = 0;
    var touchPrevDoubleDistance = null;

    function touchStart(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            var t0 = event.touches[0];
            mouseX = t0.pageX;
            mouseY = t0.pageY;
        }
    }

    function touchEnd(event) {
        //event.preventDefault();
        if (event.touches.length !== 0) {
            // only process a touchEnd request when all touches have finished
            return;
        }
        touchPrevDoubleDistance = null;
    }

    function touchMove(event) {
        event.preventDefault();

        // turn the touch into a centre pos and an optional distance
        var t0, t1;
        var newMouseX, newMouseY;
        var centre;
        var dist;
        if (event.touches.length === 1) {
            t0 = event.touches[0];
            newMouseX = t0.pageX;
            newMouseY = t0.pageY;
            dist = null;
        } else if (event.touches.length === 2) {
            t0 = event.touches[0];
            t1 = event.touches[1];
            newMouseX = (t0.pageX + t1.pageX) / 2;
            newMouseY = (t0.pageY + t1.pageY) / 2;
            dist = Math.sqrt(Math.pow(t0.pageX - t1.pageX, 2) + Math.pow(t0.pageY - t1.pageY, 2));
        } else {
            newMouseX = mouseX;
            newMouseY = mouseY;
            dist = null;
        }

        if (event.touches.length !== touchPrevNumTouches) {
            // if the user change the number of fingers in the touch, we reset the motion variables
            touchPrevNumTouches = event.touches.length;
            touchPrevDoubleDistance = null;
        } else {
            doScroll(newMouseX - mouseX, newMouseY - mouseY);
            if (dist !== null && touchPrevDoubleDistance !== null) {
                var distDiff = dist - touchPrevDoubleDistance;
                doZoom(distDiff);
            }
        }
        mouseX = newMouseX;
        mouseY = newMouseY;
        touchPrevDoubleDistance = dist;
    }

    function keypressArrow(key) {
        if (key === 'left') {
            doScroll(-35, 0);
        } else if (key === 'right') {
            doScroll(35, 0);
        } else if (key === 'up') {
            doScroll(0, -35);
        } else if (key === 'down') {
            doScroll(0, 35);
        }
    }

    function keypressZoom(key) {
        if (key === '=') {
            doZoom(25);
        } else if (key === '+') {
            doZoom(25);
        } else if (key === '-') {
            doZoom(-25);
        }
    }

    function keypressLetter(key) {
        if (key === 'r') {
            wantedLat = initLat;
            wantedLng = initLng;
            wantedZ = initZ;
            updateScene();
        } else if (key == 'm') {
            toggleMove();
        }

    }

    /*    function keypressDebug(key) {*/
    //var i;
    //if (key == 'd w') {
    //for (i = 0; i < lfsMaterials.length; i++) {
    //lfsMaterials[i].wireframe = !lfsMaterials[i].wireframe;
    //}
    //} else if (key == 'd f') {
    //if (sqfaceTexture === null) {
    //sqfaceTexture = THREE.ImageUtils.loadTexture('img/sqface.png');
    //sqfaceTexture.magFilter = THREE.NearestFilter;
    //}
    //for (i = 0; i < lfsMaterials.length; i++) {
    //lfsMaterials[i].map = sqfaceTexture;
    //}
    //}
    //updateScene(true);
    //}

    function toggleVR() {
        enableVR = $("#toggleVR .VR").toggleClass('active').hasClass('active');
        windowResize();
        updateScene(true);
    }

    /*    function toggleHalos() {*/
    //halos.visible = $("#toggleHalos .Halos").toggleClass('active').hasClass('active');
    //updateScene(true);
    //}

    function toggleMove() {
        moving = !moving;//$("#toggleMove .Move").toggleClass('active').hasClass('active');
        updateScene(true);
    }

    var global = {};

    global.main = function () {
        $("#heading").css('left', window.innerWidth / 2 - $("#heading").width() / 2);

        $("#aboutlink").toggle(
            function () {
                // show more text
                $(this).html("Close information");
                $("#about").show();
            },
            function () {
                // hide more text
                $(this).html("Information");
                $("#about").hide();
            }
        );

        if (!Detector.webgl) {
            Detector.addGetWebGLMessage();
            $('body').append('Sorry, WebGL not enabled on your device.');
            return;
        }

        var container = document.createElement('div');
        document.body.appendChild(container);

        camera = new THREE.PerspectiveCamera(75, window.innerWidth
            / window.innerHeight, 1, 20000);
        camera.position.set(0, 0, 2000);

        scene = new THREE.Scene();
        sphere = new THREE.Mesh(new THREE.SphereGeometry(1550, 3, 3));
        sphere.overdraw = true;

        var opacity = 1.0;

        var h = 0.688062;
        var attributes = {
            customColor: { type: 'c', value: null },
            customVelocity: { type: 'f', value: null },
        };

        uniforms = {
            time: { type: "f", value: 0.0 },
            alpha: { type: "f", value: 0.1 },
            psize: { type: "f", value: 1.0 },
            color:     { type: "c", value: new THREE.Color( 0xffffff ) },
            texture:   { type: "t", value: THREE.ImageUtils.loadTexture( "halo_world/img/spot.png" ) }
        };

        var shaderMaterial = new THREE.ShaderMaterial( {
            uniforms:       uniforms,
            attributes:     attributes,
            vertexShader:   document.getElementById( 'vertexshader' ).textContent,
            fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
            blending:       THREE.AdditiveBlending,
            emissive:       0x000000,
            side: THREE.DoubleSide,
            depthTest:      false,
            transparent:    true,
        });


        // postprocessing

        //composer = new THREE.EffectComposer( renderer );
        //composer.addPass( new THREE.RenderPass( scene, camera ) );

        //var effect = new THREE.ShaderPass( THREE.RGBShiftShader );
        //effect.uniforms[ 'amount' ].value = 0.0015;
        //effect.renderToScreen = true;
        //composer.addPass( effect );

        function add_chunk(slice, purl, nsha, offset){
            var address = purl;
            //var nsha = 65536;
            //var offset = 2528;
            var xoff = 0.0;
            var off = center;

            var xhr = new XMLHttpRequest;
            xhr.onreadystatechange = function(){
                if (xhr.readyState != 4) {
                    return;
                }
            };

            xhr.open('GET', address, true);
            xhr.responseType = "arraybuffer";
            //console.log(slice[0], slice[1]);

            var particles = slice[1] - slice[0];
            var stride = 32;
            var start = offset + 24 * nsha;
            start += (slice[0]) * stride;
            var end = start + particles * stride-1;

            //console.log("Downloading " + (end-start), start, end);

            xhr.setRequestHeader('Range', 'bytes='+start+'-'+end); // the bytes (incl.) you request
            xhr.send(null);
            var geometry = new THREE.BufferGeometry();

            var positions = new Float32Array( particles * 3 );
            var colors = new Float32Array( particles * 3 );
            var velocities = new Float32Array( particles * 3 );
            var color = new THREE.Color();
            color.setRGB(Math.random(), Math.random(), Math.random());
            var tcolor = color.r*color.r + color.g*color.g + color.b*color.b;
            tcolor = Math.sqrt(tcolor);
            color.r /= tcolor;
            color.g /= tcolor;
            color.b /= tcolor;


            xhr.onload = function(xhrEvent) {
                if (xhr.response == undefined) {
                    console.log(xhr);
                    return;
                }

                var vmax = 100.0;
                var last_vmag = 0.0;
                for ( var i = 0; i < positions.length; i += 3 ) {

                    var x = new Float32Array(xhr.response, (i/3)*stride, 3);
                    var v = new Float32Array(xhr.response, (i/3)*stride + 3*4, 3);
                    // positions
                    for (var ax=0; ax<3; ax++){
                        x[ax] = (x[ax]-off[ax])*h/100.0;
                    }

                    positions[ i ]     = x[0];
                    positions[ i + 1 ] = x[1];
                    positions[ i + 2 ] = x[2];

                    // velocities
                    velocities[ i ]     = (v[0])/1000.0;
                    velocities[ i + 1 ] = (v[1])/1000.0;
                    velocities[ i + 2 ] = (v[2])/1000.0;
                    if (i == 0)
                        console.log(positions[i], positions[i+1], positions[i+2], v)

                    // colors
                    var vmag = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
                    var rmag = Math.sqrt(x[0]*x[0] + x[1]*x[1] + x[2]*x[2]);
                    var vr = 0.0;
                    for (var ax=0; ax<3; ax++){
                        vr += v[ax]*x[ax];
                    }
                    //vmag = v[2]/1000;
                    //vmag = Math.max(vmag, -vmax);
                    //vmag = Math.min(vmag, vmax);
                    //vmag /= vmax;
                    vr /= (rmag*vmag);
                    color.setRGB(0.5 + 0.5*vr , 0.5, 0.5 - 0.5*vr );
                    //color.setRGB(0.5 + v[0]/2000.0, 0.5 + v[1]/2000.0, 0.5 + v[2]/2000.0);

                    colors[ i ]     = color.r;
                    colors[ i + 1 ] = color.g;
                    colors[ i + 2 ] = color.b;
                    last_vmag = vmag;
                }

                console.log(last_vmag);
                geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
                geometry.addAttribute( 'customVelocity', new THREE.BufferAttribute( velocities, 3 ) );
                geometry.addAttribute( 'customColor', new THREE.BufferAttribute( colors, 3 ) );
                geometry.computeBoundingSphere();

                var parts = new THREE.PointCloud( geometry, shaderMaterial);
                scene.add( parts );
                particle_chunks.push(parts);
                total_particles += particles;
                updateScene();
                console.log('Total: ' + total_particles);
            };
        }

        function add_particles(halonum){
            if (halonum == undefined)
                halonum = 0;
            var url = "http://darksky.slac.stanford.edu/skillman/halo_world/halos/halo_"+pad(halonum, 10)+"_chunks.json";
            //var url = "http://darksky.slac.stanford.edu/skillman/halo_world/big_chunk.dat";
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function() {
                xmlhttp.onreadystatechange = function(){
                    if (xmlhttp.readyState != 4) {
                        console.log(xmlhttp.status);
                        return;
                    }
                };
            }

            xmlhttp.open("GET", url, true);
            xmlhttp.send();
            xmlhttp.onload = function(xhrEvent) {
                var myArr = JSON.parse(xmlhttp.responseText);
                center = myArr.center;
                var id = myArr.id;
                var nsha = 65536;
                var offset = 2528;
                var purl;
                if (id == 77777){
                    purl = "http://darksky.slac.stanford.edu/skillman/ds14_b/ds14_b_174726_cell_0.8000";
                    nsha = 0;
                    offset = 2682;
                } else {
                    purl = "http://darksky.slac.stanford.edu/simulations/ds14_a/ds14_a_1.0000";
                }
                console.log(center);
                for (var i=0; i<myArr.chunks.length; i++){
                    add_chunk(myArr.chunks[i], purl, nsha, offset);
                }
            }
        }

        function remove_particles(){
            var obj, i;
            for ( i = scene.children.length - 1; i >= 0 ; i -- ) {
                obj = scene.children[ i ];
                if ( obj !== camera) {
                    scene.remove(obj);
                }
            }
        }

        add_particles(0);
        global.add_particles = add_particles;
        global.remove_particles = remove_particles;
        //var light = new THREE.PointLight( 0xffffff, 1., 5000.0 );
        //light.position.set( 0, 0, 0 );
        //scene.add( light );

        //var light = new THREE.PointLight( 0xff7777, 1, 0.0 );
        //light.position.set( 20000, 0, 0 );
        //scene.add( light );

        //// Lights
        scene.add( new THREE.AmbientLight( 0xffffff, 1.0) );

        // labels
        sourceLabels = [];

        //renderer = new THREE.CanvasRenderer();
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight - 4);
        renderer.sortObjects = false;
        container.appendChild(renderer.domElement);

        effect = new THREE.StereoEffect(renderer);
        effect.setSize(window.innerWidth, window.innerHeight-4);
        element = renderer.domElement;

        // postprocessing

        var renderPass = new THREE.RenderPass( scene, camera );

        composer = new THREE.EffectComposer( renderer );
        composer.addPass( renderPass );

        //var hblur = new THREE.ShaderPass( THREE.HorizontalBlurShader );
        //composer.addPass( hblur );

        //var vblur = new THREE.ShaderPass( THREE.VerticalBlurShader );
        //// set this shader pass to render to screen so we can see the effects
        //// vblur.renderToScreen = true;
        //composer.addPass( vblur );

        testPass = new THREE.ShaderPass( THREE.TestShader );
        //Add Shader Passes to Composer - order is important
        composer.addPass( testPass );
        testPass.renderToScreen = true;
        //set last pass in composer chain to renderToScreen

        function onParamsChange() {
            //copy gui params into shader uniforms
            //testPass.uniforms[ "amount" ].value = testParams.alpha;
            uniforms[ "psize" ].value = testParams.point_size;
            uniforms[ "alpha" ].value = testParams.alpha;
        }

        //Init DAT GUI control panel
        testParams = { alpha: 0.3,
            point_size: 0.2,
        };

        //var copyPass = new THREE.ShaderPass( THREE.CopyShader );
        //copyPass.renderToScreen = true;
        //composer.addPass( copyPass);

        var gui = new dat.GUI({ autoPlace: false });
        var customContainer = document.getElementById('dat-gui');
        customContainer.appendChild(gui.domElement);

        gui.add(testParams, 'alpha', 0, 1.0).step(0.01).onChange(onParamsChange);
        gui.add(testParams, 'point_size', 0, 1.0).step(0.01).onChange(onParamsChange);
        onParamsChange();

        /*
         stats = new Stats();
         stats.domElement.style.position = 'absolute';
         stats.domElement.style.top = '0px';
         container.appendChild(stats.domElement);
         */

        // work out if we are running on a portable device
        var agent = navigator.userAgent.toLowerCase();
        var iDevice = agent.indexOf("iphone") >= 0 || agent.indexOf("ipad") >= 0 || agent.indexOf("android") >= 0;

        window.addEventListener('resize', windowResize, false);

        function fullscreen() {
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen();
            } else if (container.mozRequestFullScreen) {
                container.mozRequestFullScreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            }
        }

        //controls = undefined;
        var hasOrientation = function(evt) {
            if (!evt.alpha) {
                return;
            }
            window.removeEventListener('deviceorientation', hasOrientation, false);
            controls = new THREE.DeviceOrientationControls( camera );
            controls.connect();
            controls.update();
        };
        window.addEventListener('deviceorientation', hasOrientation, false);

        if (iDevice) {
            container.addEventListener('touchstart', touchStart, false);
            container.addEventListener('touchend', touchEnd, false);
            container.addEventListener('touchmove', touchMove, false);
        } else {
            $(container).mouseleave(mouseLeave);
            $(container).mousedown(mouseDown);
            $(container).mouseup(mouseUp);
            $(container).mousemove(mouseMove);
            $(container).mousewheel(mouseWheel);
            $(container).dblclick(mouseDoubleClick);

            Mousetrap.bind(['left', 'right', 'up', 'down'], function(e, key) { keypressArrow(key); });
            Mousetrap.bind(['=', '+', '-'], function(e, key) { keypressZoom(key); });
            Mousetrap.bind(['r', 'g', 'e', 'x', 'm'], function(e, key) { keypressLetter(key); });
            Mousetrap.bind(['d w', 'd f', 'd s 0', 'd s 1', 'd s 2', 'd s 3', 'd s 4'], function(e, key) { keypressDebug(key); });
        }

        $("#channel .switch").removeClass('active');
        $("#channel .lfs").addClass('active');
        $("#toggleVR .VR").click(function(event) { toggleVR(); });
        $("#toggleMove .Move").click(function(event) { toggleMove(); });

        setInterval(function() { updateScene(true); }, 1000); // update every second for slow loading images
        updateScene(true);
    };

    return global;
}(jQuery));
$(document).ready(MAIN.main);
angular.module('todoApp', [])
    .controller('TodoController', ['$scope', function($scope) {
        $scope.halo = 0;
        $scope.switchHalo= function() {
            current_halo = parseInt($scope.todoText);
            MAIN.remove_particles();
            MAIN.add_particles(current_halo);
            $scope.halo = $scope.todoText;
        };
    }]);
