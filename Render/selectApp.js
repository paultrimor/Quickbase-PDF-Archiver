const {ipcRenderer, remote} = require('electron');
var request                   = require('request');
var PARSER                    = require('../XML_PARSER'); 
var fs 						  = require('fs');

/* Module Processes  *********************************************/ 

function getApplicationRepo() {
    var query = 
    remote.getGlobal('sharedObj').domainUrl + 
    "/db/main?" + "a=API_GrantedDBs" +
    "&ticket=" + remote.getGlobal('sharedObj').authTicket; 

    return new Promise((resolve, reject) => {
        request(query, function(error, response, body) {

            if (error)
                reject(error);
            
            resolve(body); 
       }); 
    });
}

function saveFile(fileBody, fileName) {
    var tmp = remote.getGlobal('sharedObj').tempLocation; 
    tmp +=  fileName; 

    fs.writeFile(tmp, fileBody); 
}

/* Render Process *************************************************/ 

getApplicationRepo().then((responseBody)=> {

    saveFile(responseBody, "//granted_DBs.xml");

    var appList = PARSER.parse_granted_DBs(responseBody); 

    ipcRenderer.send('setApplicationRepo', {appList: appList});
    populateUI(appList);   

}).catch((error) => {
    console.log(error);
}); 

function submit() {
    var dbid = querySelectedApplication()    
    ipcRenderer.send('setApplicationSelected', {selectedApp: dbid}); 
    ipcRenderer.send('getSelectTables');  
}