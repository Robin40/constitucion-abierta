function boolean_heatmap(locations) {
	return {
		points: R.map(location => ({
        	lat: location.lat,
        	lng: location.lng,
        	intensity: 1
        }), locations)
    };
}

function mapbox_layer() {
    const tiles = 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png';
    //const tiles = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw';
	return L.tileLayer(tiles, {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        id: 'mapbox.streets'
    });
}

function empty_boolean_heatmap_layer() {
	const cfg = {
        radius: 16,
        maxOpacity: .5,
        scaleRadius: false,
        useLocalExtrema: true,
        latField: 'lat',
        lngField: 'lng',
        valueField: 'intensity'
    };

    return new HeatmapOverlay(cfg);
}

function init_boolean_heatmap(location, zoom, divId) {
	const map = L.map(divId).setView(location, zoom);
    const heatmapLayer = empty_boolean_heatmap_layer();

    map.addLayer(mapbox_layer())
        .addLayer(heatmapLayer);

    return heatmapLayer;
}

function show_boolean_heatmap(heatmapLayer, heatmap) {
	const data = {
		max: Infinity,
		data: heatmap.points
	};
	heatmapLayer.setData(data);
}

function boolean_heatmap_layer(locations) {
    const heatmapLayer = empty_boolean_heatmap_layer();
    const data = {
        max: Infinity,
        data: R.map(R.assoc('intensity', 1), locations)
    };
    heatmapLayer.setData(data);
    return Promise.resolve(heatmapLayer);
}

function markers_layer(locations) {
    const markersLayer = L.markerClusterGroup();
    $.each(locations, (_, location) => {
        const marker = L.marker(location);
        markersLayer.addLayer(marker);
    });
    return Promise.resolve(markersLayer);
}
/*
function colorpleth_layer(locations) {
    alert('No está implementado, se mostrará un heatmap');
    return boolean_heatmap_layer(locations);
}
*/

/* based on http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb */
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + (b << 0))
        .toString(16).slice(1);
}

const aThird = 1/3;
const twoThirds = 2/3;

function blue_red(intensity) {
    return intensity < aThird ? rgbToHex(0, 0, intensity*3*255)
        : intensity < twoThirds ? rgbToHex((intensity - aThird)*3*255, 0, 255)
        : rgbToHex(255, 0, (1 - intensity)*3*255);
}

const communes_geojson = json('santiagoComunas.GeoJson');

function choropleth_layer(locations) {
    const countOf = R.countBy(d => d.commune || d.nombre, locations);
    const max = R.reduce(R.max, -Infinity, Object.values(countOf));

    return communes_geojson.then(communes =>
        L.geoJSON(communes, {
            style: feature => {
                const commune = feature.properties.name;
                const intensity = countOf[commune]/max || 0;
                const color = blue_red(intensity);
                return {color: '#404040', fillColor: color, fillOpacity: 0.6};
            },
            onEachFeature: (feature, layer) => {
                const commune = feature.properties.name;
                layer.bindPopup(`${commune} (${countOf[commune] || 0})`);
            }
        })
    );
}

function init_map(location, zoom, divId) {
    return L.map(divId).setView(location, zoom)
        .addLayer(mapbox_layer());
}

function show_overlay(overlay, map) {
    if (map.$overlay != null)
        map.removeLayer(map.$overlay);

    map.addLayer(overlay)
        .$overlay = overlay;
}