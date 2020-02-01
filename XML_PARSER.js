var DOMParser    = new require('xmldom').DOMParser; 
var xpath 		 = require('xpath'); 
var builder 	 = require('xmlbuilder'); 
var fs 			 = require('file-system'); 
const dialog 	 = require('electron'); 
var users_lookup = require('./res/users_lookuptable.js');

/* Parameter: xml string - response body from API_Authenticate
 *
 * Returns: An Object that contains the and errorCode is returned. 
 * 			If authentication is successful, the ticket is returned. 
 */
function parse_authentication(responseBody) {
 	
 	var xmlDom = new DOMParser().parseFromString(responseBody);
	var errorCode = xmlDom.getElementsByTagName('errcode')[0].childNodes[0]; 

	if (parseInt(errorCode) == 0) {
	
		/* If the API call is a success, 
	 	 * then parse and return the authentication ticket
	 	 * also return a code for Render process error handling
		 */ 
		return { 
			errorCode: 0, 
			ticket: xmlDom.getElementsByTagName('ticket')[0].childNodes[0]
		};

	} else {
		
		/* If the API call fails,
		 * then parse and return the authentication ticket
		 * also return a code for Render process error handling
		 */
		return {
			errorCode: 1, 
			errorText: 	xmlDom.getElementsByTagName('errtext')[0].childNodes[0], 
			errorDetail:  xmlDom.getElementsByTagName('errdetail')[0].childNodes[0]
		}; 
	}
}

/* Parameter: xml string - response body from API_GrantedDBs
 *
 * Returns: appList - an array that includes all the application level,   
 * 			database ids, represented as an object that goes as follows:
 *			{name: "application name", id : dbid}
 */
function parse_granted_DBs(responseBody) {

	var doc = new DOMParser().parseFromString(responseBody); 
	var nodes = xpath.select('//dbinfo[not(contains(dbname, ":"))]', doc); 

	var appList = {}; 

	for ( var i = 0; i < nodes.length; i++) {

		// Extract the name and dbid from API_GrantedDBs
		var name = nodes[i].childNodes[1].childNodes[0].data; 
		var dbid = nodes[i].childNodes[3].childNodes[0].data; 

		appList[dbid] = {name: name, dbid: dbid}; 
	}

    return appList; 
}

/* Parameter: fileLocation for xml file saved in the response. 
 *			  object - selectedApplication saved in the main process, 
 *
 * Returns: tableList - an object with a list of all the childern in 
 * 			the selected applicaiton, along with the student table. 
 *   		represented as follows: 
 *			{name: "application name", id: dbid, isStudent: boolean}
 *
 *			During the document parsing detects the Student table and
 *			stores it separately for separate processing. 
 *
 */ 
function parse_childern_DBs(fileBody, selectedApplication) {
	var doc = new DOMParser().parseFromString(fileBody+"");

	var path = "//dbinfo[contains(dbname,'"+selectedApplication+"')]"; 
	var nodes = xpath.select(path, doc);

	var tableList = {}; 
	for(var i = 0; i < nodes.length; i++) {

		// Extract the name and dbid from API_GrantedDBs
		var name = nodes[i].childNodes[1].childNodes[0].data; 
		var dbid = nodes[i].childNodes[3].childNodes[0].data;  

		// String processing for more accurate check 

		name = name.substring(name.indexOf(":") + 1, name.length);
		name = name.trim(); 
		
		tableList[dbid] = {name: name, dbid: dbid};		
	}
	
	return tableList; 	
}

/* Parameter: xml document string, results from API_DoQuery (structured)
 *			  pulled using fs I/O sync read
 *
 * Returns: fieldsList - an array of objects that represents a field as follows: 
 *			[{fid: 9999, fieldLabel: Student Status, fieldType: text}, {}, {}, ... {}]
**/ 
function parse_fields(responseBody) {

	var doc = new DOMParser().parseFromString(responseBody+""); 
	var nodes = xpath.select("//field", doc);

	var fieldList = {}; 
	for (var i = 0; i < nodes.length; i++) {

		var id = nodes[i].attributes[0].nodeValue; 
		var type = nodes[i].attributes[1].nodeValue; 
		var label = nodes[i].childNodes[1].childNodes[0].data;

		fieldList[id] = {type: type, label: label};

	}

	return fieldList; 
}

