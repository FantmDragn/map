// aircraft.js

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

// Helper: Calculate bearing (degrees) from one coordinate to another.
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

// Helper: Calculate distance (meters) between two coordinates using the Haversine formula.
function calculateDistance(lat1, lng1, lat2, lng2) {
  var R = 6371000;
  var rad = Math.PI / 180;
  var dLat = (lat2 - lat1) * rad;
  var dLng = (lng2 - lng1) * rad;
  var a = Math.sin(dLat / 2) ** 2 +
          Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
          Math.sin(dLng / 2) ** 2;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/* 
  Helper: Generate an aircraft icon (top half of a circle with a dot at the bottom)
  that does not rotate based on course.
  
  The SVG is now 20x20 with a viewBox "0 0 20 20". The arc is drawn from (0,16) to (20,16)
  so that its top is at y=6, and the dot is placed at (10,16). The iconAnchor is [10,16]
  so that the marker is anchored at the dot.
*/
function getAircraftIcon() {
  var mapContainer = document.getElementById('map');
  var isDarkMode = mapContainer.classList.contains('dark-mode');
  var strokeColor = isDarkMode ? 'white' : 'black';

  return L.divIcon({
    html: `
      <svg width="16" height="16" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <!-- ✅ Smaller Half-Circle -->
        <path d="M3,14 A7,7 0 0 1 17,14" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round"/>
        <!-- ✅ Smaller Dot at the Bottom -->
        <circle cx="10" cy="15" r="1.5" fill="${strokeColor}" />
      </svg>
    `,
    className: '',
    iconSize: [16, 16],  // ✅ Smaller icon size
    iconAnchor: [8, 14]  // ✅ Adjust anchor to match smaller icon
  });
}




// Aircraft class representing one simulated aircraft.
class Aircraft {
  constructor(startLat, startLng, endLat, endLng, speed, initialOffset = 0) {
    this.startLat = startLat;
    this.startLng = startLng;
    this.endLat = endLat;
    this.endLng = endLng;
    this.speed = speed;

    this.course = calculateBearing(startLat, startLng, endLat, endLng);

    if (initialOffset > 0) {
      var pos = move(startLat, startLng, this.course, initialOffset);
      this.currentLat = pos[0];
      this.currentLng = pos[1];
    } else {
      this.currentLat = startLat;
      this.currentLng = startLng;
    }

    // ✅ Create aircraft marker
    this.marker = L.marker([this.currentLat, this.currentLng], { icon: getAircraftIcon() }).addTo(map);

    // ✅ Create track label (initially hidden)
    this.trackLabel = L.marker([this.currentLat, this.currentLng], {
      icon: L.divIcon({
        className: 'track-label',
        html: `<div class="track-info">Speed: ${this.speed.toFixed(1)} m/s</div>`,
        iconSize: [80, 20],  // ✅ Adjust label size
        iconAnchor: [0, 0]   // ✅ Positions text properly to the right
      }),
      interactive: false
    }).addTo(map);
    this.trackLabel.setOpacity(0); // Initially hidden
  }

  update(dt) {
    var distance = this.speed * dt;
    var newPos = move(this.currentLat, this.currentLng, this.course, this.speed * dt);
    this.currentLat = newPos[0];
    this.currentLng = newPos[1];

    var distToDest = calculateDistance(this.currentLat, this.currentLng, this.endLat, this.endLng);
    if (distToDest < this.speed * dt) {
        this.currentLat = this.startLat;
        this.currentLng = this.startLng;
        this.course = calculateBearing(this.startLat, this.startLng, this.endLat, this.endLng);
    }

    this.marker.setLatLng([this.currentLat, this.currentLng]);

    var zoomLevel = map.getZoom(); // ✅ Ensure zoomLevel is defined

    if (zoomLevel >= 10) {  // ✅ Show label at zoom 10+
        var labelOffsetDegrees = 0.0025; // ✅ Moves label to the right

        // ✅ Keep label static to the right of aircraft
        var labelLat = this.currentLat;
        var labelLng = this.currentLng + labelOffsetDegrees;

        this.trackLabel.setLatLng([labelLat, labelLng]);
        this.trackLabel.setOpacity(1); // ✅ Make label visible
    } else {
        this.trackLabel.setOpacity(0); // Hide label when zoomed out
    }
  }
}


// Create an array to hold all aircraft.
var aircrafts = [];

// Define routes with approximate coordinates.
// Seattle to Hawaii (Honolulu)
var seattle = { lat: 47.6062, lng: -122.3321 };
var hawaii = { lat: 21.3069, lng: -157.8583 };

// Los Angeles to San Francisco
var losAngeles = { lat: 34.0522, lng: -118.2437 };
var sanFrancisco = { lat: 37.7749, lng: -122.4194 };

// Fresno to Los Angeles (destination: losAngeles)
var fresno = { lat: 36.7378, lng: -119.7871 };

// Function to create aircraft along a route.
function createAircraft(routeStart, routeEnd, count) {
  var spacing = 100000; // spacing in meters (10 km) between each aircraft along the route
  for (var i = 0; i < count; i++) {
    // Apply a small random variation at the departure point.
    var offsetLat = routeStart.lat + (Math.random() - 0.5) * 0.005;
    var offsetLng = routeStart.lng + (Math.random() - 0.5) * 0.005;
    // Choose a speed between 150 m/s and 250 m/s.
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
