function get_concept() {
    return capitalized_first($('#concept').val());
}

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
        attr : `<div class="attr adaptable-large">${attr}</div>
            <div class="value adaptable-large">${value}</div>`;
    return `<div class="info-group">${inner}</div>`;
}

function info_html(info) {
    const concept = get_concept();
    const attrs = [
        $('<div class="strong adaptable-large">').prop('title', concept)
            .text(concept)[0].outerHTML,
        'Menciones totales a nivel nacional',
        'Acuerdos',
        'Ac. parciales',
        'Desacuerdos'
    ];
    const values = [
        null,
        `<div style="font-size:larger">${info.numUbicaciones || 0}</div>`,
        info.acuerdos.A || 0,
        info.acuerdos.P || 0,
        info.acuerdos.D || 0
    ];
    const info_groups = R.range(0, attrs.length).map(i =>
        info_group_html(attrs[i], values[i]));

    return info_groups.join('');
}

function update_info(locations) {
    const concept = get_concept();
    $('#map-caption').html(map_caption_html(concept));
    $('#info').html(info_html(locations_info(locations)));
    $('#contextual-help').html(`Haz click en una comuna para ver los ELAs
        que mencionan <span class="strong">"${concept}"</span>
        y sus fundamentos`);
    $('#fundaments-nav').empty();
    $('#fundament-list').empty();
}

function update_vis(mapChile, map) {
    const concept = get_concept();

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

function close_modal() {
    $('.modal').css('display', 'none');
}

function init_modal(modalId, buttonSel) {
    const $modal = $(`#${modalId}`);

    $(buttonSel).on('click', function() {
        close_modal();
        $modal.css('display', 'block');
    });

    $('.close').on('click', function() {
        close_modal();
    });

    $(window).on('click', function(event) {
        if (event.target == $modal[0])
            $modal.css('display', 'none');
    });
}

function hide_bubbles(bubblesTimers) {
    bubblesTimers.map(timer => clearTimeout(timer));
    $('.help-bubble').hide();
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

    init_modal('concepts-list-modal', '.examples');
    init_modal('help-modal', '#help');

    /* bubble-help timed sequence */
    const bubbleSeq = [
        'concept-bubble-help',
           'list-bubble-help',
           'help-bubble-help'];
    const bubblesTimers = bubbleSeq.map((id, i) =>
        setTimeout(() => $(`#${id} .help-bubble`).show(), i*2000));

    /* about-us */
    $('#about-us').on('click', function() {
        window.open('http://constitucionabierta.cl/quienes/', '_self');
    });

    /* visualize */
    $('#concept-search').on('submit', function() {
        $('#update-vis').prop('disabled', true);
        hide_bubbles(bubblesTimers);
        update_vis(mapChile, map);
    });

    /* autocomplete */
    data.concepts_list().then(d => {
        const concepts = Object.keys(d);

        /* basic autocomplete */
        $('#concept').autocomplete({
            maxResults: 10,
            source: function(request, response) {
                var results = $.ui.autocomplete.filter(concepts, request.term);
                response(results.slice(0, this.options.maxResults));
            },
            autoFocus: true,
            delay: 0,
            select: function(event, ui) { 
                $("#concept").val(ui.item.label);
                $("#concept-search").submit();
            }

        /* select text on focus */
        }).on('mouseup', function() {
              $(this).select();
        
        /* tema extension */
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

        /* populate concepts-list modal */
        const of_tema = tema => R.filter(concept => d[concept].tema == tema,
            concepts).sort().map(concept =>
                `<a href="#" class="concept-link">${concept}</a>`).join('<br>');

        $('#concepts-list').html(`<table><thead><tr>
            <th>Valores</th>
            <th>Derechos</th>
            <th>Deberes</th>
            <th>Instituciones</th>
        </tr></thead><tbody><tr>
            <td style="vertical-align:top">${of_tema(1)}</td>
            <td style="vertical-align:top">${of_tema(2)}</td>
            <td style="vertical-align:top">${of_tema(3)}</td>
            <td style="vertical-align:top">${of_tema(4)}</td>
        </tr></tbody></table>`);

        $('.concept-link').on('click', function() {
            const concept = $(this).text();
            close_modal();
            $('#concept').val(concept);
            $('#concept-search').submit();
        });
    });
});