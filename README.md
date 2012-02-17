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
 - Place calls
 	- `Application.makeCall`
 - Receive calls
 	- `Application` incomingCall Event
 - Generate TwiML responses without writing any XML - I am a XML hater.

## Todo

 - List and manage valid outgoing phone numbers
 - List and provision incoming phone numbers
 - Support for Twilio Connect Applications
 - List and manage conferences, conference details, and participants
 - Send/receive SMS messages
	 - List SMS short codes and details
 - Access recordings, transcriptions, and notifications
 - Respond to fallback URLs

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
//... more sample code coming soon...
//For now, check the /tests folder
```

#### <a name="createClient"></a>Create Twilio client

Easy enough...

```javascript
var twilioAPI = require('twilio-api');
var cli = new twilioAPI.Client(AccountSid, AuthToken);
```

#### <a name="middleware"></a>Create Express middleware

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

#### <a name="manageAccts"></a>Manage accounts and subaccounts

	- `Client.account`
		the main Account Object
	- `Client.getAccount(Sid, cb)` - Get an Account by Sid. The Account Object is passed to the callback `cb(err, account)`
 	- `Client.createSubAccount([FriendlyName,] cb)` Create a subaccount, where callback is `cb(err, account)`
 	- `Client.listAccounts(cb)` - List accounts and subaccounts, where callback is `cb(err, li)` and `li` is a ListIterator Object.
 	- `Account.load([cb])` - Load the Account details from Twilio
 	- `Account.save([cb])` - Save the Account details to Twilio
 	- `Account.closeAccount([cb])` - Permanently close this account
 	- `Account.suspendAccount([cb])` - Suspend this account
 	- `Account.activateAccount([cb])` - Re-activate a suspended account

#### <a name="listNumbers"></a>List available local and toll-free numbers

	- `Account.listAvailableLocalNumbers(countryCode, [filters,] cb)` - List available local telephone
	numbers in your `countryCode` available for provisioning using the provided `filters` Object.
	See Twilio's documentation for what filters you can apply. `cb(err, li)` where `li` is a ListIterator.
	- `Account.listAvailableTollFreeNumbers(countryCode, [filters,] cb)` - List available toll-free
	numbers in your `countryCode` available for provision using the provided `filters` Object.
	See Twilio's documentation for what filters you can apply. `cb(err, li)` where `li` is a ListIterator.

#### <a name="applications"></a>Applications

	- `Account.getApplication`
 	- `Account.createApplication`
 	- `Account.listApplications`
 	- `Application.load`
 	- `Application.save`
 	- `Application.delete`
	- `Application.register`

A valid application must have a VoiceUrl, VoiceMethod, StatusCallback, StatusCallbackMethod,
SmsUrl, SmsMethod, and SmsStatusCallback.  Fallback URLs are ignored at this time.

## twilio.Application

### twapp.makeCall(from, to, options[, onConnectCallback])

*from* - The phone number or client identifier to use as the caller id. If using a phone number, it must be a Twilio number or a Verified outgoing caller id for your account
*to* - The phone number or client identifier to call.
*options* - An object containing any additional options
	- sendDigits - A string of keys to dial after connecting to the number. Valid digits in the string include: any digit (0-9), '#', '*' and 'w' (to insert a half second pause).
	- ifMachine - Tell Twilio to try and determine if a machine (like voicemail) or a human has answered the call. Possible values are 'Continue', 'Hangup', and null (the default).
	- timeout - The integer number of seconds that Twilio should allow the phone to ring before assuming there is no answer. Default is 60 seconds, the maximum is 999 seconds.

Phone numbers should be formatted with a '+' and country code e.g., +16175551212 (E.164 format).

### voiceRequest Event

Triggered when Twilio contacts this server and requests a TwiML response. This event will be triggered for incoming and outgoing calls.

### outgoingCall Event

Triggered when Twilio connects an outgoing call placed with `makeCall`. You typically do not need to
listen for this event; Instead, pass a onConnectCallback to the `makeCall` function.

### incomingCall Event

Triggered when the Twilio

### twapp.middleware()

Returns Connect/Express middleware that handles any request to VoiceURL, StatusCallback,
SmsUrl, or SmsStatusCallback using the appropriate GET/POST methods for each.

## Disclaimer

Blake Miner is not affliated with Twilio, Inc. in any way.
Use this software AT YOUR OWN RISK. See LICENSE for more details.
