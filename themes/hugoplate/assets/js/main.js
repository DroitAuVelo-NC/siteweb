// main script
(function () {
  "use strict";

  // Dropdown Menu Toggler For Mobile
  // ----------------------------------------
  const dropdownMenuToggler = document.querySelectorAll(
    ".nav-dropdown > .nav-link",
  );

  dropdownMenuToggler.forEach((toggler) => {
    toggler?.addEventListener("click", (e) => {
      e.target.closest('.nav-item').classList.toggle("active");
    });
  });

  // Testimonial Slider
  // ----------------------------------------
  new Swiper(".testimonial-slider", {
    spaceBetween: 24,
    loop: true,
    pagination: {
      el: ".testimonial-slider-pagination",
      type: "bullets",
      clickable: true,
    },
    breakpoints: {
      768: {
        slidesPerView: 2,
      },
      992: {
        slidesPerView: 3,
      },
    },
  });


  const signalerElement = document.getElementById('signaler');
  if (signalerElement) {
    signalerElement.addEventListener("submit", async function(event) {
        event.preventDefault();
        
        let fileInput = document.getElementById("fileInput").files[0];
        let reader = new FileReader();
        reader.readAsDataURL(fileInput);
        
        reader.onload = async function() {
            let base64File = reader.result.split(',')[1];
            
            let data = {
                file: base64File,
                fileType: fileInput.type,
                fileName: fileInput.name,
                email: document.getElementById("email").value,
                latitude: document.getElementById("long").value,
                longitude: document.getElementById("lat").value,
            };
            
            // Envoi des données à Google Apps Script
            let response = await fetch("https://white-truth-2869.ivan-zupancic.workers.dev", {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" }
            });
            
            let result = await response.json();      
        };
    });
  }
  
  // Check if the map element exists before initializing the map
  const mapElement = document.getElementById('map_signalement');
  if (mapElement) {   
  // MAP
  var map = L.map('map_signalement').setView([-22.2758, 166.458], 13);
    
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
  }).addTo(map);
    
  var marker;

  function updateCoordinates(lat, lng) {
     document.getElementById('coords').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
     document.getElementById('long').value = `${lng.toFixed(6)}`;
     document.getElementById('lat').value = `${lat.toFixed(6)}`;
  }

  map.on('click', function(e) {
        if (marker) {
            marker.setLatLng(e.latlng);
        } else {
            marker = L.marker(e.latlng, { draggable: true }).addTo(map);
            marker.on('dragend', function(event) {
                var position = event.target.getLatLng();
                updateCoordinates(position.lat, position.lng);
            });
        }
        updateCoordinates(e.latlng.lat, e.latlng.lng);
    });
       document.getElementById('locate').addEventListener('click', function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;
                
                if (marker) {
                    marker.setLatLng([lat, lng]);
                } else {
                    marker = L.marker([lat, lng], { draggable: true }).addTo(map);
                    marker.on('dragend', function(event) {
                        var position = event.target.getLatLng();
                        updateCoordinates(position.lat, position.lng);
                    });
                }
                map.setView([lat, lng], 13);
                updateCoordinates(lat, lng);
            }, function(error) {
                alert('Geolocation impossible: ' + error.message);
            });
        } else {
            alert('Geolocation non supportée par votre appareil.');
        }
    });
  }

})();
