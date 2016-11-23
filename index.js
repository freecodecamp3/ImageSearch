
function heredoc(fn) {return fn.toString().split('\n').slice(1,-1).join('\n') + '\n';}

require("http").createServer(function (request, response) {
	response.writeHead(200, {'Content-Type': 'text/html'});
	var out = 'OK';
	response.end(out);
}).listen(process.env.PORT || 5000);

