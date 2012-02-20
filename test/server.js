var twilio = require('../lib'),
	basicTest = require('./basics'),
	client,
	express = require('express'),
	app = express.createServer(),
	tapp;

exports.getTwilioCredentials = basicTest.getTwilioCredentials;
exports.constructClient = function() {
	client = basicTest.constructClient.apply(this, arguments);
}

exports.setupExpressMiddleware = function(t) {
	app.use(express.logger() );
	app.use(client.middleware() );
	app.use(app.router);
	app.use(express.errorHandler({
		'showMessage': true,
		'dumpExceptions': true
	}) );
	app.listen(8002);
	t.done();
}

exports.loadApplication = function(t) {
	t.expect(2);
	client.account.getApplication(client.credentials.ApplicationSid, function(err, app) {
		t.ifError(err);
		t.notEqual(app, null, "Application is null or undefined");
		tapp = app;
		t.done();
	});
}

exports.registerApplication = function(t) {
	tapp.register();
	t.done();
}

exports.makeCall = function(t) {
	var credentials = client.credentials;
	if(credentials.FromNumber && credentials.ToNumber)
	{
		tapp.makeCall(credentials.FromNumber, credentials.ToNumber, function(err, call) {
			t.ifError(err);
			if(!err && call)
			{
				call.on('connected', function(status) {
					console.log(new Date().toUTCString() + ": Call " + call.Sid + " has been connected: " + status);
				});
				call.say("Hello. This is a test of the Twilio API.");
				call.pause();
				var input = call.gather(function(call, digits) {
					call.say("You pressed " + digits + ".");
					var str = "Congratulations! You just used Node Twilio API to place an outgoing call.";
					call.say(str, {'voice': 'man', 'language': 'en'});
					call.pause();
					call.say(str, {'voice': 'man', 'language': 'en-gb'});
					call.pause();
					call.say(str, {'voice': 'woman', 'language': 'en'});
					call.pause();
					call.say(str, {'voice': 'woman', 'language': 'en-gb'});
					call.pause();
					call.say("Goodbye!");
				}, {
					'timeout': 10,
					'numDigits': 1
				});
				input.say("Please press any key to continue. You may pres 1, 2, 3, 4, 5, 6, 7, 8, 9, or 0.");
				call.say("I'm sorry. I did not hear your response. Goodbye!");
				call.on('ended', function(status, duration) {
					console.log(new Date().toUTCString() + ": Call " + call.Sid + " has ended: " + status + ":" + duration + " seconds");
					t.done();
				});
			}
		});
	}
}

exports.stopServer = function(t) {
	app.close();
	t.done();
}