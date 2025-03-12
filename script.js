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
      container.style.backgroundImage = "url('map/images/map.png')";
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
        } else {
          // Switch to dark mode: remove light layer and add dark layer with CSS class
          map.removeLayer(lightLayer);
          map.addLayer(darkLayer);
          mapContainer.classList.add('dark-mode');
        }
      };
      return container;
    }
  });
  
  // Add the toggle control to the map
  map.addControl(new ToggleControl());
  