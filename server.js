var ip   = "127.0.0.1";
var port = 8080;

var whitelist = [
  '/client.html'
];

var http = require('http');
var urlparser = require('url');
var fs = require('fs');
var WebSocketServer = require('websocket').server;

function onRequest(request, response) {
  var url = urlparser.parse(request.url, true);

  if(url.pathname == '/ajax.html') {
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(JSON.stringify(url.query));
  } else if(whitelist.indexOf(url.pathname) != -1 && fs.existsSync('.' + url.pathname)) {
    var file = fs.readFileSync('.' + url.pathname, {
      encoding: 'utf8'
    });

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(file);
  } else {
    console.log('404: ' + request.url);

    response.writeHead(404, {"Content-Type": "text/html"});
    response.write("404 File not found!");
  }

  response.end();
}

var server = http.createServer(onRequest).listen(port, ip);

wsServer = new WebSocketServer({
  httpServer: server,
  autoAcceptConnections: false
});

wsServer.on('request', function(request) {
  var connection = request.accept('echo-protocol', request.origin);
  console.log((new Date()) + ' WebSocket connection accepted.');

  connection.on('message', function onWsConnMessage(message) {
    if (message.type == 'utf8') {
      console.log('Received message: ' + message.utf8Data);
      connection.sendUTF(message.utf8Data);
    } else if (message.type == 'binary') {
      console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
      connection.sendBytes(message.binaryData);
    }
  });

  connection.on('close', function onWsConnClose(reasonCode, description) {
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
  });
});

console.log("Server has started.");
