const {ipcRenderer, remote } = require('electron');
var request                  = require('request');
var PARSER                   = require('../XML_PARSER'); 
var fs 						 = require('fs');	

/* SelectTable Modules *************************************/ 

function getTable(dbid) {
	var query = 
		"https://amacsam.quickbase.com" + 
		"/db/" + dbid + "?" + 
		"a=API_DoQuery" + 
		"&clist=a" + 
		"&fmt=structured" + 
		"&ticket=" +  remote.getGlobal('sharedObj').authTicket; 

	return new Promise((resolve, reject) => {
		request(query, function(error, response, body) {
			if (error)
				reject(response);

			resolve(body);
		});
	});
}

function saveTable(fileBody, dbid) {
	var tmp = remote.getGlobal('sharedObj').tempLocation; 
		tmp += "//"+dbid+".xml";

	// Remove problematic XML line breaks 
	var newBody = fileBody.replace(/<BR\/>/g, '');
	fs.writeFileSync(tmp, newBody);
}

function saveFields(selectedTables) {
	var fieldRepo = {};
	selectedTables.forEach(dbid => {
    	var file = fs.readFileSync(remote.getGlobal('sharedObj')
        	.tempLocation+"\\"+dbid+".xml");
    	var fieldList = PARSER.parse_fields(file);
		fieldRepo[dbid] = fieldList;
	});
	return fieldRepo;
}


/* Render Process *************************************************/ 

var applicationSelectedName = 
	remote.getGlobal('sharedObj').applicationRepo[
		remote.getGlobal('sharedObj').applicationSelected
	].name;  

var fileBody = fs.readFileSync(
	remote.getGlobal('sharedObj').tempLocation+
	"//granted_DBs.xml");

var tableList = PARSER.parse_childern_DBs(
	fileBody, applicationSelectedName); 

ipcRenderer.send('setTableRepo', {tableRepo: tableList}); 

async function submit() {
	// IMPORTANT: Ensure SelectedTable is index 0 
	var tablesSelected = [];
	tablesSelected.push(querySelectedParent());   
	
	// Save Relationships
	var relationships = {}; 	
	var responseBody = await getTable(tablesSelected[0]);
	await saveTable(responseBody, tablesSelected[0]);	

	relationships[tablesSelected[0]] = 
		PARSER.parse_relationships(responseBody);   

	ipcRenderer.send('setTableRelationships', 
		{tableRelationships: relationships});
	
	// Append relationships Parent-child tables 
	var child_dbids = Object.keys(relationships[tablesSelected[0]].dblinks); 
	tablesSelected = tablesSelected.concat(child_dbids);

	// Save All Tables
	for (var i = 1; i < tablesSelected.length; i++) {
		console.log('Saving table ' + tablesSelected[i]+"...");
		var responseBody = await getTable(tablesSelected[i]);
		await saveTable(responseBody, tablesSelected[i]);
	}	

	// Set Field Repo
	var fieldRepo = saveFields(tablesSelected);
	ipcRenderer.send('setFieldRepo', {fieldRepo: fieldRepo});


	ipcRenderer.send('setTablesSelected', 
		{tablesSelected: tablesSelected});
	ipcRenderer.send('getExportReview'); 
}