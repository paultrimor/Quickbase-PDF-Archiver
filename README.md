# SAM-Student-Archiver
Export SAM Students into individual PDFs containing associated read-only data

## Configuration 
Before you can run the script, you must load two json variables under the `res` folder. 
- **users_lookuptable.js** - contains an object of key-value pairs where the key is the sam userId and the value is the readable name and email of user. 
- **students_lookuptable.js** - contains an object of key-value pairs where the key is the sam_key and the value is an object containing two keys: *student_id* and *usg_key*. 

## How to Run 
1. Run npm install
2. Use your SAM username and password to access to exporter. 
3. After login, select the desired school you want to export. 
4. Select the student child tables you wish to export. 
5. Select the fields from each table that you want exported. 
6. Choose range to indexes to export and enter the correct foreign key for each table.
7. Choose a folder you wish to Export. 
8. When complete, open the console and run the function convertHtmlToPdf() 

