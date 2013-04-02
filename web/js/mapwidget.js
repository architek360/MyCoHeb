function MapWidget(map_div, opts){
	var options = opts || {};
	this.set('opts?', options);
	var map = new google.maps.Map(map_div, options);
	map.bindTo('opts?', this);
	this.set('map', map);
	//
	google.maps.event.addDomListener(window, 'load', init);
	//
}
MapWidget.prototype = new google.maps.MVCObject();
