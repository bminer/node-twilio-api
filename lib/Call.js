var util = require('util'),
	EventEmitter = require('events').EventEmitter,
	Tag = require('./Tag');
function Call(app, Sid) {
	this._app = app;
	this.redirectURL = app.VoiceUrl;
	this.redirectMethod = app.VoiceMethod;
	for(var i in callInfo)
		this[i] = callInfo[i];
	this.twiml = new Tag('Response');
	this._cb = {}; //Indexed by callback ID
	this._cbID = 0;
	EventEmitter.call(this); //Make `this` a new EventEmitter
};
util.inherits(Call, EventEmitter); //Inherit all EventEmitter prototype methods
module.exports = Call;

function Gather() {
	this.twiml = new Tag("Gather");
};

//-- Call prototype
Call.prototype._handle = function(res) {
	res.statusCode = 200;
	res.setHeader('content-type', 'application/xml');
	res.setHeader('content-length', this.twiml.length);
	console.log("Twilio handled call", this.Sid, "with this TwiML:", this.twiml.toString() );
	res.end(this.twiml.toString() );
	this.twiml = new Tag('Response');
};
/* Uses the TwiML <Redirect> Verb to redirect call flow to your callback
	Useful espeically following a <Gather> Verb that might fall-through due to no input
*/
Call.prototype.cb = function(cb) {
	this._cb[this._cbID] = cb;
	this.redirect(this.redirectURL + "?cb=" + encodeURIComponent(this._cbID), this.redirectMethod);
	this._cbID++;
}
/* TwiML <Say> Verb */
function _say(rootTag, text, options) {
	if(options == null) options = {};
	if(text.length > 4000)
		throw new Error("You cannot say more than 4000 characters of text. This is a Twilio limitation.");
	var say = new Tag("Say");
	say.append(text)
		.setAttribute('voice', options.voice)
		.setAttribute('language', options.language)
		.setAttribute('loop', options.loop);
	rootTag.append(say);
}
/*TwiML <Play> Verb */
function _play(rootTag, audioURL, options) {
	if(options == null) options = {};
	var play = new Tag("Play");
	play.append(audioURL)
		.setAttribute('loop', options.loop);
	rootTag.append(play);
}
/* TwiML <Pause> Verb */
function _pause(rootTag, pauseDuration) {
	var pause = new Tag("Pause");
	pause.setAttribute('length', pauseDuration);
	rootTag.append(pause);
}
Call.prototype.say = function(text, options) {
	_say(this.twiml, text, options);
}
Call.prototype.play = function(audioURL, options) {
	_play(this.twiml, audioURL, options);
}
Call.prototype.pause = function(pauseDuration) {
	_pause(this.twiml, pauseDuration);
}
/* TwiML <Gather> Verb
	Gathers input from the telephone user's keypad.
	Calls `cbIfInput` if input is provided.
	Options include:
		-timeout
		-finishOnKey
		-numDigits
	If no input was provided by the user, a couple of things may happen:
		-If cbIfNoInput was set, call `cbIfNoInput`;
		-Otherwise, proceed to the next TwiML instruction
*/
Call.prototype.gather = function(cbIfInput, options, cbIfNoInput) {
	if(typeof options == "function") {
		cbIfNoInput = options;
		options = null;
	}
	if(options == null) options = {};
	this._cb[this._cbID] = cbIfInput;
	var gather = new Gather();
	gather
		.setAttribute('action', this.redirectURL + "?cb=" + encodeURIComponent(this._cbID) )
		.setAttribute('method', this.redirectMethod)
		.setAttribute('timeout', options.timeout)
		.setAttribute('finishOnKey', options.finishOnKey)
		.setAttribute('numDigits', options.numDigits);
	this.twiml.append(gather.twiml);
	this._cbID++;
	if(typeof cbIfNoInput == "function")
		this.cb(cbIfNoInput);
	return gather;
}
/* TODO: TwiML <Record> Verb */
Call.prototype.record = function() {
}
/* TODO: TwiML <Sms> Verb */
Call.prototype.sms = function() {
}
/* TwiML <Dial> Verb
Dials the specified callees and calls cbAfterDial when the callee hangs up or dial fails.
`callees` can be:
	-Phone number - a string in E.164 format
	-Phone number - object with properties:
		-number - in E.164 format
		-sendDigits
		-CAUTION: The `url` option is not implemented, and will likely not be implemented.
			You can achieve this functionality by briding calls using conferences.
			See call.bridge(...)
	-Twilio Client ID - an object with properties:
		-client - the Twilio Client name
	-Conference - an object with properties:
		-name
		-muted
		-beep
		-startConferenceOnEnter
		-startConferenceOnExit
		-waitURL - waitURL and waitMethod may point to an audio file to <Play> or a TwiML document
			that uses <Play> or <Say> for content
		-waitMethod - be sure to use GET if requesting audio files (so caching works)
		-maxParticipants
	-An array of any of these
`options` include:
	-timeout - How long to wait for callee to answer (defaults to 30 seconds)
	-hangupOnStar - (defaults to false)
	-timeLimit - maximum duration of the call (defaults to 4 hours)
	-callerID (a valid phone number or client identifier, if calling a Twilio Client only)
If you specify `cbAfterDial`, it will be called when the dialed user
*/
Call.prototype.dial = function(callees, options, cbAfterDial) {
	if(typeof options == "function") {
		cbAfterDial = options;
		options = null;
	}
	if(options == null) options = {};
	this._cb[this._cbID] = cbAfterDial;
	var dial = new Tag("Dial");
	dial
		.setAttribute('action', this.redirectURL + "?cb=" + encodeURIComponent(this._cbID) )
		.setAttribute('method', this.redirectMethod)
		.setAttribute('timeout', options.timeout)
		.setAttribute('hangupOnStar', options.hangupOnStar)
		.setAttribute('timeLimit', options.timeLimit)
		.setAttribute('callerId', options.callerId);
	if(!(callees instanceof Array) )
		callees = [callees];
	var noun;
	for(var i in callees)
	{
		if(typeof callees[i] == "object")
		{
			if(callees[i].number)
			{
				noun = new Tag("Number");
				noun.append(callees[i].number)
					.setAttribute("sendDigits", callees[i].sendDigits);
				dial.append(noun);
			}
			else if(callees[i].client)
			{
				noun = new Tag("Client");
				client.append(callees[i].client);
				dial.append(noun);
			}
			else if(callees[i].name)
			{
				//Assume this is a conference
				noun = new Tag("Conference");
				noun.append(callees[i].name)
					.setAttribute("muted", callees[i].muted)
					.setAttribute("beep", callees[i].beep)
					.setAttribute("startConferenceOnEnter", callees[i].startConferenceOnEnter)
					.setAttribute("endConferenceOnExit", callees[i].endConferenceOnExit)
					.setAttribute("waitUrl", callees[i].waitUrl)
					.setAttribute("waitMethod", callees[i].waitMethod)
					.setAttribute("maxParticipants", callees[i].maxParticipants);
				dial.append(noun);
			}
		}
		else if(typeof callees[i] == "string")
		{
			noun = new Tag("Number");
			noun.append(callees[i]);
			dial.append(noun);
		}
	}
	this.twiml.append(dial);
	this.twiml._done = true; //No more TwiML should be added
	this._cbID++;
}
/* TwiML <Hangup> Verb */
Call.prototype.hangup = function() {
	this.twiml.append(new Tag("Hangup") );
	this.twiml._done = true; //No more TwiML should be added
}
/* TwiML <Redirect> Verb
	Useful for redirecting calls to another Twilio application
*/
Call.prototype.redirect = function(url, method) {
	
	var redirect = new Tag("Redirect");
	redirect.append(url)
		.setAttribute('method', method);
	this.twiml.append(redirect);
	this.twiml._done = true; //No more TwiML should be added
}
/* TwiML <Reject> Verb
	Rejects a call without incurring any fees.
	This MUST be the first item in your TwiML and is only valid for
	incoming calls.
*/
Call.prototype.reject = function(reason) {
	if(this.twiml.content != undefined)
		throw new Error("The reject instruction must be the first instruction.");
	var reject = new Tag("Reject");
	if(reason == "rejected" || reason == "busy")
		reject.setAttribute('reason', reason);
	this.twiml.append(reject);
	this.twiml._done = true; //No more TwiML should be added
}

//-- Gather prototype
Gather.prototype.say = function(text, options) {
	_say(this.twiml, text, options);
}
Gather.prototype.play = function(audioURL, options) {
	_play(this.twiml, audioURL, options);
}
Gather.prototype.pause = function(pauseDuration) {
	_pause(this.twiml, pauseDuration);
}
/*

Place a call to #1
	User picks up
		Play "greeting.mp3"
		Say "Press 1 for sales, 2 for tech support"
		Gather input, action="...", method="...", timeout="...", finishOnKey="...", numDigits="..."
			Can also Say, Play, and Pause here...
			If input == 1 Then
				Dial Sales Dept...
			If input == 2 Then
				Dial tech support
			Else
				Repeat Gather
		--- fall-through is possible if timeout expires ---
		...
twapp.makeCall(..., ..., function(call) {
	call.on('answered', function() {
		call.play(...);
		function afterGather() {
			
		}
		function gather () {
			call.gather(..., afterGather).say("Press 1 for...");
			call.say("You dummy.  Timeout expired!");
			call.redirect(gather);
		}
		gather();
	});
	call.on('ended', function() {
		//...
	});
});

*/