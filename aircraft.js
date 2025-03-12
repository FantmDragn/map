// Move function: Given lat, lng, bearing (degrees) and distance (meters),
// returns new [lat, lng].
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
  
  // Helper: Calculate bearing from one coordinate to another.
  function calculateBearing(lat1, lng1, lat2, lng2) {
    var rad = Math.PI / 180;
    var phi1 = lat1 * rad;
    var phi2 = lat2 * rad;
    var deltaLng = (lng2 - lng1) * rad;
    var y = Math.sin(deltaLng) * Math.cos(phi2);
    var x = Math.cos(phi1)*Math.sin(phi2) -
            Math.sin(phi1)*Math.cos(phi2)*Math.cos(deltaLng);
    var theta = Math.atan2(y, x);
    return (theta * 180 / Math.PI + 360) % 360;
  }
  
  // Helper: Calculate distance (in meters) between two coordinates using the Haversine formula.
  function calculateDistance(lat1, lng1, lat2, lng2) {
    var R = 6371000;
    var rad = Math.PI / 180;
    var dLat = (lat2 - lat1) * rad;
    var dLng = (lng2 - lng1) * rad;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1*rad) * Math.cos(lat2*rad) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  // Helper: Given an aircraft's center (its current position) and course,
  // compute three vertices (lat,lng) for a triangle representing the aircraft.
  // We define our triangle in a local coordinate system (in meters) relative to its centroid.
  // In our design, the centroid is the marker position.
  // Using a configuration where:
  //   • tip is 666.67 m ahead,
  //   • the base is 666.67 m behind the tip (i.e. 333.33 m behind the centroid),
  //   • and half the base width is 300 m.
  function getAircraftTrianglePoints(lat, lng, course) {
    // Configuration (in meters)
    var d = 666.67; // distance from centroid to tip
    var e = d / 2;  // half of the tip-to-base distance
    var f = 300;    // half of the base width
  
    // Define triangle vertices in local (x, y) coordinates relative to centroid.
    // x-axis is the forward direction (along the course), y-axis is to the right.
    var localTip = { x: d, y: 0 };
    var localLeft = { x: -e, y: -f };
    var localRight = { x: -e, y: f };
  
    // Rotate each point by the course angle.
    var theta = course * Math.PI / 180;
    function rotate(point) {
      return {
        x: point.x * Math.cos(theta) - point.y * Math.sin(theta),
        y: point.x * Math.sin(theta) + point.y * Math.cos(theta)
      };
    }
    var tipRot = rotate(localTip);
    var leftRot = rotate(localLeft);
    var rightRot = rotate(localRight);
  
    // Convert each rotated offset (in meters) to a new lat/lng using the move function.
    // To do this, compute the distance and angle of the offset vector.
    function offsetToLatLng(offset) {
      var distance = Math.sqrt(offset.x * offset.x + offset.y * offset.y);
      // Calculate the angle of the offset relative to the east.
      var angleFromEast = Math.atan2(offset.y, offset.x) * 180 / Math.PI;
      // Convert this to a bearing relative to north.
      // (Bearing = 90 - angleFromEast, adjusted to 0-360 range)
      var offsetBearing = (90 - angleFromEast + 360) % 360;
      return move(lat, lng, offsetBearing, distance);
    }
    
    var tipPos = offsetToLatLng(tipRot);
    var leftPos = offsetToLatLng(leftRot);
    var rightPos = offsetToLatLng(rightRot);
    
    return [tipPos, leftPos, rightPos];
  }
  
  // Aircraft class representing one simulated aircraft.
  class Aircraft {
    constructor(startLat, startLng, endLat, endLng, speed) {
      this.startLat = startLat;
      this.startLng = startLng;
      this.endLat = endLat;
      this.endLng = endLng;
      this.speed = speed; // in m/s
      this.currentLat = startLat;
      this.currentLng = startLng;
      this.course = calculateBearing(startLat, startLng, endLat, endLng);
      // Create a polygon marker (triangle) for the aircraft.
      var points = getAircraftTrianglePoints(this.currentLat, this.currentLng, this.course);
      this.marker = L.polygon(points, { color: 'white', fillColor: 'white', fillOpacity: 1 }).addTo(map);
    }
    
    update(dt) {
      // Move the aircraft along its course.
      var newPos = move(this.currentLat, this.currentLng, this.course, this.speed * dt);
      this.currentLat = newPos[0];
      this.currentLng = newPos[1];
      
      // Check if the aircraft is near its destination.
      var distToDest = calculateDistance(this.currentLat, this.currentLng, this.endLat, this.endLng);
      if (distToDest < this.speed * dt) {
        // Reset to the start if the destination is reached.
        this.currentLat = this.startLat;
        this.currentLng = this.startLng;
        this.course = calculateBearing(this.startLat, this.startLng, this.endLat, this.endLng);
      }
      
      // Update the marker's triangle to the new position and maintain the course orientation.
      var newPoints = getAircraftTrianglePoints(this.currentLat, this.currentLng, this.course);
      this.marker.setLatLngs(newPoints);
    }
  }
  
  // Create an array to hold all aircraft.
  var aircrafts = [];
  
  // Define routes with approximate coordinates:
  // Seattle to Hawaii (Honolulu)
  var seattle = { lat: 47.6062, lng: -122.3321 };
  var hawaii = { lat: 21.3069, lng: -157.8583 };
  
  // Los Angeles to San Francisco
  var losAngeles = { lat: 34.0522, lng: -118.2437 };
  var sanFrancisco = { lat: 37.7749, lng: -122.4194 };
  
  // Fresno to Los Angeles
  var fresno = { lat: 36.7378, lng: -119.7871 };
  // Re-use losAngeles
  
  // Create 3 aircraft for each route.
  // (Optional: add slight random offsets to starting positions for visual variety.)
  function createAircraft(routeStart, routeEnd, count) {
    for (var i = 0; i < count; i++) {
      var offsetLat = routeStart.lat + (Math.random() - 0.5) * 0.01;
      var offsetLng = routeStart.lng + (Math.random() - 0.5) * 0.01;
      // Choose a speed between 150 m/s and 250 m/s (typical for aircraft).
      var speed = 150 + Math.random() * 100;
      var ac = new Aircraft(offsetLat, offsetLng, routeEnd.lat, routeEnd.lng, speed);
      aircrafts.push(ac);
    }
  }
  
  createAircraft(seattle, hawaii, 3);
  createAircraft(losAngeles, sanFrancisco, 3);
  createAircraft(fresno, losAngeles, 3);
  
  // Update aircraft positions every second.
  setInterval(function() {
    aircrafts.forEach(function(ac) {
      ac.update(1); // dt = 1 second
    });
  }, 1000);
  