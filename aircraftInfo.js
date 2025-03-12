(function() {
    var selectedAircraft = null;
  
    if (window.aircrafts && Array.isArray(aircrafts)) {
      aircrafts.forEach(function(ac) {
        ac.marker.on('click', function(e) {
          // If another aircraft was previously selected, reset its style.
          if (selectedAircraft && selectedAircraft !== ac) {
            selectedAircraft.marker.setStyle({ color: 'white', fillColor: 'white', weight: 1 });
          }
          selectedAircraft = ac;
          // Apply a yellow glow by setting the outline color to yellow and increasing the stroke weight.
          ac.marker.setStyle({ color: 'yellow', fillColor: 'white', weight: 3 });
          
          // Create the content for the callout.
          var popupContent = "<div style='padding:5px;'>" +
                               "<strong>Aircraft Information</strong><br>" +
                               "Speed: " + ac.speed.toFixed(2) + " m/s<br>" +
                               "Course: " + ac.course.toFixed(2) + "°<br>" +
                               "Position: (" + ac.currentLat.toFixed(4) + ", " + ac.currentLng.toFixed(4) + ")" +
                             "</div>";
                             
          // Bind a popup to the marker and open it.
          // The popup comes with a default close ("×") button and will close on map click.
          ac.marker.bindPopup(popupContent, { closeButton: true, autoClose: true, closeOnClick: true }).openPopup();
        });
      });
    }
  
    // Listen for when any popup is closed, then remove the glow from the selected aircraft.
    map.on('popupclose', function(e) {
      if (selectedAircraft) {
        selectedAircraft.marker.setStyle({ color: 'white', fillColor: 'white', weight: 1 });
        selectedAircraft = null;
      }
    });
  })();
  