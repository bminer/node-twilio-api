var utilFuncs = require('./util');
function Account(client, Sid) {
	this._client = client;
	this.Sid = Sid;
}
module.exports = Account;
Account.mutableProps = ['FriendlyName', 'Status'];

Account.prototype.load = utilFuncs.globalLoad('Accounts/' + this.Sid);
Account.prototype.save = utilFuncs.globalSave('Accounts/' + this.Sid, Account.mutableProps);

/*
Client.prototype.createApplication = function(appInfo, cb) {
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
Client.prototype.getApplication = function(appSID, cb) {
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
*/