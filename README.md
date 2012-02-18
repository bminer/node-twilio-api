Add voice and SMS messaging capabilities to your Node.JS applications with node-twilio-api!

# node-twilio-api

A high-level Twilio helper library to make Twilio API requests, handle incoming requests,
and generate TwiML.

Also ships with Connect/Express middleware to handle incoming Twilio requests.

**IMPORTANT**: You will need a Twilio account to get started (it's not free). [Click here to sign up for 
an account](https://www.twilio.com/try-twilio)

## Install

This project is in an **alpha** stage. **Do NOT use in production environments yet! Use at your own risk!**

`npm install twilio-api`

## Features and Library Overview

Only voice calls are supported at this time, but I plan to implement the entire Twilio API over
the next few months.

 - [Create Twilio client](#createClient)
 - [Manage accounts and subaccounts](#manageAccts)
 - [List available local and toll-free numbers](#listNumbers)
 - [Manage Twilio applications](#applications)
 - List calls and modify live calls
 - [Place calls](#placingCalls)
 - [Receive calls](#incomingCallEvent)
 - Generate TwiML responses without writing any XML - I am a XML hater.
 - [Built-in pagination with ListIterator Object](#listIterator)

## Todo

 - List and manage valid outgoing phone numbers
 - List and provision incoming phone numbers
 - Support for Twilio Connect Applications
 - List and manage conferences, conference details, and participants
 - Send/receive SMS messages
	 - List SMS short codes and details
 - Access recordings, transcriptions, and notifications
 - Respond to fallback URLs
 - Better scalability with multiple Node instances
	- An idea for this is to intercept incoming Twilio requests only if the message is for
	that specific instance. Perhaps use URL namespacing or cookies for this?

## Usage

1. Create a Client using your Account SID and Auth Token.
2. Select your main account or a subaccount.
3. Do stuff...
	- Call API functions against that account (i.e. place a call)
	- Write logic to generate TwiML when Twilio sends a request to your
		application (i.e. when an incoming call rings)

```javascript
var express = require('express'),
    app = express.createServer();
var twilioAPI = require('twilio-api'),
	cli = new twilioAPI.Client(ACCOUNT_SID, AUTH_TOKEN);
app.use(cli.middleware() );
app.listen(PORT_NUMBER);
//Get a Twilio application and register it
cli.account.getApplication(ApplicationSid, function(err, app) {
	if(err) throw err;
	app.register();
	app.on('incomingCall', function(...) {
		//... functionality coming soon...
	});
	app.makeCall(...);
});
//... more sample code coming soon...
//For now, check the /tests folder
```

#### <a name="createClient"></a>Create Twilio client

Easy enough...

```javascript
var twilioAPI = require('twilio-api');
var cli = new twilioAPI.Client(AccountSid, AuthToken);
```

## API

The detailed documentation for twilio-api follows.

#### <a name="middleware"></a>Create Express middleware

- `Client.middleware()` - Returns Connect/Express middleware that handles any request for 
*registered applications*. A registered application will then handle the request accordingly if
the method (GET/POST) and URL path of the request matches the application's VoiceURL,
StatusCallback, SmsUrl, or SmsStatusCallback.

Could this be much easier?

```javascript
var express = require('express'),
    app = express.createServer();
var twilioAPI = require('twilio-api'),
	cli = new twilioAPI.Client(AccountSid, AuthToken);
//OK... good so far. Now tell twilio-api to intercept incoming HTTP requests.
app.use(cli.middleware() );
//OK... now we need to register a Twilio application
cli.account.getApplication(ApplicationSid, function(err, app) {
	if(err) throw err; //Maybe do something else with the error instead of throwing?
	
	/* The following line tells Twilio to look at the URL path of incoming HTTP requests
	and pass those requests to the application if it matches the application's VoiceURL/VoiceMethod,
	SmsURL/SmsMethod, etc. As of right now, you need to create a Twilio application to use the
	Express middleware. */
	app.register();
});
```

Oh, yes.  The middleware also uses your Twilio AuthToken to validate incoming requests,
[as described here](http://www.twilio.com/docs/security#validating-requests).

#### <a name="manageAccts"></a>Manage accounts and subaccounts

- `Client.account` - the main Account Object
- `Client.getAccount(Sid, cb)` - Get an Account by Sid. The Account Object is passed to the callback `cb(err, account)`
- `Client.createSubAccount([FriendlyName,] cb)` Create a subaccount, where callback is `cb(err, account)`
- `Client.listAccounts([filters,] cb)` - List accounts and subaccounts using the specified `filters`, where callback is `cb(err, li)` and `li` is a ListIterator Object.
- `Account.load([cb])` - Load the Account details from Twilio, where callback is `cb(err, account)`
- `Account.save([cb])` - Save the Account details to Twilio, where callback is `cb(err, account)`
- `Account.closeAccount([cb])` - Permanently close this account, where callback is `cb(err, account)`
- `Account.suspendAccount([cb])` - Suspend this account, where callback is `cb(err, account)`
- `Account.activateAccount([cb])` - Re-activate a suspended account, where callback is `cb(err, account)`

#### <a name="listNumbers"></a>List available local and toll-free numbers

- `Account.listAvailableLocalNumbers(countryCode, [filters,] cb)` - List available local telephone
numbers in your `countryCode` available for provisioning using the provided `filters` Object.
See [Twilio's documentation](http://www.twilio.com/docs/api/rest/available-phone-numbers#local)
for what filters you can apply. `cb(err, li)` where `li` is a ListIterator.
- `Account.listAvailableTollFreeNumbers(countryCode, [filters,] cb)` - List available toll-free
numbers in your `countryCode` available for provision using the provided `filters` Object.
See [Twilio's documentation](http://www.twilio.com/docs/api/rest/available-phone-numbers#toll-free)
for what filters you can apply. `cb(err, li)` where `li` is a ListIterator.

#### <a name="applications"></a>Applications

- `Account.getApplication(Sid, cb)` - Get an Application by Sid. The Application Object is passed to the callback `cb(err, app)`
- `Account.createApplication(voiceURL, voiceMethod, statusCallback, statusCallbackMethod,
	smsURL, smsMethod, SmsStatusCallback, [friendlyName], cb)` - Creates an Application with `friendlyName`, where callback is `cb(err, app)`
		The `voiceURL`, `voiceMethod` and other required arguments are used to intercept incoming
		requests from Twilio using the provided Connect middleware. These URLs should point to the same
		server instance as the one running, and
		you should ensure that they do not interfere with the namespace of your web application.
- `Account.listApplications([filters,] cb)`
- `Application.load([cb])`
- `Application.save([cb])`
- `Application.remove([cb])` - Permanently deletes this Application from Twilio, where callback
	is `cb(err, success)` and `success` is a boolean.
- `Application.register()` - Registers this application to intercept the appropriate HTTP requests
	using the [Connect/Express middleware](#middleware).
- `Application.unregister()` - Unregisters this application. This happens automatically if the application
	is deleted.

A valid application must have a VoiceUrl, VoiceMethod, StatusCallback, StatusCallbackMethod,
SmsUrl, SmsMethod, and SmsStatusCallback.  Fallback URLs are ignored at this time.

#### <a name="placingCalls"></a>Placing Calls

- `app.makeCall(from, to, options[, onConnectCallback])` - Place a call and call the callback once the
	party answers. **The callbacks will only be called if `app` is a registered application!**
	`from` is the phone number or client identifier to use as the caller id. If using a phone number,
		it must be a Twilio number or a verified outgoing caller id for your account.
	`to` is the phone number or client identifier to call.
	`options` is an object containing any of these additional properties:
		- sendDigits - A string of keys to dial after connecting to the number. Valid digits in the string include: any digit (0-9), '#', '*' and 'w' (to insert a half second pause).
		- ifMachine - Tell Twilio to try and determine if a machine (like voicemail) or a human has answered the call. Possible values are 'Continue', 'Hangup', and null (the default).
		- timeout - The integer number of seconds that Twilio should allow the phone to ring before assuming there is no answer. Default is 60 seconds, the maximum is 999 seconds.

Phone numbers should be formatted with a '+' and country code e.g., +16175551212 (E.164 format).

### <a name="appEvents"></a>Application Events

- `outgoingCall` Event - Triggered when Twilio connects an outgoing call placed with `makeCall`. You typically
do not need to listen for this event; Instead, pass a onConnectCallback to the `makeCall` function.

#### Handling incoming calls

- <a name="incomingCallEvent"></a>`incomingCall` Event - Triggered when the Twilio middleware receives a voice request from Twilio.

### <a name="listIterator"></a>ListIterator

A ListIterator Object is returned when Twilio reponses may be large. For example, if one were to list
all subaccounts, the list might be relatively lengthy.  For these responses, Twilio returns 20 or so
items in the list and allows us to access the rest of the list with another API call.  To simplify this
process, any API call that would normally return a list returns a ListIterator Object instead.

The ListIterator Object has several properties and methods:

- `Page` - A property of the ListIterator that tells you which page is loaded at this time
- `NumPages` - The number of pages in the resultset
- `PageSize` - The number of results per page (this can be changed and the default is 20)
- `Results` - The array of results. If results are a list of accounts, this will be an array of Account
	Objects, if it's a list of applications, this will be an array of Application Objects, etc.
- `nextPage([cb])` - Requests that the next page of results be loaded. Callback is of the form `cb(err, li)`
- `prevPage([cb])` - Requests that the previous page of results be loaded.

## Testing

twilio-api uses nodeunit right now for testing. To test the package, run `npm test`
in the root directory of the repository.

**BEWARE:** Running the test suite *may* actually place calls and cause you to incur fees on your Twilio
account. Please look through the test suite before running it.

## Disclaimer

Blake Miner is not affliated with Twilio, Inc. in any way.
Use this software AT YOUR OWN RISK. See LICENSE for more details.