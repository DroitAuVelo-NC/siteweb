
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
                              marker.setLatLng([lat, lng]);
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

  // Calques de la carte uMap "Vélo Nouvelle-Calédonie - Droit au vélo"
  // ----------------------------------------
  // Les calques alimentés par une source distante (Google Sheet, Grist) sont lus directement.
  // Les calques stockés dans uMap ne sont pas accessibles depuis un autre site (CORS) :
  // on utilise leur copie dans static/umap/<id du calque>.geojson.
  const UMAP_URL = "https://umap.openstreetmap.fr";
  const UMAP_ID = 1128154;

  function loadUmapLayers(map, layersControl) {
    fetch(`${UMAP_URL}/fr/map/${UMAP_ID}/geojson/`)
      .then((response) => response.json())
      .then((umap) => {
        map.attributionControl.addAttribution(`<a href="${UMAP_URL}/fr/map/${UMAP_ID}" target="_blank" rel="noopener">uMap Droit au vélo NC</a>`);
        umap.properties.datalayers.forEach((datalayer) => {
          const options = datalayer.properties;
          const color = escapeHTML(options.color || "DarkBlue");
          const group = L.featureGroup();
          // Les données sont chargées au premier affichage du calque
          group.once("add", () => loadUmapDatalayer(datalayer.id, options, color, group));
          layersControl.addOverlay(group, `<span class="umap-legend" style="background:${color}"></span>${escapeHTML(options.name)}`);
          if (options.displayOnLoad !== false) group.addTo(map);
        });
      })
      .catch((error) => console.error("Carte uMap indisponible :", error));
  }

  function loadUmapDatalayer(id, options, color, group) {
    const remote = options.remoteData || {};
    const iconUrl = options.iconUrl && (options.iconUrl.startsWith("http") ? options.iconUrl : UMAP_URL + options.iconUrl);

    fetch(remote.url || `/umap/${id}.geojson`)
      .then((response) => response.ok ? response.text() : Promise.reject(response.status))
      .then((text) => {
        L.geoJSON(remote.format === "csv" ? csvToGeoJSON(text) : JSON.parse(text), {
          // bubblingMouseEvents: false => cliquer sur un point existant ouvre sa popup sans déplacer le marqueur du signalement
          pointToLayer: (feature, latlng) => iconUrl
            ? L.marker(latlng, { icon: L.divIcon({ className: "umap-icon", html: `<span style="background:${color}"><img src="${escapeHTML(iconUrl)}" alt=""></span>`, iconSize: [24, 24] }) })
            : L.circleMarker(latlng, { radius: 6, color: "#fff", weight: 1, fillColor: color, fillOpacity: 0.9, bubblingMouseEvents: false }),
          onEachFeature: (feature, layer) => layer.bindPopup(umapPopup(options, feature.properties)),
        }).addTo(group);
      })
      .catch((error) => console.error(`Calque uMap "${options.name}" indisponible :`, error));
  }

  // Reprend la syntaxe des popups uMap : {champ}, # titre, **gras**, [[lien]] et [[lien|texte]]
  function umapPopup(options, properties) {
    const values = { name: options.name, ...properties };
    return (options.popupContentTemplate || "# {name}\n{description}")
      .replace(/\{([^{}]+)\}/g, (match, key) => escapeHTML(values[key] || ""))
      .replace(/^### (.*)$/gm, "<h5>$1</h5>")
      .replace(/^## (.*)$/gm, "<h4>$1</h4>")
      .replace(/^# (.*)$/gm, "<h3>$1</h3>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[\[(https?:\/\/[^\]|]+)\|([^\]]+)\]\]/g, '<a href="$1" target="_blank" rel="noopener">$2</a>')
      .replace(/\[\[(https?:\/\/[^\]|]+)\]\]/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/\[\[[^\]]*\]\]/g, "")
      .trim()
      .replace(/\n/g, "<br>")
      .replace(/(<\/h\d>)(<br>)+/g, "$1");
  }

  function csvToGeoJSON(text) {
    const rows = parseCSV(text.replace(/^﻿/, ""));
    const header = rows.shift().map((key) => key.trim());
    const latKey = header.find((key) => /^lat(itude)?$/i.test(key));
    const lngKey = header.find((key) => /^(lon|lng|long|longitude)$/i.test(key));
    const features = [];

    rows.forEach((row) => {
      const properties = Object.fromEntries(header.map((key, i) => [key, row[i] || ""]));
      const lat = parseFloat(String(properties[latKey]).replace(",", "."));
      const lng = parseFloat(String(properties[lngKey]).replace(",", "."));
      // Ignore les lignes sans coordonnées (vides ou à 0)
      if (lat && lng) {
        features.push({ type: "Feature", geometry: { type: "Point", coordinates: [lng, lat] }, properties });
      }
    });
    return { type: "FeatureCollection", features };
  }

  function parseCSV(text) {
    const rows = [[]];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (inQuotes) {
        if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (char === '"') inQuotes = false;
        else field += char;
      } else if (char === '"') inQuotes = true;
      else if (char === ",") { rows[rows.length - 1].push(field); field = ""; }
      else if (char === "\n") { rows[rows.length - 1].push(field); rows.push([]); field = ""; }
      else if (char !== "\r") field += char;
    }
    rows[rows.length - 1].push(field);
    return rows.filter((row) => row.some((value) => value !== ""));
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  // Check if the map element exists before initializing the map
  const mapElement = document.getElementById('map_signalement');
  if (mapElement) {
  // MAP
  // preferCanvas : les calques uMap comptent plusieurs milliers de points
  var map = L.map('map_signalement', { preferCanvas: true }).setView([-22.267533, 166.452055], 14);

  // Fonds de carte : CyclOSM (celui de la carte uMap) ou OpenStreetMap
  const cyclosm = L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
        maxZoom: 20,
        attribution: '<a href="https://www.cyclosm.org" target="_blank" rel="noopener">CyclOSM</a> | © OpenStreetMap contributors'
  }).addTo(map);
  const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
  });
  const layersControl = L.control.layers({ "CyclOSM": cyclosm, "OpenStreetMap": osm }).addTo(map);

  loadUmapLayers(map, layersControl);

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
