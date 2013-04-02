function BoxWidget(map){
	this.set('map', map);
	this.set('position', map.getCenter());

	var img = new google.maps.MarkerImage(
        'images/marker-images/twitimg.png',
        new google.maps.Size(32,32),
        new google.maps.Point(0,0),
        new google.maps.Point(16,32)
    );

    var shad = new google.maps.MarkerImage(
        'images/marker-images/twitshd.png',
        new google.maps.Size(52,32),
        new google.maps.Point(0,0),
        new google.maps.Point(16,32)
    );

    var shp = {
	    coord: [23,5,23,6,22,7,24,8,25,9,26,10,27,11,31,12,31,13,30,14,31,15,29,16,27,17,27,18,26,19,26,20,25,21,24,22,23,23,21,24,19,25,18,26,7,26,6,25,4,24,3,23,1,22,1,21,0,20,9,19,9,18,8,17,7,16,7,15,7,14,6,13,5,12,6,11,5,10,5,9,5,8,18,7,19,6,19,5,23,5],
		type: 'poly'
    };


    var marker = new google.maps.Marker({
        draggable: true,
        icon: img,
        shadow: shad,
        shape: shp,
        title: 'Drag to select center'
    });

	marker.bindTo('map', this);
	marker.bindTo('position', this);
	var rectWidget = new RectWidget();
	rectWidget.bindTo('map', this);
	rectWidget.bindTo('center', this, 'position');
	this.bindTo('height', rectWidget);
	this.bindTo('width', rectWidget);
	this.bindTo('bounds', rectWidget);
	this.bindTo('title', rectWidget);
}
BoxWidget.prototype = new google.maps.MVCObject();

function RectWidget(){
    var rect = new google.maps.Rectangle({
        strokeWeight: 2
    });

    rect.bindTo('visible', this);
    this.set('height', 50000);
    this.set('width', 50000);
    rect.bindTo('bounds', this);
    rect.bindTo('map', this);
    this.computeBounds();
}
RectWidget.prototype = new google.maps.MVCObject();

RectWidget.prototype.bounds_changed = function() {
    var bounds = this.get('bounds');
    if (bounds) {
        var sw = bounds.getSouthWest();
        var ne = bounds.getNorthEast();
        var nw = new google.maps.LatLng(ne.lat(),sw.lng());
        var w = google.maps.geometry.spherical.computeDistanceBetween(nw,ne);
        var h = google.maps.geometry.spherical.computeDistanceBetween(nw,sw);
        this.set('width',w);
        this.set('height',h);
    }
};

RectWidget.prototype.computeBounds = function() {
    var h = this.get('height');
    var w = this.get('width');
    var center = this.get('center');
    var wlng = google.maps.geometry.spherical.computeOffset(center, w, 270).lng();
    var elng = google.maps.geometry.spherical.computeOffset(center, w, 90).lng();
    var nlat = google.maps.geometry.spherical.computeOffset(center, h, 0).lat();
    var slat = google.maps.geometry.spherical.computeOffset(center, h, 180).lat();
    var sw = new google.maps.LatLng(slat,wlng);
    var ne = new google.maps.LatLng(nlat,elng);
    var bounds = new google.maps.LatLngBounds(sw,ne);
    this.set('bounds', bounds);
};

RectWidget.prototype.center_changed = function() {
    this.computeBounds();
}

RectWidget.prototype.setBounds = function() {
	
}
