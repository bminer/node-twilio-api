/** Loads data from Twilio and updates this Object.
	@param data - (optional) if set, these data will replace this Object; otherwise,
		a RESTful call to the Twilio API will be made to update this Object.
	@param cb - (optional) if set, the callback will be called when completed
	@return - If data is set, the updated Object will be returned; otherwise,
		the stale object will be returned.
*/
exports.globalLoad = function(data, cb) {
	var obj = this,
		command = obj._getResourceURI("load");
	if(typeof data == "function")
	{
		cb = data;
		data = undefined;
	}
	if(data)
	{
		for(var i in data)
			this[i] = data[i];
		if(cb) cb(null, this);
	}
	else if(cb)
	{
		obj._client._restAPI(command, 'GET', function(err, res) {
			if(err) return cb(err);
			obj.load(res.body, cb);
		});
	}
	return this;
}
/** Saves mutable object properties to Twilio
	@param cb - (optional) called when save completes `cb(err, obj)`
*/
exports.globalSave = function(cb) {
	var obj = this,
		command = obj._getResourceURI("save"),
		mut = obj.constructor.mutableProps,
		data = {};
	for(var i in mut)
		data[mut[i]] = obj[mut[i]];
	obj._client._restAPI(command, data, 'PUT', function(err, res) {
		if(err) {
			if(cb) cb(err);
			return;
		}
		obj.load(res.body, cb);
	});
}
/** Deletes the Object in Twilio
	@param cb - (optional) called when the delete completes `cb(err, success)`
*/
exports.globalDelete = function(cb) {
	var obj = this,
		command = obj._getResourceURI("delete");
	obj._client._restAPI(command, 'DELETE', function(err, res) {
		if(!err) obj._deleted = true;
		if(!cb) return;
		cb(err, err == null);
	});
}
/** Recursively convert all properties of the specified `obj` from
	'prop_like_this' to 'PropLikeThis'
	@param obj - object with property names separated by underscores
	@return obj with property names in CamelCase
*/
exports.underscoresToCamelCase = function underscoresToCamelCase(obj) {
	for(var i in obj)
	{
		if(typeof obj[i] == "object")
			underscoresToCamelCase(obj[i]);
		var newProp = i.split('_');
		for(var j in newProp)
			newProp[j] = newProp[j].charAt(0).toUpperCase() + newProp[j].substr(1);
		obj[newProp.join('')] = obj[i];
		if(!(obj instanceof Array) )
			delete obj[i];
	}
}