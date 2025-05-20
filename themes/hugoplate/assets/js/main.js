
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
                            
                            // DD,MM,SS.S D, DDD,MM,SS.S D");
                            let lat = DMS2Decimal(latitudeComponents[0], latitudeComponents[1], latitudeComponents[2], latitudeRef);
                            let lng = DMS2Decimal(longitudeComponents[0], longitudeComponents[1], longitudeComponents[2], longitudeRef);

                            //updateCoordinates(lat,lng);
                            if (marker) {
                              marker.setLatLng(e.latlng);
                            } else {
                              marker = L.marker([lat, lng], { draggable: false }).addTo(map);
                            }

                            document.getElementById('coords').value = `${lat}, ${lng}`;
                            document.getElementById('long').value = `${lng}`;
                            document.getElementById('lat').value = `${lat}`;

                            document.getElementById('gps-coordinates').innerHTML = `Les coordonnées GPS de la photo sont : ${lat} ${lng}.`;
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

  signalerElement.addEventListener("submit", async function(event) {
    event.preventDefault();
    
    let fileInputElement = document.getElementById("fileInput");
    let fileInput = fileInputElement.files[0];
    let pointOI = document.getElementById("coords").value;
    
    if (pointOI === "") {
        alert("Veuillez saisir un point sur la carte.");
        return;
    }

    confirmationModal.classList.remove("hidden");

    // Prepare common data
    const data = {
        file: null,
        fileType: "",
        fileName: "",
        email: document.getElementById("email").value,
        type_signalement: '', // document.getElementById("type_signalement").value,
        subSelect: '', // document.getElementById("subSelect").value,
        description: document.getElementById("description").value,
        keepmeupdate: document.getElementById("keepmeupdate").checked,
        latitude: document.getElementById("long").value,
        longitude: document.getElementById("lat").value,
    };

    // If a file is selected, read and encode it
    if (fileInput !== undefined) {
        const reader = new FileReader();
        reader.onload = async function() {
            data.file = reader.result.split(',')[1];  // base64 content
            data.fileType = fileInput.type;
            data.fileName = fileInput.name;

            await sendData(data);
        };
        reader.readAsDataURL(fileInput);
    } else {
        // No file, send directly
        await sendData(data);
    }

    async function sendData(payload) {
        try {
            const response = await fetch("https://white-truth-2869.droitauvelo-nc.workers.dev", {
                method: "POST",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" }
            });

            const result = await response.json();

            if (response.ok) {
                modalTitle.innerHTML = "Félicitation, le signalement a bien été envoyé !";
                modalContent.innerHTML = `Merci pour votre contribution à l'amélioration de notre territoire. <br />
                    <a class='btn btn-outline-primary' href='/signaler-promo'>Retour à la page de signalement</a>.`;
                document.getElementById("signaler").reset();
            } else {
                alert("Une erreur s'est produite lors de l'envoi du signalement.");
            }
        } catch (err) {
            console.error("Erreur réseau :", err);
            alert("Une erreur s'est produite lors de l'envoi.");
        }
    }
});
  }

    function DMS2Decimal(degrees = 0, minutes = 0, seconds = 0, direction = 'N') {
      const directions = ['N', 'S', 'E', 'W'];
      if(!directions.includes(direction.toUpperCase())) return 0;
      if(!Number(minutes) || minutes < 0 || minutes > 59) return 0;
      if(!Number(seconds) || seconds < 0 || seconds > 59) return  0;
      if(!Number(degrees) || degrees < 0 || degrees > 180) return 0;
      
      let decimal = degrees + (minutes / 60) + (seconds / 3600);
      if (direction.toUpperCase() === 'S' || direction.toUpperCase() === 'W') decimal *= -1;
      return decimal;
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
