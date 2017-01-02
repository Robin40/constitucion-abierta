function init_switch(divId) {
    $(`#${divId}`).html('<select name="visualization-mode" id="visualization-mode">' +
        '<option value="heatmap">Mapa de calor</option>' +
        '<option value="colorpleth">Intensidad por comuna</option>' +
        '</select>');
}

$(function () {
    const santiago = L.latLng(-33.453289, -70.8189348);

    const heatmapLayer = init_boolean_heatmap(santiago, 6, 'map');
    init_switch('map-visualization-mode-widget');

    $('#concept-search').on('submit', function() {
        const concept = $('#concept').val();
        concept_heatmap(concept).then(heatmap => {
            show_boolean_heatmap(heatmapLayer, heatmap);
            $('#num-ubicaciones').text(heatmap.points.length);
        });
    });

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
    
/*
    data.concept().then(d => {
        $('#concept').autocomplete({
            source: Object.keys(d)
        });
    });
*/
});