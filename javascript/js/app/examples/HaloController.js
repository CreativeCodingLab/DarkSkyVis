define(function(require) {
    var THREE = require("three"),
        EPOCH = require("Epoch");

    return function() {
        var self = this;
        self.LUT = { length: 0 };
        self.Lines = { group: new THREE.Object3D() };
        self.Spheres = { group: new THREE.Object3D() };
        self.Branches = { group: new THREE.Object3D() };
        self.prevTarget = { object: null ;
        self.curTarget = { object: null };
        self._lines = [];
        self._traversed = {};

        /* ================================== *
         *          createHaloGeometry
         *  Geometry rendering function. Builds
         *  Our splines and spheres for each
         *  Halo object. Iterates over time
         *
         *  NB: A number of helper functions
         *  included below
         * ================================== */
        self.createHaloGeometry = function(Periods) {

            for (var i = 0; i < Periods.length; i++) {

                for (var j = 0; j < Periods[i].length; j++) {

                    var id = Periods[i][j];

                    if (!(id in _traversed)) {

                        var points = self.intoTheVoid(id, [], 0);
                        self._lines[i].push( { 'points': points, 'id': id } );
                    }

                    self.createSphere(id, colorKey(i),  i);
                }
            }

            for (i = 0; i < self._lines.length; i++) {

                for (j = 0; j < self._lines[i].length; j++) {

                    var id = self._lines[i][j].id
                    var segment = self._lines[i][j].points;
                    if (segment.length > 1)
                        createPathLine(segment, colorKey(i), id, i);
                }
            }

            // set the visibility of the halo data
            self.displayHaloData();
        }

        // Helper function
        self.intoTheVoid = function(id, points, steps) {

            var maxSteps = 1;
            var halo = self.LUT[id];  // use the ID to pull the halo
            points.push(halo.position);
            //points.push([halo.x,halo.y,halo.z,halo.id,halo.desc_id]); // for debugging purposes

            //if (halo.desc_id in self.LUT && halo.time < EPOCH.TAIL) {

            if (halo.desc_id in self.LUT && steps < maxSteps) {

                var next = self.LUT[halo.desc_id];

                if (halo.desc_id in _traversed) {

                    //if (halo.time === next.time){
                    //    console.log('\t',halo.time, next.time, halo.id, next.id, halo.position, next.position);
                    //    return [];
                    //}
                    //console.log("\t\tAdding", halo.id, "to points", halo.time, next.position);
                    points.push(next.position);
                    //points.push([next.x,next.y,next.z,next.id,next.desc_id]); // for debugging purposes
                    return points;
                } else {
                    _traversed[halo.id] = true;
                    //console.log("\t\tAdding", halo.id, "to _traversed", halo.time);
                    return self.intoTheVoid(next.id, points, steps+1);
                }
            } else {
                //console.log("\t\thalo->id:",halo.id, "!= halo.desc_id:", halo.desc_id);
                return points;
            }

        }



        // kind of a misleading function name
        self.displayHaloData = function(Periods) {

            for (var i = 0; i < Periods.length; i++) {

                for (var j = 0; j < Periods[i].length; j++) {

                    var id = Periods[i][j];
                    console.log(i, id)
                    // Set Halo Line Visibility
                    if (self.Lines[id]){
                        // console.log("\tdisplaying Halo line?", i, id, config.showPaths, EPOCH.HEAD, EPOCH.TAIL)
                        self.Lines[id].visible = (i >= EPOCH.HEAD && i < EPOCH.TAIL)? config.showPaths : false;
                    }
                    // Set Halo self.Spheres Visibility
                    self.Spheres[id].visible = (i >= EPOCH.HEAD && i <= EPOCH.TAIL)? config.showHalos : false;
                    if (curTarget && self.Spheres[id].position !== curTarget.object.position){
                        self.Spheres[id].material.color.set(colorKey(i));
                        self.Spheres[id].material.opacity = 0.2;
                    }
                }
            }

        }



        self.initHaloTree = function(DATASET, firstTime) {

            console.log("\n\ninitHaloTree!!", firstTime, DATASET.length);

            if (firstTime)
                self._prepGlobalStructures();
            else
                self._resetGlobalStructures();

            // PATH257, HALOTREE, TREE676638
            for (var i = 0; i < DATASET.length; i++) {

                var halo = DATASET[i];
                halo.rs1 = (halo.rvir / halo.rs);  // convenience keys, one divided by
                halo.rs2 = (halo.rvir * halo.rs);  // the other multiplied
                //halo.x = (halo.x >= 60.0)? 60.0 - halo.x: halo.x;
                //halo.position[0] = halo.x
                halo.vec3 = THREE.Vector3(halo.x, halo.y, halo.z);  // Convenience, make a THREE.Vector3
                halo.time = parseInt(halo.scale * 100) - tree_offset;
                console.log(halo.time, halo.id, halo.desc_id, halo.pid)
                //console.log("\tHalo.id ", halo.id, "Halo.scale",halo.scale, "Halo.time",halo.time);

                // if (halo.x > 50.0 && halo.time)
                //     console.log(halo.time, halo.id, halo.desc_id, halo.position);

                // add Halos to list by ID
                self.LUT[halo.id] = halo;
                self.LUT.length++;

                EPOCH.Periods[halo.time].push(halo.id);
            }

            console.log("\n\tEPOCH.Periods", EPOCH.Periods,"\n");
            console.log("\tself.LUT", self.LUT.length,"\n");

            // **** Make some Spline Geometry ***
            createHaloGeometry(EPOCH.Periods);

        }


        // Path self.Lines
        self.createPathLine = function(points, color, id, period) {
            // if points is defined at all...
            if (points && points.length > 1) {

                // console.log("creating PathLine!", period);
                var index, xyz;
                var colors = [];
                var spline = new THREE.Spline();
                var numPoints = points.length*nDivisions;

                var splineGeometry = new THREE.Geometry();

                spline.initFromArray(points);
                for (var i=0; i <= numPoints; i++) {

                    index = i/numPoints;
                    xyz = spline.getPoint(index);
                    splineGeometry.vertices[i] = new THREE.Vector3( xyz.x, xyz.y, xyz.z );
                    colors[ i ] = new THREE.Color(color);

                }
                splineGeometry.colors = colors;
                splineGeometry.computeBoundingSphere();

                var material = new THREE.LineBasicMaterial({
                    color: rgbToHex(255, 255, 255),
                    linewidth: 2,
                    vertexColors: THREE.VertexColors,
                    transparent: true,
                    opacity: 0.5
                });

                var mesh = new THREE.Line(splineGeometry, material);
                mesh.halo_id = id;
                mesh.halo_period = period;
                self.Lines[id] = mesh;
                self.Lines.group.add(mesh);
            }

        }

        // self.Spheres
        self.createSphere = function(id, color, index) {

            var halo = self.LUT[id];
            //console.log("createSphere", index, halo.id);

            var mesh = new THREE.Mesh(
                new THREE.SphereGeometry(halo.rs1/100, 15, 15),
                new THREE.MeshPhongMaterial({
                    color: color,
                    specular: rgbToHex(255,255,255),
                    shininess: 30,
                    shading: THREE.SmoothShading,
                    vertexColors: THREE.VertexColors,
                    transparent: true,
                    opacity: 0.2
                })
            );

            // Add the halo's id to the mess so we can check it against the Halo ID map/self.LUT/Hash.
            mesh.renderOrder = halo.time;
            mesh.halo_id = id;
            mesh.halo_period = halo.time;
            mesh.position.set( halo.x, halo.y, halo.z);
            mesh.updateMatrix();

            self.Spheres[id] = mesh;
            self.Spheres.group.add(mesh);
            //console.log("created Halosphere", halo.id, index, self.Spheres.length, self.Spheres[index].length);
        }

            // Helper Function, closure
        self._prepGlobalStructures = function() {

            console.log("calling __prepGlobalStructures()!");
            self._lines = [];
            HaloBranch = {};
            self.Spheres = {};
            self.Lines = {};
            _traversed = {};
            self.LUT = {length: 0};  // just to keep track of how many objects we have


            EPOCH.Periods = [];
            for (var i = 0; i < NUMTIMEPERIODS; i++) {

                self._lines[i] = [];
                EPOCH.Periods[i] = [];
            }
        }

        self._resetGlobalStructures = function() {

            console.log("calling __resetGlobalStructures()!");
            for (var i = 0; i < EPOCH.Periods.length; i++) {

                for (var j = 0; j < EPOCH.Periods[i].length; j++) {

                    var id = EPOCH.Periods[i][j]
                    if (self.Lines[id]) {

                        self.Lines.group.remove(self.Lines[id]);
                        scene.remove(self.Lines[id]);
                        self.Lines[id].material.dispose();
                        self.Lines[id].geometry.dispose();
                        delete self.Lines[id]
                    }

                    if (self.Spheres[id]) {

                        sphereGroup.remove(self.Spheres[id]);
                        scene.remove(self.Spheres[id]);
                        self.Spheres[id].material.dispose();
                        self.Spheres[id].geometry.dispose();
                        delete self.Spheres[id];
                    }

                    if (self.LUT[id]) {

                        delete self.LUT[id]
                        self.LUT.length--;
                    }
                }
            }
            self._prepGlobalStructures();
        }
    }
});

