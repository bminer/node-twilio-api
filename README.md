# node-twilio-api

A high-level Twilio helper library to make Twilio API requests, handle incoming requests, and generate TwiML

Also ships with Connect/Express middleware to handle incoming Twilio requests.

## Install

This project is in an alpha stage. You cannot install it. You should not even use it!

## Usage

```javascript
var express = require('express'),
	app = express.createServer();
var twilio = require('twilio-api'),
	twapp = new twilio.App(ACCOUNT_SID, AUTH_TOKEN, APP_SID);
twapp.
app.use(twilio.middleware() );
```

## API Overview

	- [Applications](#applications)

### <a name="applications"></a>Applications

### twilio.createApp(...)

Creates an application
