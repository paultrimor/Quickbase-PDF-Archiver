const { ipcRenderer, remote } = require('electron');
var request                   = require('request');
var DOMParser                 = new require('xmldom').DOMParser; 
var PARSER                    = require('../XML_PARSER'); 
var async                     = require('async');  


function getTicket(domain, username, password) {

    var query = domain + "/db/main?" + 
        "a=API_Authenticate" +
        "&username=" + username + 
        "&password=" + password + 
         "&hours=" + 1;  

    return new Promise((resolve, reject) => {
        request(query, function(error, response, body) {             
            if(error)
                reject(error); 

            resolve(body);      
        });
    });
}; 


/* Login Render Process *************************************/ 

function submit() {

    getTicket(
        document.getElementById('domain').value, 
        document.getElementById('username').value,
        document.getElementById('password').value,
    ).then((responseBody) => {

        var ticket = PARSER.parse_authentication(responseBody);
        
        if (ticket.errorCode == 0) {
            var authTicket = ticket.ticket.data; 

            ipcRenderer.send('setSystemConfig', {
                authTicket: authTicket,
                domainUrl: document.getElementById('domain').value
            });

            ipcRenderer.send('getSelectApp'); 
        } else {
            uiDisplayError(
                ticket.errorText.data,
                ticket.errorDetail.data
            );
        }   
    }); 
}
