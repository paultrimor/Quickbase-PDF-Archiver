const {ipcRenderer, remote} = require('electron'); 
const DOMParser    			= new require('xmldom').DOMParser; 
const PARSER                = require('../XML_PARSER'); 
const fs 					= require('fs');
var pdf 					= require('html-pdf');

/** Render Process ************************************************/ 

var exportList 			= remote.getGlobal('sharedObj').exportList;
var appSelected 		= remote.getGlobal('sharedObj').applicationSelected;
var tableRepo 			= remote.getGlobal('sharedObj').tableRepo;
var tablesSelected 		= remote.getGlobal('sharedObj').tablesSelected;
var tableRelationships 	= remote.getGlobal('sharedObj').tableRelationships; 
var fieldRepo			= remote.getGlobal('sharedObj').fieldRepo;	 
var fieldsSelected 		= remote.getGlobal('sharedObj').fieldsSelected;
var tempLocation 		= remote.getGlobal('sharedObj').tempLocation; 
var saveFileLocation 	= remote.getGlobal('sharedObj').saveFileLocation; 

var tableDom = {};
var records = {};

var parentDbid = tablesSelected[0];

// Construct XML string; 
function construct_xml(record, dbid) {
	var STRING = "<table>";

	var keys = Object.keys(record); 
	for( var i = 0; i < keys.length; i ++) {

		// Parent fields
		if (Number.isInteger(parseInt(keys[i]))) {
			STRING += "<tr><td colspan='2' style='height: 30px !important'></td></tr>"; //spacer
			STRING += "<tr><th colspan='2'><strong>"+tableRepo[dbid].name+" #"+keys[i]+"</strong></th></tr>"
			var fids = Object.keys(record[keys[i]]);
			for (var j = 0; j < fids.length; j++){
				STRING += "<tr>"; 
				STRING += "<td>" + fieldRepo[dbid][fids[j]].label + "</td>";
				STRING += "<td>" + record[keys[i]][fids[j]] + "</td>";
				STRING += "</tr>"; 
			}

		} 
		else {
			STRING += "<tr>";
			STRING += "<td>" + tableRepo[keys[i]].name + "</td>";
			STRING += "<td>" + construct_xml(record[keys[i]], keys[i]) + "</td>";
			STRING += "</tr>";
		}
	}

	STRING += "</table>";
	return STRING;
}		

function savePDF(filepath, html) {
	return new Promise((resolve, reject) => {

		var options = {
			format: 'Letter', 
			orientation: 'portrait', 
			border: '10mm'
		};

		pdf.create(html, options).toFile(filepath, function(err, res) {
				if (err) return reject(err); 
				else resolve(res);
		})
	}); 
}

/* Render Process **************************************************/
async function exportRecords() {
	// Populate tableDom{} 
	console.time('parsing-tables');
	for (var i = 0; i < tablesSelected.length; i++) {
		var doc = fs.readFileSync(
			tempLocation+"//"+ tablesSelected[i]+".xml", 'utf-8');
		tableDom[tablesSelected[i]] = new DOMParser().parseFromString(doc+"", 'utf-8');
	} 
	console.timeEnd('parsing-tables');

	// Populate records{}
	for (var i = 0; i < exportList.length; i++) {
		console.time('processing-record-'+exportList[i]);
		var fields = PARSER.parse_record(
			tableDom[parentDbid],
			tableRelationships[parentDbid].key,
			exportList[i]
		);
		records[exportList[i]] = fields; 

		//  Parse Assocaited Table
		for (var k = 1; k < tablesSelected.length; k++) {

			var fields = PARSER.parse_record(
				tableDom[tablesSelected[k]], 
				tableRelationships[parentDbid].dblinks[tablesSelected[k]], 
				exportList[i]
			);
			records[exportList[i]][tablesSelected[k]] = fields; 
		}
		console.timeEnd('processing-record-'+exportList[i])
	}

	// Create PDF
	console.time('creating-PDFs');
	for (var i = 0; i < exportList.length; i++) {
		console.log('creating PDF for '+exportList[i]+"...");
		var html = 
		`<style>
			table {
				width: 100%; 
				border: 2px solid black;
				margin-top: 10px;
			}
			table tr:nth-child(even) {
				background-color: lightgrey;
			}
			td, th {
				padding: 5px;
			}
			th {
				background-color: black; 
				color: white; 
				text-align: left;
			}
		</style>`;

		html += "<h2>Record: "+exportList[i]+"</h2>"; 
		html += "<p>exported @ "+new Date()+"</p>";

		html += construct_xml(records[exportList[i]], parentDbid);
		var filepath = saveFileLocation+'/Quickbase-Exports/'+exportList[i]+".pdf"; 

		await savePDF(filepath, html).then(function(result) {
			console.log(result);
		}).catch(function(error) {
			console.log(error);
		});

	}	
	console.timeEnd('creating-PDFs');
	document.getElementById('status').innerHTML = "done";
}
exportRecords();