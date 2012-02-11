var util = require('util');
function ListIterator(client, command, _class, filters) {
	this._client = client;
	this.command = command;
	this._class = _class;
	this.filters = filters;
	this.Page = 0;
	this.PageSize = 20;
}
module.exports = ListIterator;
ListIterator.prototype.nextPage = function(cb) {
	if(this.Page < this.NumPages)
	{
		this.Page++;
		this.load(cb);
	}
	cb(null, this);
}
ListIterator.prototype.load = function(cb) {
	var li = this;
	var data = {
		'Page': li.Page,
		'PageSize': li.PageSize
	};
	for(var i in li.filters)
		data[i] = li.filters[i];
	li._client._restAPI(li.command, data, 'GET', function(err, res) {
		if(err) return cb(err);
		for(var i in res.body)
			li[i] = res.body[i];
		//There's some pretty abstract shiz goin' on up in here!  WTF does it mean?
		for(var i in li[li.command])
		{
			//It means take the Objects and cast them into their class!
			var tmp = li[li.command][i];
			li._class.call(tmp, li._client, tmp.Sid);
			li[li.command][i] = tmp;
		}
		cb(null, li);
	});
};