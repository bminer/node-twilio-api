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
		console.log("Placing call...");
		tapp.makeCall(credentials.FromNumber, credentials.ToNumber, {
			'timeout': 3
		}, function(err, call) {
			t.ifError(err);
			if(!err && call)
			{
				call.on('connected', function() {
					console.log(call, "connected", arguments);
				});
				call.on('ended', function() {
					console.log(call, "ended", arguments);
					t.done();
				});
				call.say("Goodbye");
			}
		});
	}
}

/*
exports.makeCall = function(t) {
	var credentials = client.credentials;
	if(credentials.FromNumber && credentials.ToNumber)
	{
		console.log("Placing call...");
		tapp.makeCall(credentials.FromNumber, credentials.ToNumber, function(err, call) {
			t.ifError(err);
			if(!err && call)
			{
				call.on('connected', function(status) {
					console.log(new Date().toUTCString() + ": Call " + call.Sid +
						" has been connected: " + status);
				});
				call.say("Hello. This is a test of the Twilio API.");
				call.pause();
				var input = call.gather(function(call, digits) {
					call.say("You pressed " + digits + ".");
					var str = "Congratulations! You just used Node Twilio API to place an " +
						"outgoing call.";
					call.say(str, {'voice': 'man', 'language': 'en'});
					call.pause();
					call.say(str, {'voice': 'woman', 'language': 'en-gb'});
					call.pause();
					(function getInputLoop(call) {
						input = call.gather(function(call, digits) {
							if(digits == "123")
							{
								call.say("OK. I'm calling someone else now. Please wait.");
								var roomName = call.joinConference({
									'leaveOnStar': true,
									'timeLimit': 120,
									'endConferenceOnExit': true
								});
								call.say("The call has ended.");
								//Now call the other person
								tapp.makeCall(credentials.FromNumber, credentials.ToNumber2, {
									'timeout': 3
								}, function(err, call2)
								{
									var errorFunc = function(call) {
										call.say("There was a problem contacting the other party.");
										call.say("Status code: " + call.Status);
										call.say("Goodbye");
									};
									if(err) call.liveCb(errorFunc);
									call2.on('connected', function(status) {
										console.log("Call 2 connected:", status);
										if(status != 'in-progress')
											call.liveCb(errorFunc);
										else
										{
											call2.say("Hello. Please wait while I connect you to " +
												"your party.");
											call2.joinConference(roomName, {
												'endConferenceOnExit': true
											});
											call2.say("The call has ended. Thank you for participating " +
												"in the test. Goodbye.");
										}
									});
									call2.on('ended', function(status, duration) {
										console.log("Call 2 ended:", status, duration);
										call.liveCb(errorFunc);
									});
								});
							}
							else
								call.say("OK. I won't run the next test.");
							call.say("Goodbye!");
						}, {
							'timeout': 10,
							'finishOnKey': '#',
							'numDigits': 3
						});
						input.say("Please press 1, 2, 3 to run the next test. Otherwise, press 0 and #.");
						call.say("Sorry. I didn't hear your response.");
						call.cb(getInputLoop);
					})(call);
				}, {
					'timeout': 10,
					'numDigits': 1
				});
				input.say("Please press any key to continue. " +
					"You may press 1, 2, 3, 4, 5, 6, 7, 8, 9, or 0.");
				call.say("I'm sorry. I did not hear your response. Goodbye!");
				call.on('ended', function(status, duration) {
					console.log(new Date().toUTCString() + ": Call " + call.Sid + " has ended: "
						+ status + ":" + duration + " seconds");
					t.done();
				});
			}
		});
	}
}*/

exports.stopServer = function(t) {
	app.close();
	t.done();
}