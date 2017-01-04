function update_vis($switch, map) {
    const concept = $('#concept').val();
    /*
    concept_heatmap(concept).then(heatmap => {
        show_boolean_heatmap(heatmapLayer, heatmap);
        $('#num-ubicaciones').text(heatmap.points.length);
    });
    */
    concept_locations(concept).then(locations => {
        const get_layer = window[$switch.val()];
        show_overlay(get_layer(locations), map);
        $('#num-ubicaciones').text(locations.length);
    });
}

function init_switch(map, mapId, divId) {
    const switchId = `vis-mode-${mapId}`;
    $(`#${divId}`).html(`<select name="vis-mode" id="${switchId}">` +
        '<option value="boolean_heatmap_layer">Mapa de calor</option>' +
        '<option value="markers_layer">Clusters de marcadores</option>' +
        '<option value="colorpleth_layer">Intensidad por comuna</option>' +
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