
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

      document.getElementById('fileInput').onchange = function (e){
                let extension = e.target.files[0].name.toLowerCase().split('.').pop();

                switch (extension)
                {
                    case 'jpeg':
                    case 'jpg':
                    case 'heic':
                        let reader = new FileReader();

                        reader.onload = function ()
                        {
                            let tags = extension == 'heic' ? findEXIFinHEIC(reader.result) : findEXIFinJPEG(reader.result);

                            let latitudeComponents = tags['GPSLatitude'];
                            let latitudeRef = tags['GPSLatitudeRef'];
                            let longitudeComponents = tags['GPSLongitude'];
                            let longitudeRef = tags['GPSLongitudeRef'];
                            let inputCoordinate = "${latitudeComponents} ${latitudeRef}, ${longitudeComponents} ${longitudeRef}";

                            const { lat, lng } = dmsToDecimalDegrees(inputCoordinate);
                            updateCoordinates(lat,lng);
                            document.getElementById('gps-coordinates').innerHTML = `The picture was taken at ${lat} ${latitudeRef}, ${lng}.`;
                        };

                        reader.readAsArrayBuffer(e.target.files[0]);

                        break;
                }
            }


    // Modal
    const confirmationModal = document.getElementById("confirmModal");
    confirmationModal.classList.add("hidden");

    const modalTitle = document.getElementById("modal-title");
    const modalContent = document.getElementById("modal-content");

    // Update sub select when main select changes
    document.getElementById("type_signalement").addEventListener("change", updateSubSelect);
    signalerElement.addEventListener("submit", async function(event) {
        event.preventDefault();
       
        let fileInput = document.getElementById("fileInput").files[0];
        let pointOI = document.getElementById("coords").value;
        if(pointOI === "") {
          alert("Veuillez saisir un point sur la carte.");
          return;
        }
        confirmationModal.classList.remove("hidden");
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
                keepmeupdate: document.getElementById("keepmeupdate").checked,
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
              
                
                modalTitle.innerHTML = "Félicitation, le signalement a bien été envoyé !";
                modalContent.innerHTML = "Merci pour votre contribution à l'amélioration de notre territoire. <br /><a href='/'>Retour à la page d'accueil</a>";
                document.getElementById("signaler").reset();
            } else {
                alert("Une erreur s'est produite lors de l'envoi du signalement.");
            }
        };
    });
  }
  
  function dmsToDecimalDegrees(dmsString) {
    // Split into latitude and longitude parts
    const parts = dmsString.split(/,\s*/);
  
    if (parts.length !== 6) {
      throw new Error("Invalid DMS format. Expected format: DD,MM,SS.S D, DDD,MM,SS.S D");
    }
  
    // Parse Latitude
    let latDegrees = parseFloat(parts[0]);
    let latMinutes = parseFloat(parts[1]);
    let latSeconds = parseFloat(parts[2]);
    let latDirection = parts[3];
  
    // Parse Longitude
    let lonDegrees = parseFloat(parts[4]);
    let lonMinutes = parseFloat(parts[5]);
    let lonSeconds = parseFloat(parts[6]);
    let lonDirection = parts[7];
  
    // Convert to decimal degrees
    function convertToDecimal(degrees, minutes, seconds, direction) {
      let decimal = degrees + minutes / 60 + seconds / 3600;
      return (direction === "S" || direction === "W") ? -decimal : decimal;
    }
  
    let latitude = convertToDecimal(latDegrees, latMinutes, latSeconds, latDirection);
    let longitude = convertToDecimal(lonDegrees, lonMinutes, lonSeconds, lonDirection);
  
    return { lat: latitude, lon: longitude };
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
// Back to top

// Get the button
const mybutton = document.getElementById("btn-back-to-top");

// When the user scrolls down 20px from the top of the document, show the button

const scrollFunction = () => {
  if (
    document.body.scrollTop > 20 ||
    document.documentElement.scrollTop > 20
  ) {
    mybutton.classList.remove("hidden");
  } else {
    mybutton.classList.add("hidden");
  }
};
const backToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// When the user clicks on the button, scroll to the top of the document
mybutton.addEventListener("click", backToTop);

window.addEventListener("scroll", scrollFunction);

})();
