function update_map(get_layer, map) {
    const concept = $('#concept').val();

    return concept_locations(concept).then(locations => {
        $('#num-ubicaciones').text(locations.length);
        return get_layer(locations).then(layer => {
            show_overlay(layer, map);
        });
    });
}

function update_vis(mapChile, map) {
    return Promise.all([
        update_map(boolean_heatmap_layer, mapChile),
        update_map(choropleth_layer, map)
    ]).finally(_ => $('#update-vis').prop('disabled', false));
}

function init_switch(mapChile, map, mapId, divId) {
    const switchId = `vis-mode-${mapId}`;
    $(`#${divId}`).html(`<select name="vis-mode" id="${switchId}">` +
        '<option value="choropleth_layer">Intensidad por comuna</option>' +
        '<option value="boolean_heatmap_layer">Mapa de calor</option>' +
        '<option value="markers_layer">Clusters de marcadores</option>' +
        '</select>');
    
    const $switch = $(`#${switchId}`);
    $switch.on('change', function() {
        update_vis(mapChile, map);
    });

    return $switch;
}

$(function () {
    const chile = L.latLng(-37.020664, -71.341087);
    //const santiago = L.latLng(-33.453289, -70.8189348);
    //const huechuraba = L.latLng(-33.377331, -70.638138);
    const vitacura = L.latLng(-33.393791, -70.591362);

    //const heatmapLayer = init_boolean_heatmap(santiago, 6, 'map');
    const mapChile = init_map(chile, 4, 'map-chile');
    const map = init_map(vitacura, 10, 'map');
    //const $switch = init_switch(mapChile, map, 'map', 'map-vis-mode-widget');

    /* visualize */
    $('#concept-search').on('submit', function() {
        $('#update-vis').prop('disabled', true);
        update_vis(mapChile, map);
    });

    /* autocomplete */
    data.concept().then(d => {
        const concepts = Object.keys(d);
        $('#concept').autocomplete({
            maxResults: 10,
            source: function(request, response) {
                var results = $.ui.autocomplete.filter(concepts, request.term);
                response(results.slice(0, this.options.maxResults));
            }
        });
    });
});