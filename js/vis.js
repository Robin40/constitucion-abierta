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
	return L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        id: 'mapbox.streets'
    });
}

function boolean_heatmap_layer() {
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
    const heatmapLayer = boolean_heatmap_layer();

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