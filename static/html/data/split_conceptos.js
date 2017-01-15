const d3 = require('d3');
const fsp = require('fs-promise');
const Promise = require('bluebird');
const R = require('ramda');

const inputFile = "viz_conceptos.csv";

const groupProp = prop => R.groupBy(obj => obj[prop]);

function json_to_csv(json) {
	const columns_of_row = Object.keys;
	const aRow = json.length !== 0 ? json[0] : {};
	const columns = columns_of_row(aRow);
	const columnsString = columns.join(',');

	const needs_csvify = str => /[,"]/.test(str);
	const csvified = str => `"${str.replace(/"/g, '""')}"`;
	const csvified_if_needed = str =>
		needs_csvify(str) ? csvified(str) : str;

	const row_values = row => columns.map(col => row[col]);
	const row_strings = row => row_values(row).map(csvified_if_needed);
	const row_string = row => row_strings(row).join(',');

	const rows = json;
	const rowsStrings = rows.map(row_string);

	const csvStrings = R.concat([columnsString], rowsStrings);
	const csvString = `${csvStrings.join('\n')}\n`;

	return csvString;
}

fsp.readFile(inputFile, 'utf8')
.then(csv => {
	const json = d3.csvParse(csv);

	const dataByConcept = groupProp('concepto')(json);
	const csvStringByConcept = R.map(json_to_csv, dataByConcept);

	const concept_to_filename = concept => `concept/${concept}.csv`;
	const write_one = (csvString, concept) =>
		fsp.writeFile(concept_to_filename(concept), csvString, 'utf8');
	const writeAllObj = R.mapObjIndexed(write_one, csvStringByConcept);
	const writeAll = Object.values(writeAllObj);

	return Promise.all(writeAll)
})
.then(() => console.log('Success!!'))
.catch(err => console.log(`Fail :(\n${err.stack}`));