/* Parameter: xml file from Do_Query.  
 *
 * Return: int data for student key field. 
**/ 
function parse_relationships(fileBody) {
	var doc = new DOMParser().parseFromString(fileBody+"");

	var node = xpath.select("//key_fid", doc); 
	var key = parseInt(node[0].childNodes[0].data);

	var nodes = xpath.select('//field[@field_type="dblink"]', doc); 

	var dblinks = {}; 
	for (var i = 0 ; i < nodes.length; i++) {	
		var targetDbid 	= xpath.select("target_dbid/text()", nodes[i])[0].data;
		var targetFid 	= xpath.select("target_fid/text()", nodes[i])[0].data;

		dblinks[targetDbid] = targetFid;
	}

	return {'key': key, 'dblinks': dblinks}; 
}
 
/* Parameter: xml file from Do_Query
 * 
 * Return: Array of all record ids
**/ 
function parse_records(fileBody, key) {
	
	var doc = new DOMParser().parseFromString(fileBody, 'utf-8');

	var nodes = xpath.select('//record/f[@id="'+ key+'"]/text()', doc);

	var recordList = [];
	for(var i = 0; i < nodes.length; i++) {
		recordList.push(nodes[i].data); 
	}

	return recordList; 
}

/* This function returns the record_keys from the file. 
 * You can filter the records returned by setting 
 * the fid and value parameter. 
**/ 
function parse_keys(API_DoQuery, fid, value) {

	var keys = [];

	var doc = new DOMParser().parseFromString(API_DoQuery+"", 'utf-8');

	var node = xpath.select("//key_fid", doc); 
	var key = parseInt(node[0].childNodes[0].data);

	var nodes; 
	if (fid == null) {
		nodes = xpath.select(
			`qdbapi/table/records/record
			/f[@id="`+key+`"]/text()`, doc);
	} else {
		nodes = xpath.select(
			`qdbapi/table/records/record
			/f[@id="`+fid+`" and text()="`+value+`"]
			/parent::record/f[@id="`+key+`"]/text()`, doc);

	}

	for (var i = 0; i < nodes.length; i++) {
		keys.push(nodes[i].data);
	}

	return keys;
}

function parse_record(tableDom, id_fid, id_value) {

	var record = [];   

 	var xpath_record = "/qdbapi/table/records/record/f[@id='" + id_fid + "' and text()='" + id_value + "']/parent::record";
 	var records = xpath.select(xpath_record, tableDom); 

 	for (var i = 0; i < records.length; i++) {
 		var fields = xpath.select("./f", records[i]);
 		var record_fields = {};
 		for (var k = 0; k < fields.length; k++) {
 			var field_id = fields[k].attributes[0].nodeValue; 
 			var field_data = fields[k].childNodes.length != 0 ? 
 				fields[k].childNodes[0].nodeValue : '';
 			record_fields[field_id] = field_data;
 		} 
 		record.push(record_fields);
	}
	return record;
}

/* Export Utility Function */ 

/**
 * Description: Is responsible for formatting the input data in a more 
 *				human readable format. 
 *
 * Parameters: value - the value that will be processes
 *			   type - the type of field 
 * Returns: newValue - a new human readable value 
**/ 

function format(value, type) {

	var newValue; 

	switch(type) {
	case 'userid':	
	case 'date':
	case 'timestamp':
		if (value == 'undefined') {
			newValue = '<i>undefined';
		} else {
            newValue = new Date(parseInt(value));
		}
		break;  
	case 'timeofday':
		newValue = parseInt((value / 1000) / 36); 
		newValue = newValue.toString(); 
		if (newValue.length > 3) {
			newValue = newValue.slice(0, 2) + ":" + newValue.slice(2, 4);
		} else {
			newValue = newValue.slice(0, 1) + ":" + newValue.slice(1, 4);
		}
		break;
	case 'duration':
		newValue = parseInt((value / 1000) / 60); 
		newValue = newValue.toString() + "m"; 
		break;
	case 'text':
	case 'recordid':
	case 'text':
	case 'checkbox':
	case 'email':
	case 'float':
	case 'recordid':
	case 'text':
	
	default: 
		newValue = value;
	}

	return newValue;
}

module.exports.parse_authentication = parse_authentication; 
module.exports.parse_granted_DBs 	= parse_granted_DBs; 
module.exports.parse_childern_DBs 	= parse_childern_DBs; 
module.exports.parse_fields 		= parse_fields;
module.exports.parse_relationships 	= parse_relationships;
module.exports.parse_records 		= parse_records; 
module.exports.parse_record 		= parse_record;
module.exports.parse_keys			= parse_keys; 