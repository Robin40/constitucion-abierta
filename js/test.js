function update_vis($switch, map) {
    const concept = $('#concept').val();

    concept_locations(concept).then(locations => {
        $('#num-ubicaciones').text(locations.length);
        const get_layer = window[$switch.val()];
        get_layer(locations).then(layer => {
            show_overlay(layer, map);
        });
    });
}

function init_switch(map, mapId, divId) {
    const switchId = `vis-mode-${mapId}`;
    $(`#${divId}`).html(`<select name="vis-mode" id="${switchId}">` +
        '<option value="boolean_heatmap_layer">Mapa de calor</option>' +
        '<option value="markers_layer">Clusters de marcadores</option>' +
        '<option value="choropleth_layer">Intensidad por comuna</option>' +
        '</select>');
    
    const $switch = $(`#${switchId}`);
    $switch.on('change', function() {
        update_vis($switch, map);
    });

    return $switch;
}

$(function () {
    const santiago = L.latLng(-33.453289, -70.8189348);

    //const heatmapLayer = init_boolean_heatmap(santiago, 6, 'map');
    const map = init_map(santiago, 6, 'map');
    const $switch = init_switch(map, 'map', 'map-vis-mode-widget');

    /* visualize */
    $('#concept-search').on('submit', function() {
        update_vis($switch, map);
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