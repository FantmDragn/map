(function() {
  // Internal state for measurement
  var measureActive = false;
  var measureStart = null;
  var measureLine = null;
  
  // Function to show instructions overlay (if you have one; optional)
  function showMeasureInstructions() {
    var instructions = document.createElement('div');
    instructions.id = 'measureInstructions';
    instructions.style.position = 'absolute';
    instructions.style.top = '10px';
    instructions.style.left = '50%';
    instructions.style.transform = 'translateX(-50%)';
    instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    instructions.style.color = 'white';
    instructions.style.padding = '10px';
    instructions.style.borderRadius = '5px';
    instructions.style.zIndex = 10000;
    instructions.innerHTML = 'Measurement mode: First click sets the start point, second click measures distance.';
    document.body.appendChild(instructions);
  }

  function hideMeasureInstructions() {
    var instructions = document.getElementById('measureInstructions');
    if (instructions) {
      document.body.removeChild(instructions);
    }
  }
  
  // Function called when the map is clicked in measurement mode.
  function measureMapClick(e) {
    if (!measureStart) {
      // First click: set the starting point.
      measureStart = e.latlng;
    } else {
      // Second click: measure distance.
      var endPoint = e.latlng;
      var distance = map.distance(measureStart, endPoint);
      
      // Remove any previous measurement line.
      if (measureLine) {
        map.removeLayer(measureLine);
      }
      
      // Draw a yellow line between the two points.
      measureLine = L.polyline([measureStart, endPoint], { color: 'yellow', weight: 2 }).addTo(map);
      
      // Display a popup at the end point with the measured distance.
      L.popup()
        .setLatLng(endPoint)
        .setContent("Distance: " + distance.toFixed(2) + " meters")
        .openOn(map);
      
      // Reset the starting point for future measurements.
      measureStart = null;
    }
  }
  
  // Toggle measurement mode on/off.
  function toggleMeasureMode() {
    measureActive = !measureActive;
    var mapContainer = document.getElementById('map');
    if (measureActive) {
      // Start listening for map clicks.
      map.on('click', measureMapClick);
      // Change pointer style to an arrow.
      mapContainer.style.cursor = 'default';
      // Show instructions
      showMeasureInstructions();
    } else {
      // Remove the map click listener.
      map.off('click', measureMapClick);
      measureStart = null;
      if (measureLine) {
        map.removeLayer(measureLine);
        measureLine = null;
      }
      // Restore the default cursor.
      mapContainer.style.cursor = '';
      // Hide instructions.
      hideMeasureInstructions();
    }
  }
  
  // Create a custom Leaflet control for measurement.
  var MeasureControl = L.Control.extend({
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
      container.title = "Measure distance";
      // Replace the "M" with a ruler icon.
      container.innerHTML = "<img src='images/ruler.png' alt='Ruler' style='width:20px;height:20px;'/>";
      
      L.DomEvent.disableClickPropagation(container);
      
      container.onclick = function() {
        toggleMeasureMode();
        container.style.backgroundColor = measureActive ? 'yellow' : 'white';
      };
      
      return container;
    }
  });
  
  // Add the measurement control to the map.
  map.addControl(new MeasureControl());
  
  // Optional: When a popup is closed, exit measurement mode.
  map.on('popupclose', function() {
    if (measureActive) {
      toggleMeasureMode();
      var measureButton = document.querySelector('.leaflet-control-custom[title="Measure distance"]');
      if (measureButton) {
        measureButton.style.backgroundColor = 'white';
      }
    }
  });
})();
