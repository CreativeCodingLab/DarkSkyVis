/**
 * @module server
 */

// node mode
/* jshint node: true */

"use strict";


var   http = require("http");
var   url  = require("url");
var   path = require("path");
var   fs   = require("fs");
var   port = process.argv[2] || 8888;


var server = http.createServer(function(request, response) {

	// find the filename requested

	// if the file exists
		// send the content of the file
		// with the correct HTTP type

	// otherwise, return 404

});

server.listen(parseInt(port), "0.0.0.0");

console.log("\nStatic file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown\n");
