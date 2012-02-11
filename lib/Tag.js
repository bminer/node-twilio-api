var Tag = module.exports = function Tag(name) {
	this.name = name;
	this.attributes = {};
};
Tag.prototype.render = function(excludeXMLDecl) {
	var str = '';
	if(excludeXMLDecl !== true)
		str = '<?xml version="1.0" encoding="UTF-8"?>';
	str += '<' + this.name;
	for(var i in this.attributes)
		str += " " + i + '="' + escape(this.attributes[i]) + '"';
	if(typeof this.content == "string")
		str += ">" + escape(this.content) + "</" + this.name + ">";
	else if(this.content instanceof Array)
	{
		str += ">";
		for(var i in this.content)
		{
			if(typeof this.content[i] == "string")
				str += this.content[i];
			else if(this.content[i] instanceof Tag)
				str += this.content[i].render(true);
		}
		str += "</" + this.name + ">";
	}
	else
		str += "/>";
	return str;
}
Tag.prototype.toString = Tag.prototype.render;
Tag.prototype.setAttribute = function(name, value) {
	if(name != null && value != null)
		this.attributes[name] = value;
	return this;
}
Tag.prototype.append = function(content) {
	if(this.content == undefined)
		this.content = [];
	this.content.push(content);
	return this;
}
function escape(html) {
  return String(html)
    .replace(/&(?!\w+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};