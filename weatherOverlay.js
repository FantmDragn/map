(function() {
    // Define the RainViewer weather overlay tile layer.
    // This example uses the RainViewer radar overlay.
    var weatherLayer = L.tileLayer('https://tilecache.rainviewer.com/v2/radar/256/{z}/{x}/{y}/2/1_1.png', {
      attribution: 'Weather data © RainViewer',
      opacity: 0.5
    });
    
    var weatherActive = false;
    
    // Create a custom control for toggling the weather overlay.
    var WeatherControl = L.Control.extend({
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
        container.title = "Toggle weather overlay";
        
        // Change the inner HTML to show a rain cloud icon.
        // You can replace the URL below with any free-to-use rain cloud icon.
        container.innerHTML = "<img src='https://cdn-icons-png.flaticon.com/512/1163/1163624.png' alt='Rain Cloud' style='width:20px;height:20px;'/>";
        
        // Prevent clicks on the control from affecting the map.
        L.DomEvent.disableClickPropagation(container);
        
        // Toggle the weather overlay when the button is clicked.
        container.onclick = function() {
          if (weatherActive) {
            map.removeLayer(weatherLayer);
            weatherActive = false;
            container.style.backgroundColor = 'white';
          } else {
            map.addLayer(weatherLayer);
            weatherActive = true;
            container.style.backgroundColor = 'yellow';
          }
        };
        
        return container;
      }
    });
    
    // Add the weather control to the map.
    map.addControl(new WeatherControl());
  })();
  