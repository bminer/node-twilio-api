var twilio = require('../lib'),
	credentials,
	client,
	Application = require('../lib/Application');

exports.getTwilioCredentials = function(t) {
	t.expect(2);
	try {
		credentials = require('./credentials');
		t.ok(typeof credentials.AccountSid == "string", "Credentials object missing 'AccountSid' property");
		t.ok(typeof credentials.AuthToken == "string", "Credentials object missing 'AuthToken' property");
		t.done();
	}
	catch(e) {
		console.log("Twilio Credentials not found");
		console.log("To prevent this prompt, create a 'credentials.js' file that exports\n" +
			" your AccountSid and AuthToken.");
		var readline = require('readline');
		var input = readline.createInterface(process.stdin, process.stdout, null);
		input.question("Please enter your Twilio Account Sid: ", function(accountSid) {
			input.question("Please enter your Twilio Auth Token: ", function(authToken) {
				input.pause();
				process.stdin.pause();
				credentials = {'AccountSid': accountSid, 'AuthToken': authToken};
				t.equal(typeof credentials.AccountSid, "string", "Credentials object missing 'AccountSid' property");
				t.equal(typeof credentials.AuthToken, "string", "Credentials object missing 'AuthToken' property");
				t.done();
			});
		});
	}
}
exports.constructClient = function(t) {
	t.expect(2);
	client = new twilio.Client(credentials.AccountSid, credentials.AuthToken);
	t.ok(client.AccountSid == credentials.AccountSid, "Account Sid does not match credentials");
	t.ok(client.account.Sid == credentials.AccountSid, "account.Sid does not match credentials");
	t.done();
	return client;
}

exports.listAvailableLocalNumbers = function(t) {
	t.expect(5);
	client.account.listAvailableLocalNumbers('US', {
		'AreaCode': 614 //Woot! C-bus! Represent, yo!
	}, function(err, li) {
		t.ifError(err);
		if(li)
		{
			t.ok(li.AvailablePhoneNumbers instanceof Array, "Not an array");
			t.ok(li.AvailablePhoneNumbers.length > 0, "Hmm... no numbers in Columbus?");
			if(li.AvailablePhoneNumbers.length > 0)
			{
				t.ok(li.AvailablePhoneNumbers[0].Region == 'OH', "Not in Ohio?");
				t.ok(li.AvailablePhoneNumbers[0].IsoCountry == 'US', "Not in US?  Say what?");
				t.done();
			}
		}
	});
}

exports.listAvailableTollFreeNumbers = function(t) {
	t.expect(5);
	client.account.listAvailableTollFreeNumbers('US', {
		'AreaCode': 866
	}, function(err, li) {
		t.ifError(err);
		if(li)
		{
			t.ok(li.AvailablePhoneNumbers instanceof Array, "Not an array");
			t.ok(li.AvailablePhoneNumbers.length > 0, "Hmm... toll free numbers?");
			if(li.AvailablePhoneNumbers.length > 0)
			{
				t.ok(li.AvailablePhoneNumbers[0].PhoneNumber.substr(0, 5) == '+1866', "Does not match filter");
				t.ok(li.AvailablePhoneNumbers[0].IsoCountry == 'US', "Not in US?  Say what?");
			}
		}
		t.done();
	});
}

var appName = "Testing 2789278973974982738478";
exports.createApplicationFail = function(t) {
	t.expect(1);
	t.throws(function() {
		client.account.createApplication(1, 2, 3, 4, 5, function() {}, 6, 7, 8, 9, 10, function() {});
	});
	t.done();
}

/*exports.createApplication = function(t) {
	t.expect();
	client.account.createApplication(appName, function(err, app) {
		t.ifError(err);
		if(app)
		{
			t.ok(app instanceof Application, "Not an Application");
			t.ok(app.FriendlyName == appName, "FriendlyName does not match");
			t.ok(app.AccountSid == client.account.Sid, "Account Sid does not match");
			
		}
	});
}*/

exports.listApplications = function(t) {
	client.account.listApplications(function(err, li) {
		t.ifError(err);
		if(li)
		{
			t.ok(li.Applications instanceof Array, "Not an array");
			t.ok(li.Applications.length > 0, "Hmm... no applications?");
		}
		t.done();
	});
}

/*exports.getApplication = function(t) {
	
}*/