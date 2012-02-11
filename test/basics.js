var twilio = require('../lib'),
	credentials,
	client;

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
				t.ok(typeof credentials.AccountSid == "string", "Credentials object missing 'AccountSid' property");
				t.ok(typeof credentials.AuthToken == "string", "Credentials object missing 'AuthToken' property");
				t.done();
			});
		});
	}
}
exports.constructClient = function(t) {
	client = new twilio.Client(credentials.AccountSid, credentials.AuthToken);
	t.done();
}
