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

const lerp = (from, to, t) => from + (to - from)*t;

const blue_blue = chroma.scale(['#a0ffff', '#0000a0']).mode('hsv');
const white_black = chroma.scale(['#ffffff', '#000000']);
const white_blue = chroma.scale(['#ffffff', '#0000a0']);

//const communes_geojson = json('Chile_AL8.GeoJson');
const communes_geojson = zipped_json(`${data_}Chile_AL8.min.zip`);

function medians(parts, sortedArray) {
    const n = sortedArray.length;
    return R.range(1, parts).map(i => sortedArray[(n/parts*i) | 0]);
}

function bs_last(pred, sortedArray) {
    let l = -1, r = sortedArray.length - 1;
    while (l !== r) {
        let m = (l + r + 1)>>1;
        if (m === -1 || pred(sortedArray[m], m, sortedArray))
            l = m;
        else
            r = m - 1;
    }
    return r;
}

const elvisified = obj => prop => obj[prop] != null ? obj[prop] : {};

function choropleth_layer(locations) {
    const parts = 7;

    function get_groupById(locations) {
        return data.commune().then(_D => {
            const D = elvisified(_D);
            return R.groupBy(d => d.id || D(d.commune).id, locations);
        });
    }

    return Promise.join(
            get_groupById(locations),
            data.commune_by_id(),
            communes_geojson, (groupById, _byId, communes) => {
        const byId = elvisified(_byId);

        const countById = R.map(group => group.length, groupById);
        const densityById = R.mapObjIndexed((count, id) =>
            count/byId(id).cantidadElas || 0, countById);
        const densities = Object.values(densityById);
        const sortedDensities = R.sort(R.substract, densities);
        const densityMedians = medians(parts, sortedDensities);

        const concept = $('#concept').val();

        function style(feature) {
            const id = +feature.properties.tags['dpachile:id'];
            const part = bs_last(m =>
                m <= densityById[id], densityMedians);
            const intensity = part/(parts - 1);

            const color = white_blue(intensity).hex();
            const alpha = .7; //lerp(.4, 1, intensity);
            return {
                color: '#404040',
                fillColor: color,
                fillOpacity: alpha,
                weight: 0.5
            };
        }

        function onEachFeature(feature, layer) {
            const id = +feature.properties.tags['dpachile:id'];
            const commune = byId(id);
            /*
            layer.bindPopup(`${commune.nombre}
                <span style="font-size:xx-small">
                    <b>(${commune.region})</b></span><hr>
                <b>Núm. ubicaciones</b>: ${countById[id] || 0}<br>
                <b>Cantidad ELAs</b>: ${commune.cantidadElas}<br>
                <b>Población total</b>: ${commune.poblacion}`)
            */
            layer.bindPopup(`${commune.nombre}
                <span style="font-size:xx-small">
                    <b>(${commune.region})</b></span><hr>
                <div style="width:16em" class="truncated">
                    <b>${concept}</b></div>
                <b>mencionado en</b> ${countById[id] || 0}
                 <b>de</b> ${commune.cantidadElas} <b>ELAs</b>`);
            /*.on('mouseover', e => layer.openPopup())
            .on('mouseout', e => layer.closePopup());*/
        }

        function fundaments_nav_html(id) {
            const commune = byId(id);
            return `Encuentros Locales Autoconvocados para la comuna
                <span class="strong">"${commune.nombre}"</span>
                con concepto
                <span class="strong">"${concept}"</span>
                `;
        }

        function location_info(d) {
            const date = d.date;
            const females = d.participants.filter(p => p.sex === 'F');
            const   males = d.participants.filter(p => p.sex === 'M');
            const acuerdo = {
                A: 'Acuerdo', P: 'Parcial', D: 'Desacuerdo'
            }[d.acuerdo];

            return `<tr><td style="text-align:center">
                <a target="_blank"
                href="http://actas-encuentros-locales.unaconstitucion` +
                `parachile.cl/encuentros/${d.link}.html">
                    <i class="fa fa-external-link" aria-hidden="true"></i>
                </a>
            </td><td style="text-align:right">
                ${date.getDate()}/${date.getMonth()}/${date.getFullYear()}
            </td><td style="text-align:right">
                <b>${females.length}</b>&#9792;
            </td><td style="text-align:right">
                <b>${males.length}</b>
            </td><td style="text-align:left">
                &#9794;
            </td><td style="text-align:center; padding:1px 1em">
                ${acuerdo}
            </td><td title="${d.fundament}" style="min-width:32em">
                <table class="fixed-table"><tr><td class="truncated">
                    ${d.fundament}
                </td></tr></table>
            </td></tr>`;
        }

        const thead = `<thead><tr>
            <th>Link</th> <th style="text-align:center">Fecha</th>
            <th colspan="3">Participantes</th>
            <th style="padding:1px 1em">Acuerdo</th>
            <th style="text-align:left">Fundamento</th>
        </tr></thead>`;

        return communes_geojson.then(communes =>
            L.geoJSON(communes, {
                style: style,
                onEachFeature: onEachFeature
            }).on('click', e => {
                const feature = e.layer.feature;
                const id = +feature.properties.tags['dpachile:id'];
                const group = groupById[id] || [];
                const sortedGroup = R.sortBy(R.prop('date'), group);
                const rows = R.map(location_info, sortedGroup);
                const table = `<table class="fundament-table">${thead}<tbody>
                    ${rows.join('')}</tbody></table>`;
                $('#fundaments-nav').html(fundaments_nav_html(id));
                $('#fundament-list').html(table);
            })
        );
    });
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