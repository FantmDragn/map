// Helper function: Calculate new coordinates given a starting point, bearing, and distance.
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

// Ray-casting algorithm to check if a point is inside a polygon
// Our polygon and points are defined as [lat, lng] but the algorithm works with x = lng, y = lat.
function pointInPolygon(point, vs) {
  var x = point[1], y = point[0];
  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    var xi = vs[i][1], yi = vs[i][0];
    var xj = vs[j][1], yj = vs[j][0];
    var intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Get bounding box for a polygon (returns min and max for lat and lng)
function getBoundingBox(polygon) {
  var minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  polygon.forEach(function(coord) {
    var lat = coord[0], lng = coord[1];
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  });
  return {minLat, maxLat, minLng, maxLng};
}

// Generate a random point within the polygon's bounding box until it's inside the polygon.
function randomPointInPolygon(polygon) {
  var bbox = getBoundingBox(polygon);
  var lat, lng;
  do {
    lat = Math.random() * (bbox.maxLat - bbox.minLat) + bbox.minLat;
    lng = Math.random() * (bbox.maxLng - bbox.minLng) + bbox.minLng;
  } while (!pointInPolygon([lat, lng], polygon));
  return [lat, lng];
}

// Define your custom polygon as an array of [lat, lng] coordinates.
// Replace these coordinates with your desired area.
var polygon = [
  [48.0193,-126.3427],
  [46.4681,-125.8593],
  [43.8662,-125.9472],
  [40.9135,-126.1230],
  [38.3761,-125.6835],
  [36.1023,-124.4531],
  [34.2708,-123.2226],
  [33.6512,-121.8603],
  [34.3252,-120.5969],
  [35.0389,-120.8276],
  [35.7465,-121.5637],
  [36.2354,-121.9702],
  [36.7740,-122.2338],
  [37.6577,-122.7722],
  [38.0653,-123.3105],
  [38.9252,-124.1894],
  [39.4277,-124.2004],
  [39.7578,-124.1235],
  [39.9602,-124.3103],
  [40.2459,-124.6069],
  [40.6806,-124.4311],
  [41.3355,-124.2004],
  [41.8040,-124.4531],
  [42.3179,-124.5849],
  [43.0046,-124.6289],
  [44.0086,-124.3762],
  [45.4138,-124.1894],
  [46.8752,-124.3212],
  [47.6209,-124.7387],
  [48.0046,-126.3208]
];

// Ship class remains the same
class Ship {
  constructor(lat, lng, course, speed) {
    this.lat = lat;
    this.lng = lng;
    this.course = course; // Constant course
    this.speed = speed;   // Constant speed
    // Create a white circle marker to represent the ship
    this.marker = L.circleMarker([this.lat, this.lng], {
      radius: 1,       // Smaller radius for thousands of ships
      color: 'white',
      fillColor: 'white',
      fillOpacity: 1
    }).addTo(map);
  }
  
  // Update ship's position based on its constant course and speed
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
var numShips = 100; // or however many you want

for (var i = 0; i < numShips; i++) {
  var point = randomPointInPolygon(polygon);
  var lat = point[0], lng = point[1];
  var course = Math.random() * 360;  // Random course (degrees)
  var speed = 1 + Math.random() * 4;   // Speed between 1 and 5 m/s
  var ship = new Ship(lat, lng, course, speed);
  ships.push(ship);
}

// Update ship positions every second
setInterval(function() {
  ships.forEach(function(ship) {
    ship.update(1); // dt = 1 second
  });
}, 1000);
