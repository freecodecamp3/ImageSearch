
function heredoc(fn) {return fn.toString().split('\n').slice(1,-1).join('\n') + '\n';}

function obj2arr(obj) {
	return Object.keys(obj).map(function(k){return obj[k]});
}

var Nightmare = require('nightmare');

// http://image.baidu.com/search/flip?tn=baiduimage&ie=utf-8&word=aaa
//http://image.baidu.com/search/flip?tn=baiduimage&ie=utf-8&word=aaa&pn=20

function searchImage(keyword, page, complete) {
	Nightmare({show:false})
	.goto('http://image.baidu.com/search/flip?tn=baiduimage&ie=utf-8&word='+keyword+'&pn='+page*20)
	.evaluate(function () {
		var imgittems = document.querySelectorAll('ul.imglist > li.imgitem');
		var liKeys = Object.getOwnPropertyNames(imgittems);
		var arr = [];
		liKeys.forEach(function (elt) {
			var li = imgittems[elt];
			var a = li.querySelector('a').href;
			var thumburl = li.querySelector('img').src;
			var title = li.querySelector('img').alt.replace(/<\/?.+?>/g,"");
			arr.push({a:a, thumburl:thumburl, title:title});
		});
		return arr;
	})
	.end()
	.then(function (result) {
		//console.log(result);
		complete(result);
	})
	.catch(function (error) {
		complete(error);
		console.error('Search failed:', error);
	});
}

function searchImageDetail(url, complete) {
	Nightmare({show:false})
	.goto(url)
	.evaluate(function () {
		var imgurl = document.querySelector('img#currentImg').src;
		var fromurl = document.querySelector('a.pic-from-host').title;
		return {imgurl:imgurl, fromurl:fromurl};
	})
	.end()
	.then(function (result) {
		complete(result);
	})
	.catch(function (error) {
		complete(error);
		console.error('Search failed:', error);
	});
}

function outputSearch(keyword, offset) {
	var cache = [];
	searchImage(keyword, offset, function(result) {
		var arr = obj2arr(result);
		var promises = [];
		arr.forEach(function (elt) {
			var promise = new Promise(function(resolve) {
				searchImageDetail(elt.a, function(result) {
					var obj = Object.assign(elt, result);
					resolve(obj);
				});
			});
			promise.then(function(resutl) {
				cache.push(result);
			});
			promises.push(promise);
		});
		
		Promise.all(promises)
		.then(function() {
			response.write(JSON.stringify(cache));
			response.end();
		})
		.catch(function(error) {
			response.write('error!');
			response.write(result.toString());
			response.end();
		});
	});
}

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
			outputSearch(arr[1], params.offset);
		} else {
			response.end('OK');
		}
	}
}).listen(process.env.PORT || 5000);

