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
  var x = Math.cos(phi1) * Math.sin(phi2) -
          Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLng);
  var theta = Math.atan2(y, x);
  return (theta * 180 / Math.PI + 360) % 360;
}

// Helper: Calculate distance (in meters) between two coordinates using the Haversine formula.
function calculateDistance(lat1, lng1, lat2, lng2) {
  var R = 6371000;
  var rad = Math.PI / 180;
  var dLat = (lat2 - lat1) * rad;
  var dLng = (lng2 - lng1) * rad;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: Given an aircraft's center (its current position) and course,
// compute three vertices (lat,lng) for a triangle representing the aircraft.
// We define our triangle in a local coordinate system (in meters) relative to its centroid.
// Updated configuration for a slightly larger triangle:
function getAircraftTrianglePoints(lat, lng, course) {
  // Define dimensions (in meters)
  var d = 833.33;    // Distance from centroid to tip
  var b = 375;       // Half the base width
  var a = d / 2;     // Base is located at -a (so that centroid is at (0,0))
  
  // Define triangle vertices in local coordinates relative to the centroid.
  // With no rotation, the tip is at (0, d) – meaning directly north,
  // and the base vertices are at (-b, -a) and (b, -a).
  var localTip   = { x: 0,   y: d };
  var localLeft  = { x: -b,  y: -a };
  var localRight = { x: b,   y: -a };

  // Rotate each point by -course radians so that the triangle points in the correct direction.
  var theta = -course * Math.PI / 180;
  function rotate(point) {
    return {
      x: point.x * Math.cos(theta) - point.y * Math.sin(theta),
      y: point.x * Math.sin(theta) + point.y * Math.cos(theta)
    };
  }
  var tipRot   = rotate(localTip);
  var leftRot  = rotate(localLeft);
  var rightRot = rotate(localRight);

  // Convert each rotated offset (in meters) to a new lat/lng.
  function offsetToLatLng(offset) {
    var distance = Math.sqrt(offset.x * offset.x + offset.y * offset.y);
    // Calculate the angle relative to east.
    var angleFromEast = Math.atan2(offset.y, offset.x) * 180 / Math.PI;
    // Convert to a bearing relative to north.
    var offsetBearing = (90 - angleFromEast + 360) % 360;
    return move(lat, lng, offsetBearing, distance);
  }
  
  var tipPos   = offsetToLatLng(tipRot);
  var leftPos  = offsetToLatLng(leftRot);
  var rightPos = offsetToLatLng(rightRot);
  
  return [tipPos, leftPos, rightPos];
}


// Aircraft class representing one simulated aircraft.
class Aircraft {
  // Added an optional initialOffset parameter (in meters) to space out aircraft along the route.
  constructor(startLat, startLng, endLat, endLng, speed, initialOffset = 0) {
    this.startLat = startLat;
    this.startLng = startLng;
    this.endLat = endLat;
    this.endLng = endLng;
    this.speed = speed; // in m/s
    // Compute course from start to destination.
    this.course = calculateBearing(startLat, startLng, endLat, endLng);
    // Adjust starting position along the route based on initialOffset.
    if (initialOffset > 0) {
      var pos = move(startLat, startLng, this.course, initialOffset);
      this.currentLat = pos[0];
      this.currentLng = pos[1];
    } else {
      this.currentLat = startLat;
      this.currentLng = startLng;
    }
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
      // Recalculate course in case starting point was slightly offset.
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
// Re-use losAngeles for destination.

// Create 3 aircraft for each route.
// We'll space them out by adding an increasing initial offset (e.g., 10 km apart).
function createAircraft(routeStart, routeEnd, count) {
  var spacing = 100000; // spacing in meters (10 km) between each aircraft along the route
  for (var i = 0; i < count; i++) {
    // Optional small random variation at the departure point.
    var offsetLat = routeStart.lat + (Math.random() - 0.5) * 0.005;
    var offsetLng = routeStart.lng + (Math.random() - 0.5) * 0.005;
    // Choose a speed between 150 m/s and 250 m/s (typical for aircraft).
    var speed = 150 + Math.random() * 100;
    // Each subsequent aircraft gets a larger initial offset.
    var initialOffset = i * spacing;
    var ac = new Aircraft(offsetLat, offsetLng, routeEnd.lat, routeEnd.lng, speed, initialOffset);
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
