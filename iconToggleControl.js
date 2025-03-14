(function() {
  // Icon for dark mode (white box and dot)
  var squareDotIconDark = L.divIcon({
    html: "<div style='width:10px; height:10px; background-color:transparent; border:2px solid white; display:flex; align-items:center; justify-content:center;'><div style='width:3px; height:3px; background-color:white; border-radius:50%;'></div></div>",
    className: '',
    iconSize: [10, 10],
    iconAnchor: [15, 15]
  });
  

  // Icon for light mode (black box and dot)
  var squareDotIconLight = L.divIcon({
    html: "<div style='width:10px; height:10px; background-color:transparent; border:2px solid black; display:flex; align-items:center; justify-content:center;'><div style='width:3px; height:3px; background-color:black; border-radius:50%;'></div></div>",
    className: '',
    iconSize: [15, 15],
    iconAnchor: [15, 15]
  });
  

  // Create a custom control to toggle ship markers
  var ShipToggleControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function(map) {
      var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
      container.style.width = '34px';
      container.style.height = '34px';
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.justifyContent = 'center';
      container.style.cursor = 'pointer';
      container.style.backgroundColor = 'white';
      container.title = "Toggle Ship Icon Style";

      // Initial button icon (placeholder image)
      container.innerHTML = "<img src='images/square.png' alt='Ship Icon' style='width:20px;height:20px;'/>";

      L.DomEvent.disableClickPropagation(container);

      container.onclick = function() {
        console.log("Toggle control clicked");
        if (window.ships && window.ships.length > 0) {
          console.log("Found ships: " + ships.length);
          // Check the map container to see if we're in dark mode
          var mapContainer = document.getElementById('map');
          var isDarkMode = mapContainer.classList.contains('dark-mode');
          // Choose the appropriate icon
          var chosenIcon = isDarkMode ? squareDotIconDark : squareDotIconLight;
          
          ships.forEach(function(ship) {
            // Remove the old marker from the map
            map.removeLayer(ship.marker);
            // Create a new marker with the chosen icon at the same location
            ship.marker = L.marker([ship.lat, ship.lng], { icon: chosenIcon });
            ship.marker.addTo(map);
          });
          // Visual feedback: change button background color to indicate toggle
          container.style.backgroundColor = 'yellow';
        } else {
          console.log("No ships found.");
        }
      };

      return container;
    }
  });

  // Add the ship toggle control to the map
  map.addControl(new ShipToggleControl());
})();
