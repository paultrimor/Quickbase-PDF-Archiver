# QuickBase PDF Archiver
Desktop Application written in NodeJS's Electron framework for downloading and parsing QuickBase records into PDFs. 

## How It Works 
This program will allow you to export any Table under any Application you have permission to access. Your QuickBase information to download XML files returned from API_DoQuery. Afterwards, it will parse through these files to create PDFs of all records in your selected table. This architecure limits the number of API calls to the number of tables. 

## Installation Guide 
There are two ways you can run this program. 
1. If you are in a hurry and have a windows machine, a one-click installer is available here: 
2. Clone this repository then run `npm install` and `npm start`. This runs the program in development mode. 

**Note** If you are running this program in development, you can open the console for useful log notes. 

