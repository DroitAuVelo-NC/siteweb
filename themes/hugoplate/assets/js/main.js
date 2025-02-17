
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


  const options = {
    "Signalisation": ["Manquante", "Illisible", "Mal positionnée", "Détériorée"],
    "Chaussee": ["Barrée par un obstacle", "Revêtement en mauvais état", "Inondation"],
    "Travaux": ["Non signalés", "Déviation non-indiquée", "Déviation provisoire"],
    "Mobilier": ["Endommagé", "Suggestion d'équipement"],
    "Espace": ["Dépôt sauvage", "Besoin d'élagage", "Besoin de fauchage", "Besoin de nettoyage"]
  };

  function updateSubSelect() {
      const mainSelect = document.getElementById("type_signalement");
      const subSelect = document.getElementById("subSelect");
      
      subSelect.innerHTML = '<option value="">-- Selectionner une sous-catégorie --</option>';
      
      if (mainSelect.value) {
          options[mainSelect.value].forEach(subOption => {
              let optionElement = document.createElement("option");
              optionElement.value = subOption;
              optionElement.textContent = subOption;
              subSelect.appendChild(optionElement);
          });
      }
  }
  
  const signalerElement = document.getElementById('signaler');
  if (signalerElement) {
    document.getElementById("type_signalement").addEventListener("change", updateSubSelect);
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
                type_signalement: document.getElementById("type_signalement").value,
                subSelect: document.getElementById("subSelect").value,
                description: document.getElementById("description").value,
                keepmeupdate: document.getElementById("keepmeupdate").value,
                latitude: document.getElementById("long").value,
                longitude: document.getElementById("lat").value,
            };
            
            // Envoi des données à Google Apps Script via cloudflare
            let response = await fetch("https://white-truth-2869.droitauvelo-nc.workers.dev", {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" }
            });
            
            let result = await response.json(); 
            // If result is succes     
            if (response.ok) {
                document.getElementById("signaler").reset();
                document.getElementById("static-modal").style.display = "block";
            } else {
                alert("Une erreur s'est produite lors de l'envoi du signalement.");
            }
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
