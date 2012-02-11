Add voice and SMS messaging capabilities to your Node.JS applications with node-twilio-api!

# node-twilio-api

A high-level Twilio helper library to make Twilio API requests, handle incoming requests,
and generate TwiML.

Also ships with Connect/Express middleware to handle incoming Twilio requests.

**IMPORTANT**: You will need a Twilio account to get started (it's not free). [Click here to sign up for 
an account](https://www.twilio.com/try-twilio)

## Install

This project is in an alpha stage. You cannot install it. You should not even use it!

## Features

Only voice calls are supported at this time, but I plan to implement the entire Twilio API over
the next few months.

 - Place calls
 - Receive calls
 - Generate TwiML responses without writing any XML

## Usage

```javascript
var express = require('express'),
    app = express.createServer();
var twilioAPI = require('twilio-api'),
	twilio = new twilioAPI.Client(ACCOUNT_SID, AUTH_TOKEN);
twilio.function(err, twapp) {
	if(err) throw err;
	var from = "+15105555555", to = "+16175551212";
	twapp.makeCall(from, to, {
		'timeout': 40
	});
	app.use(twapp.middleware() );
});
```

## API Overview

 - [Applications](#applications)
 - [OutgoingCallerIds](#outgoing)
 - [IncomingPhoneNumbers](#incoming)

#### <a name="applications"></a>Applications

### twilio.createApp(...)

Creates an application

### twilio.loadApp([account_sid, auth_token,] app_sid, callback)

Loads an Application instance and returns it to the callback.
callback is of the form: callback(err, twapp) where twapp is the loaded twilio.Application instance

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

## Todo

 - Access recordings, transcriptions, and notifications
 - Send/receive SMS messages
 - Respond to fallback URLs
 - Create/get/update/delete account and subaccount information
 - Phone number provisioning
 - List valid outgoing phone numbers
 - Create/update/delete applications
 - Support for Twilio Connect Client
