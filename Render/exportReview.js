const { ipcRenderer, remote } = require('electron');
var request                   = require('request');
var PARSER                    = require('../XML_PARSER'); 
var async                     = require('async');  
var fs 						  = require('fs');

/** Render Process *****************************************************/

var fileBody = fs.readFileSync(
	remote.getGlobal('sharedObj').tempLocation+"//"+
	remote.getGlobal('sharedObj').tablesSelected[0]+".xml" 
); 

var fid_id = remote.getGlobal('sharedObj').tableRelationships[
	remote.getGlobal('sharedObj').tablesSelected[0]
].key;

var exportList = PARSER.parse_keys(fileBody, null, null); 
ipcRenderer.send('setExportList', {exportList: exportList});

document.getElementById('submit').addEventListener('click', function() {
	ipcRenderer.send('getExportRecords');
}); 






