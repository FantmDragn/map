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

// Square icon for dark mode: 10x10 square with a white border and a centered dot
var squareIconDark = L.divIcon({
  html: "<div style='width:10px; height:10px; position: relative; background-color:transparent; border:1px solid white;'>" +
        "<div style='width:3px; height:3px; background-color:white; border-radius:50%; " +
        "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);'></div>" +
        "</div>",
  className: '',
  iconSize: [10, 10],
  iconAnchor: [5, 5]
});

// Square icon for light mode: 10x10 square with a black border and a centered dot
var squareIconLight = L.divIcon({
  html: "<div style='width:10px; height:10px; position: relative; background-color:transparent; border:1px solid black;'>" +
        "<div style='width:3px; height:3px; background-color:black; border-radius:50%; " +
        "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);'></div>" +
        "</div>",
  className: '',
  iconSize: [10, 10],
  iconAnchor: [5, 5]
});

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
// Define a scaling factor for the speed line length (adjust this value to suit your needs)
var SPEED_LINE_SCALE = 100; // For example, 100 meters per 1 m/s of speed

class Ship {
  constructor(lat, lng, course, speed) {
    this.lat = lat;
    this.lng = lng;
    this.course = course;
    this.speed = speed;

    var mapContainer = document.getElementById('map');
    var isDarkMode = mapContainer.classList.contains('dark-mode');
    var defaultIcon = isDarkMode ? squareIconDark : squareIconLight;

    this.marker = L.marker([this.lat, this.lng], { icon: defaultIcon }).addTo(map);

    // Initialize the speed line
    this.speedLine = null;

    this.trackLabel = L.marker([this.lat, this.lng], {
      icon: L.divIcon({
        className: 'track-label',
        html: `<div class="track-info">Course: ${this.course.toFixed(1)}°<br>Speed: ${this.speed.toFixed(1)} m/s</div>`,
        iconSize: [100, 30], // Width and height of the label box
        iconAnchor: [-10, 15] // Moves the label box to the right of the ship marker
      }),
      interactive: false
    }).addTo(map);
    this.trackLabel.setOpacity(0); // Initially hidden
    
  }

  update(dt) {
    var distance = this.speed * dt;
    var newPos = move(this.lat, this.lng, this.course, distance);
    this.lat = newPos[0];
    this.lng = newPos[1];
    this.marker.setLatLng([this.lat, this.lng]);

    var zoomLevel = map.getZoom(); // ✅ Ensure zoomLevel is defined

    if (zoomLevel >= 8) {
        var labelOffsetDegrees = 0.002; // ✅ Moves the label to the right (adjust for spacing)

        // ✅ Set track info **static** to the right of the ship marker
        var labelLat = this.lat;  // No vertical shift
        var labelLng = this.lng + labelOffsetDegrees;  // Always to the right

        // Update track label position
        this.trackLabel.setLatLng([labelLat, labelLng]);
        this.trackLabel.setOpacity(1); // ✅ Make label visible

        // Generate the bearing line (same as before)
        var lineOffsetMeters = 1200; // Adjust for longer line
        var forwardLatLng = move(this.lat, this.lng, this.course, lineOffsetMeters);
        var reverseLatLng = move(this.lat, this.lng, this.course + 180, lineOffsetMeters / 2); // Shorter tail

        if (this.speed > 0) {
            if (this.speedLine === null) {
                this.speedLine = L.polyline([reverseLatLng, forwardLatLng], {
                    color: 'white',
                    weight: 2
                }).addTo(map);
            } else {
                this.speedLine.setLatLngs([reverseLatLng, forwardLatLng]);
            }
        }
    } else {
        this.trackLabel.setOpacity(0); // Hide track label
        if (this.speedLine) {
            map.removeLayer(this.speedLine); // Remove bearing line
            this.speedLine = null;
        }
    }
}



}



// Create an array to hold the ships
var ships = [];
var numShips = 150; // or however many you want

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

