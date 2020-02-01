/** Main Process **/ 

const {app, BrowserWindow, ipcMain} = require('electron'); 
const {dialog}  = require('electron'); 
const url 		= require('url'); 
const path 		= require('path');
const fs 		= require('fs');
	
const PARSER	= require('./XML_PARSER'); 

/** Global Variables (States variables) ***/ 

global.sharedObj = {
	// System Config
	domainUrl: 		'',   
	authTicket: 	'',
	tempLocation: 	'', 

	applicationRepo: {}, 
	applicationSelected: '',	

	tableRepo : {},					// Table Repository Contains all table and field info 
	tableRelationships: {},
	tablesSelected: [], 			// [parent, child-1, child-2]

	fieldRepo: {},
	exportList: []
};

let win;							// The browserWindow variable

/** End Global Variables ******************************************/ 

// When the browser window is ready, 
// load the login page. 
  
app.on('ready', function() {
	
	win = new BrowserWindow(
		{width: 300, height: 485}); 
	win.loadURL(
		url.format({
			pathname: path.join(__dirname, 'Pages/step_1_login.html'), 
			protocol: 'file', 
			slashes: true
		}));

	win.on('closed', () => {
		console.log(fileLocation);
		// Remove the temporary directory 
		fs.rmdirSync(fileLocation, (err) => {
			console.log('temp directory removes')});
		win = null

	});
});

/** PAGE GETTERS ***************************************************
*******************************************************************/

ipcMain.on('getSelectApp', (event, props) => {

	win.loadURL(url.format({
		pathname: path.join(__dirname, 'Pages/step_2_selectApp.html'),
		protocol: 'file',
		slashes: true
	}));
}); 
 
ipcMain.on('getSelectTables', (event, props) => {
	
	win.loadURL(url.format({
		pathname: path.join(__dirname, 'Pages/step_3_selectTables.html'),
		protocol: 'file',
		slashes: true
	}));		
});

ipcMain.on('getExportReview', (event, props) => {

	win.loadURL(url.format({
		pathname: path.join(__dirname, 'Pages/step_5_exportReview.html'),
		protocol: 'file',
		slashes: true 
	}));
});

ipcMain.on('getExportRecords', (event, props) => {

	// Prompt the user where to save the exports.
	var saveFileLocation = dialog.showOpenDialog(win, {properties: ['openDirectory']});
	if (!fs.existsSync(saveFileLocation[0])){
    	fs.mkdirSync(path.join(saveFileLocation[0])); 
	}
	global.sharedObj.saveFileLocation = saveFileLocation; 

	win.loadURL(url.format({
		pathname: path.join(__dirname, 'Pages/step_6_exportRecords.html'), 
		protocol: 'file', 
		slashes: true 
	}));

});

/** GLOBAL VARIABLE SETTERS ******************** 
***********************************************/

ipcMain.on('setSystemConfig', (event, props) => {
	global.sharedObj.authTicket = props.authTicket;
	global.sharedObj.domainUrl  = props.domainUrl;  

	// Set temporary file location for xml I/0 processing; 
	var tempLocation = fs.mkdtempSync(
		path.join(app.getPath('temp'), 'amacsam')); 
	global.sharedObj.tempLocation = tempLocation; 
}); 

ipcMain.on('setApplicationRepo', (event, props) => {
	global.sharedObj.applicationRepo = props.appList; 
}); 

ipcMain.on('setApplicationSelected', (event, props) => {
	global.sharedObj.applicationSelected = props.selectedApp; 
}); 

ipcMain.on('setTableRepo', (event, props) => {
	global.sharedObj.tableRepo = props.tableRepo; 
}); 

ipcMain.on('setTableRelationships', (event, props) => {
	global.sharedObj.tableRelationships = props.tableRelationships; 
});

ipcMain.on('setTablesSelected', (event, props) => {
	global.sharedObj.tablesSelected = props.tablesSelected; 
});

ipcMain.on('setFieldRepo', (event, props) => {
	global.sharedObj.fieldRepo = props.fieldRepo; 
});

ipcMain.on('setExportList', (event, props) => {
	global.sharedObj.exportList = props.exportList; 
});
