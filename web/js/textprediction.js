/**
 * Text prediction and autocomplete 
 *
 * @param {text area} input The text area that will be used
 *
 * Dependencies: google maps, dojo/_base/xhr
 */

function TextPrediction(input) {

	this.set('textArea', input);
	this.bindTo('width', input.style.width);
	
	
}
TextPrediction.prototype = new google.maps.MVCObject();

TextPrediction.prototype.getSuggestions = function() {
	xhr.post
};
