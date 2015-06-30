/**
 * Created by krbalmryde on 6/28/15.
 */
var http = require("http");

http.createServer(function(request, response) {
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write("It's alive!");
    response.end();
}).listen(3000);