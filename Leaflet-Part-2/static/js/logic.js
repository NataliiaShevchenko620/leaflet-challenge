// Function to determine marker size based on earthquake magnitude
// Use a logarithmic scale for a better visual distinction
function markerSize(magnitude) {
  // Earthquakes with missing magnitude will be plotted with a size of 1
  // Set default value
  let result = 1;

  if (magnitude) {
    result = Math.pow(magnitude, 2) * 10000;
  }

  return result;
}

// Function to set the color of the markers based on depth
function depthColor(depth) {
  // set default color Green-yellow (transitioning to green)
  let color = '#bfff00';

  // Define other colors based on depth
  if (depth >= 90) {
    color = '#ff0000' // Red
  } else if (depth >= 70) {
    color = '#ff4000' // Red-orange
  } else if (depth >= 50) {
    color = '#ff8000' // Orange
  } else if (depth >= 30) {
    color = '#ffbf00' // Light orange
  } else if (depth >= 10) {
    color = '#ffff00' // Yellow
  }

  return color;
}

// Function that creates all features
function createFeatures(earthquakeData, tectonicPlatesData) {
  let earthquakes = L.geoJson(earthquakeData, {
    pointToLayer: function(feature, latlng) {
      return L.circle(latlng, {
        radius: markerSize(feature.properties.mag),
        color: "black",
        fillColor: depthColor(feature.geometry.coordinates[2]),
        fillOpacity: 0.75,
        weight: 1
      });
    },
    onEachFeature: function(feature, layer) {
      layer.bindPopup(`<h4>Location: ${feature.properties.place}</h4><hr><p>Date & Time: ${new Date(feature.properties.time)}<br>Magnitude: ${feature.properties.mag}<br>Depth: ${feature.geometry.coordinates[2]} km</p>`);
    }
  });

  let tectonicPlates = L.geoJson(tectonicPlatesData, {
    style: function() {
      return {
        color: "#ff8000",
        weight: 2
      };
    }
  });

  // Passing prepared layers to createMap() function
  createMap(earthquakes, tectonicPlates);
}

// Function that creates a map
function createMap(earthquakes, tectonicPlates) {
  // Adding a satellite tile layer to the map
  let satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

  // Adding a grayscale tile layer to the map
  let grayscaleLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    });

  // Adding an outdoors tile layer to the map
  let outdoorsLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  // Creating a baseMaps object
  let baseMaps = {
    "Satellite": satelliteLayer,
    "Grayscale": grayscaleLayer,
    "Outdoors": outdoorsLayer
  };

  // Overlay layers object for layer control
  let overlayMaps = {
    "Earthquakes": earthquakes,
    "Tectonic Plates": tectonicPlates
  };

  // Creating a new map
  let myMap = L.map("map", {
    center: [37.8, -96],
    zoom: 5,
    layers: [earthquakes, tectonicPlates, satelliteLayer]
  });

  // Adding layer control to the map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);

  // Adding the legend to the map
  let legend = L.control({ position: "bottomright" });

  // Filling the legend with content
  legend.onAdd = function() {
    let div = L.DomUtil.create('div', 'info legend');

    div.style.backgroundColor = 'white';    // Set the background color to white
    div.style.padding = '6px';              // Add some padding for aesthetics
    div.style.border = '1px solid #ccc';    // Add a light grey border
    div.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)'; // Add a subtle shadow

    div.innerHTML = '<strong>Depth (km)</strong><br>';

    // Defining a list of depth boundaries and the corresponded ranges
    depth_range = [{"depth": -10, "range": "-10-10 km"}, 
                    {"depth": 10, "range": "10-30 km"},
                    {"depth": 30, "range": "30-50 km"},
                    {"depth": 50, "range": "50-70 km"},
                    {"depth": 70, "range": "70-90 km"},
                    {"depth": 90, "range": "90+ km"}]

    // Generating a label with a colored square for each interval, compact layout without breaks
    depth_range.forEach(dr => {
      div.innerHTML += '<i style="background-color:' + depthColor(dr.depth) + 
                        '; width: 18px; height: 18px; display: inline-block; margin-right: 8px"></i> ' +
                        dr.range + '<br>'
    })

    return div;
  };

  // Adding legend to the map
  legend.addTo(myMap);
}

// URLs for earthquake data and tectonic plates data
let earthquakeURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
let tectonicPlatesURL = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

// API call to earthquake data
Promise.all([
  d3.json(earthquakeURL),    // API call for earthquake data
  d3.json(tectonicPlatesURL) // API call for tectonic plates data
]).then(function(responses) {
  let earthquakeData = responses[0];
  let tectonicPlatesData = responses[1];

  // Calling function that creates features and then a map
  createFeatures(earthquakeData, tectonicPlatesData);
});
