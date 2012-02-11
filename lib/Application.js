var url = require('url'),
	qs = require('querystring'),
	crypto = require('crypto'),
	tls = require('tls'),
	util = require('util'),
	EventEmitter = require('events').EventEmitter,
	Call = require('./Call');
var Application = module.exports = function(client, appInfo) {
	this._client = client;
	for(var i in appInfo)
		this[i] = appInfo[i];
	this._pendingCalls = {}; //indexed by sid
	this._nextConf = 0;
	EventEmitter.call(this); //Make `this` a new EventEmitter
};
util.inherits(Application, EventEmitter); //Inherit all EventEmitter prototype methods
Application.prototype.remove = function(cb) {
	if(cb == undefined) cb = function(err) {if(err) throw err;};
	this.unregister();
	this._restAPI('Applications/' + this.Sid, 'DELETE', function(err, res) {
		if(err) cb(err);
		else cb(null, res.body);
	});
}
Application.prototype.unregister = function() {
	this._client.unregisterApp(this.Sid);
}
/*
	makeCall(fromNumber, toNumber, [options, cb])
	options include:
		-sendDigits
		-ifMachine
		-timeout (defaults to 40 seconds, or roughly 6 rings)
	cb(err, call) is called when the call is queued.
	You may operate on the `call` Object using TwiML verbs, which will be executed when
	the call is answered.
	If `cb` is omitted, the call will be treated like an incoming call
*/
Application.prototype.makeCall = function(fromNumber, toNumber, options, cb) {
	if(typeof options == "function")
	{
		cb = options;
		options = undefined;
	}
	if(options == null)
		options = {};
	var app = this,
		optProps = ['sendDigits', 'ifMachine', 'timeout'],
		data = {
			'ApplicationSid': app.Sid,
			'From': fromNumber,
			'To': toNumber,
			'timeout': 40 //changed from API spec default of 60 seconds
		};
	for(var i in optProps)
		data[optProps[i]] = options[optProps[i]];
	app._restAPI('Calls', data, 'POST', function(err, res) {
		if(err) return cb(err);
		var call = new Call(app, res.body);
		app._pendingCalls[call.Sid] = call; //Add to queue
		cb(null, call);
		call._queuedOutboundCall = true;
	});
}
Application.prototype._restAPI = function(command, data, method, cb) {
	return this._client._restAPI("Accounts/" + this._client.accountSID +
		"/" + command, data, method, cb);
}
Application.prototype.getRandomConference = function() {
	return {
		"name":	"rand:" + (_nextConf++) + ":" + Math.random()
	};
}
Application.prototype.bridgeCalls = function(c1, c2) {
	if(typeof c1 == "string")
		c1 = this._pendingCalls[c1];
	if(!(c1 instanceof Call) )
		throw new Error("You must specify two call Objects or call Sids");
	if(typeof c2 == "string")
		c2 = this._pendingCalls[c2];
	if(!(c2 instanceof Call) )
		throw new Error("You must specify two call Objects or call Sids");
	
}
Application.prototype.middleware = function() {
	var app = this;
	return function(req, res, next) {
		var protocol = req.app instanceof tls.Server ? "https:" : "http:";
		var voiceURL = url.parse(app.VoiceUrl, false, true),
			voiceStatus = url.parse(app.StatusCallback, false, true),
			smsURL = url.parse(app.SmsUrl, false, true),
			smsStatus = url.parse(app.SmsStatusCallback, false, true),
			reqURL = url.parse(protocol + "//" + req.headers['host'] + req.url, true, true);
		function match(testURL, testMethod) {
			return (reqURL.hostname == testURL.hostname &&
				reqURL.pathname == testURL.pathname &&
				req.method.toUpperCase() == testMethod.toUpperCase() );
		};
		function parseData(cb) {
			var data = {},
				sig = protocol + "//" + req.headers['host'] + req.url;
			if(req.method == 'POST')
			{
				if(!req.body)
				{
					//Manual parsing...
					var buf = '';
					req.on('data', function(chunk) {buf += chunk;});
					req.on('end', function() {
						try {
							req.body = buf.length > 0 ? qs.parse(buf) : {};
							var keys = Object.keys(req.body);
							keys.sort();
							for(var i = 0; i < keys.length; i++)
							{
								data[keys[i]] = req.body[keys[i]];
								sig += keys[i] + req.body[keys[i]];
							}
							afterBodyParser();
						} catch(err) {console.log(err); return cb(err);}
					});
				}
				else
					afterBodyParser();
			}
			else
				afterBodyParser();
			function afterBodyParser()
			{
				//Do query parsing no matter what
				if(!req.query)
					req.query = reqURL.query || {};
				for(var i in req.query)
					data[i] = req.query[i];
				//Now check the signature of the message
				var hmac = crypto.createHmac("sha1", app._client.authToken);
				hmac.update(sig);
				sig = hmac.digest("base64");
				if(sig !== req.headers['x-twilio-signature'])
					cb(new Error("HMAC-SHA1 signatures do not match!") );
				else
					cb(null, data);
			}
		}
		
		/* ------------- BEGIN TWILIO LOGIC ---------------- */
		if(match(voiceURL, app.VoiceMethod) )
		{
			parseData(function(err, data) {
				if(err || data == null) return next(err);
				if(data.CallSid == undefined) return next(new Error("Missing CallSid") );
				//Refactor call object
				data.Sid = data.CallSid;
				delete data.CallSid;
				data.Status = data.CallStatus;
				delete data.CallStatus;
				
				console.log("/voice has been called for call " + data.Sid);
				if(app._pendingCalls[data.Sid] != undefined)
				{
					//Matched queued outgoing call
					var call = app._pendingCalls[data.Sid];
					//Update call object
					for(var i in data)
						call[i] = data[i];
					//Emit events about the call
					if(data.cb)
					{
						if(call._cb[data.cb])
						{
							call._cb[data.cb](call);
							call._handle(res);
						}
						else
							console.warn("WARNING: Callback " + data.cb + " was not found!");
					}
					//Could be a queued outbound call
					else if(call._queuedOutboundCall === true)
					{
						delete call._queuedOutboundCall;
						call.emit('connected');
						call._handle(res);
					}
					else
						console.warn("WARNING: Request for pending call " + data.Sid +
							" did not specify a callback!");
				}
				else
				{
					console.log("Handling inbound call...");
					var call = new Call(app, data);
					app.emit('incomingCall', call);
					call.emit('connected'); //redundant...
					call._handle(res);
				}
			});
		}
		else if(match(voiceStatus, app.StatusCallbackMethod) )
		{
			parseData(function(err, data) {
				if(err || data == null) return next(err);
				if(data.CallSid == undefined) return next(new Error("Missing CallSid") );
				//Refactor call object
				data.Sid = data.CallSid;
				delete data.CallSid;
				data.Status = data.CallStatus;
				delete data.CallStatus;
				
				console.log("/voiceStatus has been called for call " + data.Sid);
				if(app._pendingCalls[data.Sid] != undefined)
				{
					//Matched queued outgoing call
					var call = app._pendingCalls[data.Sid];
					//Update call object
					for(var i in data)
						call[i] = data[i];
					//Delete it from _pendingCalls
					delete app._pendingCalls[data.Sid];
					//Emit events
					call.emit('ended', call.Status, call.CallDuration);
				}
				else
					console.warn("WARNING: Status update for a call that does not exist.");
			});
		}
		else if(match(smsURL, app.SmsMethod) )
		{
			//...TODO
		}
		else if(match(smsStatus, 'POST') )
		{
			//...TODO
		}
		else
			next();
	};
}