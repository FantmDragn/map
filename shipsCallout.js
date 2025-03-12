(function() {
    var selectedShip = null;
  
    if (window.ships && Array.isArray(ships)) {
      ships.forEach(function(ship) {
        ship.marker.on('click', function(e) {
          // If another ship is already selected, reset its style.
          if (selectedShip && selectedShip !== ship) {
            selectedShip.marker.setStyle({ color: 'white', fillColor: 'white', weight: 1 });
          }
          selectedShip = ship;
          // Set a yellow glow by updating the marker style.
          ship.marker.setStyle({ color: 'yellow', fillColor: 'white', weight: 3 });
          
          // Create the content for the callout.
          var popupContent = "<div style='padding:5px;'>" +
                               "<strong>Ship Information</strong><br>" +
                               "Speed: " + ship.speed.toFixed(2) + " m/s<br>" +
                               "Course: " + ship.course.toFixed(2) + "°<br>" +
                               "Position: (" + ship.lat.toFixed(4) + ", " + ship.lng.toFixed(4) + ")" +
                             "</div>";
                             
          // Bind a popup to the marker and open it.
          ship.marker.bindPopup(popupContent, {
            closeButton: true,
            autoClose: true,
            closeOnClick: true
          }).openPopup();
        });
      });
    }
  
    // Listen for when any popup is closed, and remove the glow from the selected ship.
    map.on('popupclose', function(e) {
      if (selectedShip) {
        selectedShip.marker.setStyle({ color: 'white', fillColor: 'white', weight: 1 });
        selectedShip = null;
      }
    });
  })();
  