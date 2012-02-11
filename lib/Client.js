const API_VERSION = '2010-04-01';
const API_HOST = 'api.twilio.com';

var https = require('https'),
	qs = require('querystring'),
	util = require('util'),
	EventEmitter = require('events').EventEmitter,
	TwilioApp = require('./Application');

var Client = module.exports = function(accountSID, authToken) {
	this.accountSID = accountSID;
	this.authToken = authToken;
	this._getCache = {};
	this._appMiddleware = {}; //indexed by Sid
	//EventEmitter.call(this); //Make `this` a new EventEmitter
};
//util.inherits(Client, EventEmitter); //Inherit all EventEmitter prototype methods
Client.prototype.createApp = function(appInfo, cb) {
	var cli = this;
	if(!cli.isValidApp(appInfo) ) cb(new Error("Application is not valid: Missing required" +
		" URL, method, or required property.") );
	else
	{
		cli._restAPI("Accounts/" + cli.accountSID + "/Applications", appInfo,
			'POST', function(err, res) {
			if(err) cb(err);
			else
			{
				var app = new TwilioApp(cli, res.body);
				cli._appMiddleware[app.Sid] = app.middleware();
				cb(null, app);
			}
		});
	}
};
Client.prototype.loadApp = function(appSID, cb) {
	var cli = this;
	cli._restAPI("Accounts/" + cli.accountSID + "/Applications/" + appSID, function(err, res) {
		if(err) return cb(err);
		if(!cli.isValidApp(res.body) ) cb(new Error("Application " + appSID +
			" is not valid: Missing required URL or method.") );
		else {
			var app = new TwilioApp(cli, res.body);
			cli._appMiddleware[app.Sid] = app.middleware();
			cb(null, app);
		}
	});
};
Client.prototype.unregisterApp = function(appSID) {
	delete cli._appMiddleware[appSID];
}
Client.prototype.isValidApp = function(appInfo) {
	var required = ['FriendlyName', 'VoiceUrl', 'StatusCallback', 'SmsUrl', 'SmsStatusCallback'];
	var reqMethods = ['VoiceMethod', 'StatusCallbackMethod', 'SmsMethod'];
	for(var i in required)
		if(typeof appInfo[required[i]] != 'string' || appInfo[required[i]].length <= 0)
			return false;
	for(var i in reqMethods)
		if(appInfo[reqMethods[i]] == null || appInfo[reqMethods[i]].toUpperCase() != 'GET')
			appInfo[reqMethods[i]] = 'POST';
	return true;
};
Client.prototype.middleware = function() {
	var cli = this;
	return function(req, res, next) {
		var keys = Object.keys(cli._appMiddleware);
		var i = 0;
		(function nextMiddleware(err) {
			if(err) return next(err); //abort!
			if(i < keys.length)
				cli._appMiddleware[keys[i++]](req, res, nextMiddleware);
			else
				next();
		})();
	}
};
Client.prototype._restAPI = function(command, data, method, cb) {
	//optional args
	if(typeof data == "function") {
		cb = data;
		data = undefined;
	}
	else if(typeof method == "function") {
		cb = method;
		method = undefined;
	}
	if(typeof data == "string") {
		method = data;
		data = undefined;
	}
	//TODO: Make caching a bit better than this...
	if(Math.random() > 0.995)
		this._getCache = {}; //clear cache
	//Build command, headers, and method type
	var that = this;
	command += ".json";
	if(data == null)
		data = '';
	else
		data = qs.stringify(data);
	var headers = {};
	if(method == 'POST' || method == 'PUT' || method == 'DELETE')
	{
		headers['content-type'] = 'application/x-www-form-urlencoded';
		headers['content-length'] = data.length;
	}
	else
	{
		method = 'GET';
		if(data != '')
			command += '?' + data;
		if(this._getCache[command] != undefined)
			headers['if-modified-since'] = new Date(
				this._getCache[command].headers['last-modified']).toUTCString();
	}
	//Make HTTPS request
	console.log("REST API Request:", method, command, data);
	var req = https.request({
		'host': API_HOST,
		'port': 443,
		'method': method,
		'path': '/' + API_VERSION + '/' + command,
		'headers': headers,
		'auth': this.accountSID + ':' + this.authToken
	}, function(res) {
		var resBody = '';
		res.on('data', function(chunk) {
			resBody += chunk;
		});
		res.on('end', function() {
			try {
				if(res.statusCode == 304)
					cb(null, that._getCache[command]);
				else if(res.statusCode >= 400)
					cb(new Error("An error occurred for command: " + method + " " + command +
						"\n\t" + API_HOST + " responded with status code " + res.statusCode), res);
				else
				{
					if(method == 'GET' && res.headers['last-modified'])
						that._getCache[command] = res;
					if(resBody == '')
						res.body = {};
					else
						res.body = JSON.parse(resBody);
					//Convert from 'prop_like_this' to 'PropLikeThis'
					for(var i in res.body)
					{
						var newProp = i.split('_');
						for(var j in newProp)
							newProp[j] = newProp[j].charAt(0).toUpperCase() + newProp[j].substr(1);
						res.body[newProp.join('')] = res.body[i];
						delete res.body[i];
					}
					cb(null, res);
				}
			} catch(e) {cb(e);}
		});
		res.on('close', function(err) {
			if(res.statusCode == 204)
				res.body = {};
			cb(err, res);
		});
	});
	//Send POST data
	if(method == 'POST' || method == 'PUT')
		req.end(data);
	else
		req.end();
};