
require(["dojo/_base/json","dojo/window", "dojo/dom", "dojo/dom-style", "dojo/dom-construct", "dojo/_base/connect", "dojox/charting/Chart", "dojox/charting/axis2d/Default","dojox/charting/plot2d/Columns", "dojox/charting/themes/Shrooms", "dojo/_base/xhr", "dojox/charting/action2d/Tooltip", "dojox/charting/action2d/Shake","dojox/charting/widget/Legend", "dojo/data/ItemFileReadStore", "dijit/form/ComboBox", "dijit/form/ValidationTextBox", "dijit/form/Form", "dijit/form/Button", "dojox/validate/web", "dojox/gfx/utils", "dojo/cookie", "dojox/widget/Wizard","dijit/layout/ContentPane","dijit/Dialog", "dojo/date", "dojo/domReady!"], 
	function(dojo, win, dom, style, domConstruct, connect, Chart, Default, Columns, shrooms, xhr, tooltip, shake, legend, ItemFileReadStore, cBox, VTB, Form, Button, validate, gfx, date){
	    var left_box = dom.byId("left_div");
	    domConstruct.create("div", { id: "map_div" }, left_box);
	    var chart1 = new Chart("chart_div", { title: "Twitter Disease Trend (past 24 hours)"});
	    chart1.addPlot("default", {
		type: "Columns",
		gap: 2
	    });
/*
	    chart1.connectToPlot("default", function(evt){
		var term = evt.x, type = evt.type;
		if (type == "onclick"){
		    drawTimeline(term);
		}
	    });
*/
	    chart1.setTheme(shrooms);
	    chart1.addAxis("x", {minorTicks: false, microTicks: false});
	    chart1.addAxis("y", {vertical: true, min: 0});
	    chart1.addSeries("Series 1", [0,0,0,0,0]);
	    chart1.addSeries("Series 2", [0,0,0,0,0]);
	    chart1.addSeries("Series 3", [0,0,0,0,0]);
	    chart1.addSeries("Series 4", [0,0,0,0,0]);
	    chart1.addSeries("Series 5", [0,0,0,0,0]);
	    chart1.render();
	    //var legend1 = new legend({chart: chart1}, "legend1");
	    var tip = new tooltip(chart1, "default");
	    var shake = new shake(chart1, "default");
            var map = undefined;
	    var distWidget = undefined;
	    var topFive = undefined;
	    var rect = undefined;
	    var cir = undefined;
	    var geomtype = undefined;
	    var fileLink = "";
	    var pickName = "";
	    var drawing = false;
	    var circle = false;
	    var dragging = false;
	    var svg = undefined;
	    function getIEver(){
		var rv = -1;
		if (navigator.appName == "Microsoft Internet Explorer")
		{
		    var ua = navigator.userAgent;
		    var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
		    if (re.exec(ua) != null)
			rv = parseFloat( RegExp.$1 );
		}
		return rv;
	    }
	    if (navigator.appName == "Microsoft Internet Explorer" && getIEver() <= 8.0){
		
	    } else {
		var nameStore = new ItemFileReadStore({
		    url: "names.json"
		});
		var select = new cBox({
		    name: "areaInput",
		    placeHolder: "Enter a city name to search",
		    store: nameStore,
		    pageSize: 10,
		    onChange: function(value){
			pickName = value;
			search();
		    }
		}, "areaInput");
		select.startup();
	    }
	    var form1 = new Form({
		id: "form1"
	    }, "form1");
	    var validator = new VTB({
		id: "email",
		validator: validate.isEmailAddress,
		invalidMessage: "Invalid Email address",
		missingMessage: "Email address is empty"
	    }, "email");
	    var subButton = new Button({
		id: "sendEmail",
		label: "Send",
		type: "button"
	    }, "submit");
	    
	    
	    var indicator = new Spinner({
		lines: 12,
		length: 15,
		width: 4,
		radius: 10,
		color: '#000',
		speed: 1,
		trail: 60,
		shadow: true
	    });
	    var type;
	    var geom;
	    
	    function resizeDivs(){
		var vs = win.getBox();
		var content_height = style.get(dom.byId("outer"),"height") - 120;
		//var left_box = dom.byId("left_div");
		//style.set(left_box, "width", (vs.w/2 -15) + "px");
		style.set(left_box, "height", Math.ceil(content_height * .6) + "px");
		//dom.byId("header").innerHTML = (vs.w/2 - 10) + "px";
		var right_box = dom.byId("right_div");
		//style.set(right_box, "width", (vs.w/2 -15) + "px");
		style.set(right_box, "height", (content_height - style.get(left_box, "height")) + "px");
		var data_div = dom.byId("data_div");
		style.set(data_div, "height", style.get(right_box, "height") + "px");
		//style.set(data_div, "left", style.get(right_box, "left") + style.get(right_box, "width") + "px");
		//style.set(data_div, "top", style.get(right_box, "top") + "px");
		var map_div = dom.byId("map_div");
		var left = (style.get(left_box, "left") + 10);
		style.set(map_div, "left", left + "px");
		var top = (style.get(left_box, "top") + 10);
		style.set(map_div, "top", top + "px");
		var w = (style.get(left_box, "width") - 20);
		style.set(map_div, "width", w + "px");
		var h = (style.get(left_box, "height") - 20);
		style.set(map_div, "height", h + "px");
		style.set(map_div, "opacity", 1.0);
		var b1top = h;
		var circleb = dom.byId("circleb");
		var rectb = dom.byId("rectb");
		style.set(circleb, "top", (b1top - 40) + "px");
		style.set(rectb, "top", b1top + "px");
		style.set(circleb, "left", "40px");
		style.set(rectb, "left", "40px");
		var chart_div = dom.byId("chart_div");
		var info_div = dom.byId("info");
		left = (style.get(right_box, "left") + 10) + "px";
		style.set(chart_div, "left", left);
		top = (style.get(right_box, "top") + 10) + "px";
		style.set(chart_div, "top", top);
		w = (style.get(right_box, "width") - 20) + "px";
		style.set(chart_div, "width", w);
		style.set(info_div, "width", w);
		h = (style.get(right_box, "height") - 20) + "px";
		style.set(chart_div, "height", h);
		style.set(info_div, "height", h);
		resizeChart();
	    }
	    
	    function resizeChart(){
		var chart_div = dom.byId("chart_div");
		var timeline = dom.byId("timeline");
		var w = style.get(chart_div, "width");
		var h = style.get(chart_div, "height");
		chart1.resize(w,h);
		w = style.get(timeline, "width");
		h = style.get(timeline, "height");
		//chart2.resize(w,h);
	    }
	    
	    function search(){
		if (pickName === "" || pickName === " "){
		    return;
		}
		xhr.post({
		    url: "../cgi-bin/search.cgi",
		    content: {"name": pickName},
		    handleAs: "json",
		    load: function(result){
			var tmpll = new google.maps.LatLng(result.lat, result.lng);
			//distWidget.set('position', tmpll);
			map.setCenter(tmpll);
			if (tmpll.locale == "city"){
			    map.setZoom(9); 
			}else{
			    map.setZoom(6);
			}
		    },
		    error: function(){
			
			alert("Search location not found");
		    }
		});
	    }
	    
	    function drawChart(){
		clearChart();
		var west = 0;
		var south = 0;
		var east = 0;
		var north = 0;
		var radius = 0;
		geom = {};
		if (geomtype === "circle"){
		    if (cir.getCenter() && cir.getRadius()){
			type = "circle";
			west = cir.getCenter().lng();
			south = cir.getCenter().lat();
			radius = cir.getRadius();
			geom = {"lon": west, "lat": south, "radius": radius};
		    } else {
			alert("No area selected");
			return;
		    }
		} else {
		    if (rect.getBounds()) {
			type = "rectangle";
			west = rect.getBounds().getSouthWest().lng();
			south = rect.getBounds().getSouthWest().lat();
			east = rect.getBounds().getNorthEast().lng();
			north = rect.getBounds().getNorthEast().lat();
			geom = {"west": west, "south": south, "east": east, "north": north};
		    } else {
			alert("No area selected");
			return;
		    }
		}
		//console.log(type);
		//console.log(geom);
		var info = dom.byId("info");
		var spinner = dom.byId("spinner");
		var info_text = dom.byId("info_text");
		var wizard = dom.byId("wizardDialog");
		//info.removeChild(wizard);
		//info.removeChild(info_text);
		//info.appendChild(spinner);
		style.set(info, "display", "block");
		style.set(info_text, "display", "none");
		style.set(wizard, "display", "none");
		style.set(spinner, "display", "block");
		indicator.spin(spinner);
		xhr.get({
		    url: "../cgi-bin/search.cgi",
		    content: {"type": type, "geom": dojo.toJson(geom)},
		    handleAs: "json",
		    load: function(result){
			// { "a" : { "name" : name, "value" : value}, "b" : ... "e" : { ... }}
			if (result.a.value == 0) { 
			    indicator.stop();
			    style.set(spinner, "display", "none");
			    style.set(info_text, "display", "block");
			    //info.removeChild(spinner);
			    //info.appendChild(info_text);
			    return;
			}
			chart1.addAxis("x", {minorTicks: false, microTicks: false,
					     labels: [{value: 1, text: result.a.name}, 
						      {value: 2, text: result.b.value!=0?result.b.name:""}, 
						      {value: 3, text: result.c.value!=0?result.c.name:""}, 
						      {value: 4, text: result.d.value!=0?result.d.name:""}, 
						      {value: 5, text: result.e.value!=0?result.e.name:""}],					     
					     font: "normal normal normal 1.5em Georgia, serif, arial",
					     title: "Top 5 trends",
					     titleOrientation: "away",
					     titleFont: "normal normal bold 1.5em Georgia, serif, arial",
					     offset: 20,
					     htmlLabels: true
					    });
			chart1.addAxis("y", {vertical: true, title:"Tweet count", titleFont: "normal normal bold 1.5em Georgia, serif, arial", htmlLabels: true });
			topFive = result;
			//console.log(result);
			chart1.updateSeries("Series 1", [result.a.value,0,0,0,0]);//, {stroke:"red"});
			chart1.updateSeries("Series 2", [0,result.b.value,0,0,0]);//, {stroke:"orange"});
			chart1.updateSeries("Series 3", [0,0,result.c.value,0,0]);//, {stroke:"yellow"});
			chart1.updateSeries("Series 4", [0,0,0,result.d.value,0]);//, {stroke:"green"});
			chart1.updateSeries("Series 5", [0,0,0,0,result.e.value]);//, {stroke:"blue"});
			chart1.render();
			indicator.stop();
			//info.removeChild(spinner);
			style.set(spinner, "display", "none");
			style.set(info, "display", "none");
			//update download link
			fileLink = result.file;
			dom.byId("filelink").value= fileLink;
		    },
		    error: function(){
			alert("DrawChart(): an error has occured");
		    }
		});
	    }
	    
	    function chartToSvg(){
		var svg1;
		gfx.toSvg(chart1.surface).then(
		    function(svg){
			svg1 = svg;
		    },
		    function(error){
			alert("Error occured: " + error);
		    }
		);
		return svg1;
	    }
	    
	    function clearChart(){
		chart1.addAxis("x", {minorTicks: false, microTicks: false});
		chart1.addAxis("y", {vertical: true, min:0});
		chart1.updateSeries("Series 1", [0,0,0,0,0]);
		chart1.updateSeries("Series 2", [0,0,0,0,0]);
		chart1.updateSeries("Series 3", [0,0,0,0,0]);
		chart1.updateSeries("Series 4", [0,0,0,0,0]);
		chart1.updateSeries("Series 5", [0,0,0,0,0]);
		chart1.render();
	    }
	    
	    function sendEmail(){
		if (geomtype === "circle"){
		    if (cir.getCenter() && cir.getRadius()){
		    } else {
			alert("No area selected");
			return;
		    }
		} else {
		    if (rect.getBounds()) {
		    } else {
			alert("No area selected");
			return;
		    }
		}
		if (validator.isValid()){ 
		    if (fileLink != ""){
			xhr.post({
			    url: "../cgi-bin/mailer.cgi",
			    content: {"email": validator.get('value'), "csv": fileLink},
			    handleAs: "json",
			    load: function(result){
				
			    },
			    error: function(error){
			    }
			});
			document.getElementById("mailsent").style.display = "block";
			setTimeout(delayHideMessage, 2000);
		    } else {
			alert("Please click 'Draw Chart' first");
		    }
		} else {
		    alert("Not a valid Email address");
		}
		
	    }
	    
	    
	    function initMap(){
		var latlng = new google.maps.LatLng(42.520826,-92.440745);
		var opts = {
		    zoom: 8,
		    minZoom: 2,
		    center: latlng,
		    mapTypeId: google.maps.MapTypeId.HYBRID
		};
		var sw = new google.maps.LatLng(20.891050, -133.706080);
		var ne = new google.maps.LatLng(52.570612, -60.712916);
		var bounds = new google.maps.LatLngBounds(sw, ne);
		map = new google.maps.Map(document.getElementById("map_div"), opts);
		map.fitBounds(bounds);
		//distWidget = new DistanceWidget(map);
		//distWidget.set('visible', false);
		var wlng = google.maps.geometry.spherical.computeOffset(latlng, 50000, 270).lng();
		var elng = google.maps.geometry.spherical.computeOffset(latlng, 50000, 90).lng();
		var nlat = google.maps.geometry.spherical.computeOffset(latlng, 50000, 0).lat();
		var slat = google.maps.geometry.spherical.computeOffset(latlng, 50000, 180).lat();
		sw = new google.maps.LatLng(slat,wlng);
		ne = new google.maps.LatLng(nlat,elng);
		bounds = new google.maps.LatLngBounds(sw,ne);
		rect = new google.maps.Rectangle({
		    map: map,
		    clickable: false,
		    visible: false
		});
		cir = new google.maps.Circle({
		    map: map,
		    clickable: false,
		    visible: false
		});
		
		google.maps.event.addListener(cir, 'radius_changed', function(){
		    //update radius display
		    //cir.set('title', Math.round(cir.getRadius())+" km");
		});
		google.maps.event.addListener(map, 'mousedown', function(mEvent){
		    if (drawing){
			map.draggable = false;
			latlng1 = mEvent.latLng;
			dragging = true;
			pos1 = mEvent.pixel;
		    }
		    if (circle){
			map.draggable = false;
			latlng1 = mEvent.latLng;
			dragging = true;
			pos1 = mEvent.pixel;
		    }
		});
		google.maps.event.addListener(map, 'mousemove', function(mEvent){
		    if (drawing){
			if (dragging) {
				disableMovement(true);
			    latlng2 = mEvent.latLng;
			    drawRect();
			}
		    }
		    if (circle){
			if (dragging) {
				disableMovement(false);
			    latlng2 = mEvent.latLng;
			    drawCircle();
			}
		    }
		});
		google.maps.event.addListener(map, 'mouseup', function(data){
		    if (drawing){
			map.draggable = true;
			dragging = false;
		    }
		    if (circle){
			map.draggable = true;
			dragging = false;
		    }
		});
	    }
	    
	    function drawRect(){
		if (dragging){
		    if (rect === undefined) {
			rect = new google.maps.Rectangle({
			    map: map,
			    clickable: false
			});
		    }
		    var lat1 = latlng1.lat();
		    var lat2 = latlng2.lat();
		    var minLat = lat1<lat2?lat1:lat2;
		    var maxLat = lat1<lat2?lat2:lat1;
		    var lng1 = latlng1.lng();
		    var lng2 = latlng2.lng();
		    var minLng = lng1<lng2?lng1:lng2;
		    var maxLng = lng1<lng2?lng2:lng1;
		    var sw = new google.maps.LatLng(minLat,minLng);
		    var ne = new google.maps.LatLng(maxLat,maxLng);
		    rect.setVisible(true);
		    var latLngBounds = new google.maps.LatLngBounds(sw,ne);
		    rect.setBounds(latLngBounds);
		}
	    }
	    
	    function drawCircle(){
		if (dragging){
		    var center = latlng1;
		    var point = latlng2;
		    var radius = google.maps.geometry.spherical.computeDistanceBetween(center,point);
		    cir.setCenter(center);
		    cir.setRadius(radius);
		    cir.setVisible(true);
		}
	    }
	    
	    function calculateBox(rectangle, newCenter){
		var bounds = rectangle.getBounds();
		var center = bounds.getCenter();
		var ne = bounds.getNorthEast();
		var sw = bounds.getSouthWest();
		var offset = google.maps.geometry.spherical.computeDistanceBetween(center, newCenter);
		var heading = google.maps.geometry.spherical.computeHeading(center, newCenter);
		var newne = google.maps.geometry.spherical.computeOffset(ne, offset, heading);
		var newsw = google.maps.geometry.spherical.computeOffset(sw, offset, heading);
		var newbounds = new google.maps.LatLngBounds(newsw, newne);
		rectangle.setBounds(newbounds);
	    }

		function disableMovement(disable) {
			var mapOptions;
			if (disable) {
				mapOptions = {
					draggable: false,
					disableDoubleClickZoom: true
				};
			} else {
				mapOptions = {
					draggable: true,
					disableDoubleClickZoom: false
				};
			}
			map.setOptions(mapOptions);
		}
	    
	    function download(){
		var ifrm = dom.byId("dl");
		if (fileLink != ""){
		    ifrm.src = "/dl/"+ fileLink;
		} else {
		    alert("Please make a selection\nand click 'Draw Chart' first");
		}
	    }
	    
	    function delayHideMessage(){
		document.getElementById("mailsent").style.display = "none";
		return;
            }				    
	    
	    function toggleBox(){
		var sq = dom.byId("rectb");
		var circ = dom.byId("circleb");
		if (drawing) {
		    drawing = false;
		    style.set(sq, "backgroundImage", "url('images/square-up.png')");
		    rect.set("visible", false);
		} else {
		    drawing = true;
		    geomtype = "rectangle";
		    circle = false;
		    style.set(sq, "backgroundImage", "url('images/square-down.png')");
		    style.set(circ, "backgroundImage", "url('images/circle-up.png')");
		    rect.set("visible", true);
		    cir.setVisible(false);
		}
	    }
	    function toggleCircle(){
		var sq = dom.byId("rectb");
		var circ = dom.byId("circleb");
		if (circle) {
		    circle = false;
		    style.set(circ, "backgroundImage", "url('images/circle-up.png')");
		    cir.setVisible(false);
		} else {
		    circle = true;
		    drawing = false;
		    geomtype = "circle";
		    style.set(sq, "backgroundImage", "url('images/square-up.png')");
		    style.set(circ, "backgroundImage", "url('images/circle-down.png')");
		    rect.set('visible', false);
		    cir.setVisible(true);
		}
	    }
	    
	    
	    initMap();
	    resizeDivs();
	    style.set(dom.byId("splash"), "display", "none");
	    connect.connect(dom.byId("circleb"), "onclick", toggleCircle);
	    connect.connect(dom.byId("rectb"), "onclick", toggleBox);
	    //	connect.connect(dom.byId("areaInput"), "onkeypress", textPrediction);
	connect.connect(dom.byId("search"), "onclick", search);
	    connect.connect(dom.byId("draw"), "onclick", drawChart);
	    connect.connect(dom.byId("download"), "onclick", download);
	    connect.connect(dom.byId("sendEmail"), "onclick", sendEmail);
	    //	connect.connect(don.byId("areaInput"), 
	    connect.connect(window, "onresize", resizeDivs);
	    
	});


