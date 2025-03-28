// Define the dark and light tile layers
var darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO'
  });
  
  var lightLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO'
  });
  
  // Initialize the map with the dark layer as the default
  var map = L.map('map', {
      center: [37.7658, -122.7048],
      zoom: 5,
      layers: [darkLayer]
  });
  
  // Create a custom control for toggling the map theme
  var ToggleControl = L.Control.extend({
    options: {
      position: 'topright'
    },
    onAdd: function(map) {
      // Create a container for the button
      var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
      
      // Use a map icon (example icon URL; feel free to replace with your own)
      container.style.backgroundImage = "url('images/map.png')";
      container.title = "Toggle map theme";
  
      // Prevent clicks on the control from propagating to the map
      L.DomEvent.disableClickPropagation(container);
      
      // Toggle between darkLayer and lightLayer on click
      container.onclick = function() {
        var mapContainer = document.getElementById('map');
        if (map.hasLayer(darkLayer)) {
          // Switch to light mode: remove dark layer and its associated CSS class
          map.removeLayer(darkLayer);
          map.addLayer(lightLayer);
          mapContainer.classList.remove('dark-mode');
          // Update ship markers: add a black outline
          if (window.ships) {
            ships.forEach(function(ship) {
              ship.marker.setStyle({ color: 'black', fillColor: 'white' });
            });
          }
          // Update aircraft markers: add a black outline for triangles
          if (window.aircrafts) {
            aircrafts.forEach(function(ac) {
              ac.marker.setStyle({ color: 'black', fillColor: 'white' });
            });
          }
        } else {
          // Switch to dark mode: remove light layer and add dark layer with CSS class
          map.removeLayer(lightLayer);
          map.addLayer(darkLayer);
          mapContainer.classList.add('dark-mode');
          // Update ship markers: revert to a white outline
          if (window.ships) {
            ships.forEach(function(ship) {
              ship.marker.setStyle({ color: 'white', fillColor: 'white' });
            });
          }
          // Update aircraft markers: revert outline to white
          if (window.aircrafts) {
            aircrafts.forEach(function(ac) {
              ac.marker.setStyle({ color: 'white', fillColor: 'white' });
            });
          }
        }
      };
      
      return container;
    }
  });
  
  // Add the toggle control to the map
  map.addControl(new ToggleControl());
  
  // Global flag to track which icon set is active.
var useMilStdIcons = false;

// Define default icons
var defaultShipIcon = L.icon({
  iconUrl: 'images/ship_default.png', // path to your default ship icon
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});
var defaultAircraftIcon = L.icon({
  iconUrl: 'images/aircraft_default.png', // path to your default aircraft icon
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Define MIL-STD-2525C icons
var milStdShipIcon = L.icon({
  iconUrl: 'images/ship_mil_std.png', // path to your MIL-STD-2525C ship icon
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});
var milStdAircraftIcon = L.icon({
  iconUrl: 'images/aircraft_mil_std.png', // path to your MIL-STD-2525C aircraft icon
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});
