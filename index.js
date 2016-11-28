
function heredoc(fn) {return fn.toString().split('\n').slice(1,-1).join('\n') + '\n';}

function obj2arr(obj) {
	return Object.keys(obj).map(function(k){return obj[k]});
}

function downloadPage(host, path, complete) {
	require('http').get({host:host, path:path}, function(res) {
		var html = "";
		res.on("data",function(data) {
			html += data;
		});
		
		res.on("end", function() {
			complete(html);
		});
	});
}

function searchImage(keyword, page, complete) {
	downloadPage('image.baidu.com', '/search/flip?tn=baiduimage&ie=utf-8&word='+encodeURI(keyword)+'&pn='+page*20, function(html){
		html = html.replace(/<\/?.+?>/g,"");
		html = html.replace(/\'/g,"\\\'");
//		html = html.replace(/\"/g,"\\\"");
		html = html.replace(/\n/g,"\\n");
		html = html.replace(/\r/g,"\\r");
		html = html.replace(/\t/g,"\\t");
		
		var idx = html.indexOf('{"thumbURL"');
		var lidx = html.lastIndexOf('"adPicId"');
		var sub = html.slice(idx, lidx);
		sub = '['+sub+' "adPicId":"0"}]';
		var arr = JSON.parse(sub);
		complete(arr);
	});
}



function outputSearch(keyword, offset) {
	return new Promise(function(resolve) {
		searchImage(keyword, offset, function(arr) {
			var out = [];
			arr.forEach(function (elt) {
				out.push({
					url:elt.objURL,
					snippet:elt.fromPageTitle,
					thumbnail:elt.thumbURL,
					context:elt.fromURLHost
				});
			});
			resolve(out);
		});
	}).then(function(out) {
		return JSON.stringify(out);
	}, function () {
		return 'error';
	});
}

var logs = [];

require("http").createServer(function (request, response) {
	response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
	
	var pathObj =  require('url').parse(request.url);
	if (pathObj.pathname.indexOf('/api/latest/imagesearch') == 0) {
		response.end('latest');
	} else {
		var arr = pathObj.pathname.match(/\/api\/imagesearch\/(.+)/);
		if (arr && arr.length>=2) {
			var params = require('querystring').parse(pathObj.query);
			//console.log(pathObj.query, arr[1], params, params.offset);
			var keyword = decodeURI(arr[1]);
			logs.push({'term':keyword, when:});
			
			outputSearch(keyword, params.offset)
			.then(function(out) {
				response.end(out);
			});
		} else {
			response.end('OK');
		}
	}
}).listen(process.env.PORT || 5000);


