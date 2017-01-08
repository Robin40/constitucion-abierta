function csv(file) {
	return new Promise((resolve, reject) =>
		Plotly.d3.csv(file, (error, json) =>
			error ? reject(error) : resolve(json)));
}

function json(file) {
	return new Promise((resolve, reject) =>
		$.getJSON(file).done(resolve).fail(reject));
}

function zipped_file(file) {
	return new JSZip.external.Promise((resolve, reject) =>
		JSZipUtils.getBinaryContent(file, (err, data) =>
			err ? reject(err) : resolve(data)))
	.then(JSZip.loadAsync).then(zip => {
		const innerFile = Object.values(zip.files)[0].name;
		console.log('innerFile', innerFile);
		return zip.file(innerFile).async('string');
	});
}

const zipped_json = file => zipped_file(file).then(JSON.parse);

const zipped_csv = file => zipped_file(file).then(d3.csvParse);

const is_perez_null = x => x === '\\N';
const clean_perez_null = x => is_perez_null(x) ? null : +x;

function clean_ela_row(d) {
	return {
		idEla: d.idEla,
        lat: clean_perez_null(d.lat),
        lng: clean_perez_null(d.lng),
        commune: d.comuna,
        date: new Date(d.fecha)
	};
}

const clean_concept = concept =>
	concept.replace(/__/g, ', ').replace(/_/g, ' ');

function clean_concept_row(d) {
	return {
		idEla: d.idEla,
		tema: d.tema,
		concept: clean_concept(d.concepto)
	};
}

const groupProp = R.compose(R.groupBy, R.prop);
const indexProp = R.compose(R.indexBy, R.prop);

const _concept = zipped_csv('viz_conceptos.zip')
    .then(R.compose(groupProp('concept'), R.map(clean_concept_row)));

const _ela = csv('viz_ela_ubicacion.csv')
    .then(R.compose(indexProp('idEla'), R.map(clean_ela_row)));

const _commune = csv('viz_comunas.csv')
    .then(indexProp('nombre'));

function NullPropException(prop) {
	this.name = "NullPropException";
	this.message = `Oops, ${prop} is null`;
	this.stack = (new Error()).stack;
}
NullPropException.prototype = Object.create(Error.prototype);
NullPropException.prototype.constructor = NullPropException;

const tryProp = prop => obj => {
	if (prop == null)
		return obj;
	const value = obj[prop];
	if (value == null)
		throw new NullPropException(prop);
	return value;
}

const data = {
	concept: concept => _concept.then(tryProp(concept)),
	ela: idEla => _ela.then(tryProp(idEla)),
	commune: name => _commune.then(tryProp(name))
};

function ela_location(idEla) {
	return data.ela(idEla).then(ela =>
		(ela.lat == null || ela.lng == null) ?
			data.commune(ela.commune) : ela
	).catch(error => {
		if (error instanceof NullPropException)
			return null;
		throw error;
	});
}

/*
function concept_locations(concept) {
	return data.concept(concept).then(
		R.compose(R.filter(x => x != null), Promise.all,
			R.map(d => ela_location(d.idEla))));
}
*/

function concept_locations(concept) {
	return data.concept(concept).then(D => {
		const locations = Promise.all(
			R.map(d => ela_location(d.idEla), D));
		const filtered = locations.then(R.filter(x => x != null));
		return filtered;
	}).catch(error => {
		if (error instanceof NullPropException)
			return [];
		throw error;
	});
}

function concept_heatmap(concept) {
	return concept_locations(concept).then(boolean_heatmap);
}