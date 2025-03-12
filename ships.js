// Helper function: Given a starting lat, lng, bearing (in degrees), and distance (in meters),
// this function calculates the destination coordinates using spherical trigonometry.
function move(lat, lng, bearing, distance) {
    var R = 6371000; // Earth's radius in meters
    var rad = Math.PI / 180;
    var lat1 = lat * rad;
    var lng1 = lng * rad;
    var bearingRad = bearing * rad;
    var lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance / R) +
                         Math.cos(lat1) * Math.sin(distance / R) * Math.cos(bearingRad));
    var lng2 = lng1 + Math.atan2(Math.sin(bearingRad) * Math.sin(distance / R) * Math.cos(lat1),
                                 Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2));
    return [lat2 / rad, lng2 / rad];
  }
  
  // Define a Ship class to represent each simulated ship
  class Ship {
    constructor(lat, lng, course, speed) {
      this.lat = lat;
      this.lng = lng;
      this.course = course; // in degrees (0-360)
      this.speed = speed;   // in meters per second
      // Create a white circle marker to represent the ship
      this.marker = L.circleMarker([this.lat, this.lng], {
        radius: 5,
        color: 'white',
        fillColor: 'white',
        fillOpacity: 1
      }).addTo(map);
    }
    
    // Update the ship's position based on the elapsed time (dt in seconds)
    update(dt) {
      var distance = this.speed * dt;
      var newPos = move(this.lat, this.lng, this.course, distance);
      this.lat = newPos[0];
      this.lng = newPos[1];
      this.marker.setLatLng([this.lat, this.lng]);
    }
  }
  
  // Create an array to hold the ships
  var ships = [];
  // Use a base coordinate (for example, New York City)
  var baseLat = 40.7128;
  var baseLng = -74.0060;
  
  // Create 10 ships with random starting positions, courses, and speeds
  for (var i = 0; i < 10; i++) {
    // Offset the base coordinate slightly for each ship
    var lat = baseLat + (Math.random() - 0.5) * 0.02; // roughly ±0.01 degrees
    var lng = baseLng + (Math.random() - 0.5) * 0.02;
    var course = Math.random() * 360;  // Random bearing between 0 and 360 degrees
    var speed = 1 + Math.random() * 4;   // Speed between 1 and 5 m/s
    var ship = new Ship(lat, lng, course, speed);
    ships.push(ship);
  }
  
  // Update ship positions every second (1000 ms)
  setInterval(function() {
    ships.forEach(function(ship) {
      ship.update(1); // dt = 1 second
    });
  }, 1000);
  