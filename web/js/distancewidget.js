      /**
       * A distance widget that will display a circle that can be resized and will
       * provide the radius in km.
       *
       * @param {google.maps.Map} map The map to attach to.
       *
       * @constructor
       */
      function DistanceWidget(map) {
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

        // Bind the marker map property to the DistanceWidget map property
        marker.bindTo('map', this);

        // Bind the marker position property to the DistanceWidget position
        // property
        marker.bindTo('position', this);

        // Create a new radius widget
        var radiusWidget = new RadiusWidget();

        // Bind the radiusWidget map to the DistanceWidget map
        radiusWidget.bindTo('map', this);

        // Bind the radiusWidget center to the DistanceWidget position
        radiusWidget.bindTo('center', this, 'position');

        // Bind to the radiusWidgets' distance property
        this.bindTo('distance', radiusWidget);

        // Bind to the radiusWidgets' bounds property
        this.bindTo('bounds', radiusWidget);
		this.bindTo('title', radiusWidget);
		this.bindTo('visible', radiusWidget);
      }
      DistanceWidget.prototype = new google.maps.MVCObject();



      /**
       * A radius widget that add a circle to a map and centers on a marker.
       *
       * @constructor
       */
      function RadiusWidget() {
        var circle = new google.maps.Circle({
          strokeWeight: 2
        });

        // Set the distance property value, default to 50km.
        this.set('distance', 50);

        // Bind the RadiusWidget bounds property to the circle bounds property.
        this.bindTo('bounds', circle);

		circle.bindTo('visible', this);

        // Bind the circle center to the RadiusWidget center property
        circle.bindTo('center', this);

        // Bind the circle map to the RadiusWidget map
        circle.bindTo('map', this);

        // Bind the circle radius property to the RadiusWidget radius property
        circle.bindTo('radius', this);

        // Add the sizer marker
        this.addSizer_();
      }
      RadiusWidget.prototype = new google.maps.MVCObject();


      /**
       * Update the radius when the distance has changed.
       */
      RadiusWidget.prototype.distance_changed = function() {
        this.set('radius', this.get('distance') * 1000);
      };


      /**
       * Add the sizer marker to the map.
       *
       * @private
       */
      RadiusWidget.prototype.addSizer_ = function() {
		var image = new google.maps.MarkerImage(
		  'images/marker-images/image.png',
		  new google.maps.Size(32,32),
		  new google.maps.Point(0,0),
		  new google.maps.Point(16,16)
		);
		var shadow = new google.maps.MarkerImage(
		  'images/marker-images/shadow.png',
		  new google.maps.Size(32,32),
		  new google.maps.Point(0,0),
		  new google.maps.Point(16,16)
		);
		var shape = {
		  coord: [24,8,25,9,26,10,27,11,28,12,29,13,30,14,31,15,31,16,31,17,30,18,29,19,27,20,27,21,25,22,24,23,7,23,6,22,5,21,4,20,3,19,2,18,1,17,0,16,0,15,0,14,2,13,2,12,4,11,5,10,6,9,7,8,24,8],
		  type: 'poly'
		};

        var sizer = new google.maps.Marker({
          draggable: true,
		  raiseOnDrag: false,
          title: "Drag to select radius",
		  icon: image,
		  shadow: shadow
        });
		
		
        sizer.bindTo('map', this);
        sizer.bindTo('position', this, 'sizer_position');
		sizer.bindTo('title', this);
		sizer.bindTo('visible', this);

        var me = this;
        google.maps.event.addListener(sizer, 'drag', function() {
          // Set the circle distance (radius)
          me.setDistance();
        });
      };


      /**
       * Update the center of the circle and position the sizer back on the line.
       *
       * Position is bound to the DistanceWidget so this is expected to change when
       * the position of the distance widget is changed.
       */
      RadiusWidget.prototype.center_changed = function() {
        var bounds = this.get('bounds');

        // Bounds might not always be set so check that it exists first.
        if (bounds) {
          var lng = bounds.getNorthEast().lng();

          // Put the sizer at center, right on the circle.
          var position = new google.maps.LatLng(this.get('center').lat(), lng);
          this.set('sizer_position', position);
        }
      };


      /**
       * Calculates the distance between two latlng points in km.
       * @see http://www.movable-type.co.uk/scripts/latlong.html
       *
       * @param {google.maps.LatLng} p1 The first lat lng point.
       * @param {google.maps.LatLng} p2 The second lat lng point.
       * @return {number} The distance between the two points in km.
       * @private
       */
      RadiusWidget.prototype.distanceBetweenPoints_ = function(p1, p2) {
        if (!p1 || !p2) {
          return 0;
        }

        var R = 6371; // Radius of the Earth in km
        var dLat = (p2.lat() - p1.lat()) * Math.PI / 180;
        var dLon = (p2.lng() - p1.lng()) * Math.PI / 180;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(p1.lat() * Math.PI / 180) * Math.cos(p2.lat() * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d;
      };


      /**
       * Set the distance of the circle based on the position of the sizer.
       */
      RadiusWidget.prototype.setDistance = function() {
        // As the sizer is being dragged, its position changes.  Because the
        // RadiusWidget's sizer_position is bound to the sizer's position, it will
        // change as well.
        var pos = this.get('sizer_position');
        var center = this.get('center');
        var distance = this.distanceBetweenPoints_(center, pos);

        // Set the distance property for any objects that are bound to it
        this.set('distance', distance);
      };


