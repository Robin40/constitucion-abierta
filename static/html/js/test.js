function update_map(get_layer, map, locations) {
    return get_layer(locations).then(layer => {
        show_overlay(layer, map);
    });
}

function map_caption_html(concept) {
    return `Visualización del concepto
        <span class="strong"><b>"${concept}"</b></span>`;
}
/*
function info_html(info) {
    return `<b>Número de ubicaciones</b>: ${info.numUbicaciones}<br>
        ${info.acuerdos.A} <b>acuerdos</b>,
        ${info.acuerdos.P} <b>ac. parciales</b> y
        ${info.acuerdos.D} <b>desacuerdos</b>`;
}
*/
function info_group_html(attr, value) {
    const inner = value == null ?
        attr : `<div class="attr">${attr}</div>
            <div class="value">${value}</div>`;
    return `<div class="info-group">${inner}</div>`;
}

function info_html(info) {
    const concept = $('#concept').val();
    const attrs = [
        'Visualización a nivel nacional',
        'Concepto:',
        'Núm. menciones:',
        'Acuerdos:',
        'Ac. parciales:',
        'Desacuerdos:'
    ];
    const values = [
        null,
        //`<div class="strong small truncated">${concept}</div>`,
        `<div title="${concept}" class="strong small truncated">
            ${concept}</div>`,
        info.numUbicaciones || 0,
        info.acuerdos.A || 0,
        info.acuerdos.P || 0,
        info.acuerdos.D || 0
    ];
    const info_groups = R.range(0, attrs.length).map(i =>
        info_group_html(attrs[i], values[i]));

    return info_groups.join('');
}

function update_info(locations) {
    const concept = $('#concept').val();
    $('#map-caption').html(map_caption_html(concept));
    $('#info').html(info_html(locations_info(locations)));
}

function update_vis(mapChile, map) {
    const concept = $('#concept').val();

    return concept_locations(concept).then(locations => Promise.all([
        update_map(boolean_heatmap_layer, mapChile, locations),
        update_map(choropleth_layer, map, locations),
        update_info(locations)
    ])).finally(_ => $('#update-vis').prop('disabled', false));
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
    data.concepts_list().then(d => {
        const concepts = Object.keys(d);

        $('#concept').autocomplete({
            maxResults: 10,
            source: function(request, response) {
                var results = $.ui.autocomplete.filter(concepts, request.term);
                response(results.slice(0, this.options.maxResults));
            },
            autoFocus: true,
            delay: 0,

        }).data('ui-autocomplete')._renderItem = function(ul, item) {
            const concept = item.value;
            const html = `<li><span>
                <span style="width:6em; display:table-cell" class="strong">
                    ${tema_name(d[concept].tema)}</span>
                ${concept}
            </span></li>`;
            /*const html = `<span style="width:7em; display:table-cell"
                class="strong">${tema_name(d[concept].tema)}</span>
                <li>${concept}</li>`;*/

            return $(html).data('item.autocomplete', item).appendTo(ul);
        };
    });
});