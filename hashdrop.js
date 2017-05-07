//Import Section
var remote = require('electron').remote;
var dialog = remote.dialog;
var crypt = require('crypto');
var fs = require('fs');

//Initialize necessary HTML elements
var sourceFile = document.getElementById('sourceFile');
var checksumFile = document.getElementById('checksumFile');
var chooseSourceBtn = document.getElementById('chooseSourceBtn');
var chooseChecksumBtn = document.getElementById('chooseChecksumBtn');
var checkHashBtn = document.getElementById('checkHashBtn');
var hashTypes = document.getElementById('hashTypes');

//Loading a list of available hashes onto <select> tag
window.onload = function() {
    //Get available hashes for crypto library
    var availableHashes = crypt.getHashes();
    //Create document fragment to avoid performance penalty
    var fragment = document.createDocumentFragment();

    //Loop through all the available hashes and create the
    //<option> tag for each hash
    availableHashes.forEach(function(value, index, array) {
        var option = document.createElement('option');

        //Set the 'text' and 'value' of <option> tag to hash value
        option.value = value;
        option.text = value;

        //Set the first item in the hash as selected
        if (index == 0) {
            option.selected = true;
        }

        //Append the <option> tag to the document fragment 
        fragment.appendChild(option);
    });

    //Append the document fragment to <select> tag
    hashTypes.appendChild(fragment);
};

//Add 'onclick' event listener for choosing source file
chooseSourceBtn.addEventListener('click', function() {
    dialog.showOpenDialog((fileNames) => {
        if (fileNames == undefined) {
            logToConsoleAndAlert('No file selected!');
        } else {
            //Set the <input> tag value with filename
            sourceFile.value = fileNames;
        }
    });
});

//Add 'onclick' event listener for choosing checksum file
chooseChecksumBtn.addEventListener('click', function() {
    dialog.showOpenDialog((fileNames) => {
        if (fileNames == undefined) {
            logToConsoleAndAlert('No file selected!');
        } else {
            //Set the <input> tag value with filename
            checksumFile.value = fileNames;
        }
    });
});

//Add 'onclick' event listener for verifying integrity
checkHashBtn.addEventListener('click', function() {
    //Only proceed when both <input> tags are filled
    if (checksumFile.value && sourceFile.value) {
        //Get the file path from both <input> tags
        var sourceFilePath = sourceFile.value;
        var checksumFilePath = checksumFile.value;

        //File descriptors that will store file content
        var sourceFd = null;
        var checksumFd = null;

        try {
            //Read from source file only if it exists
            if (fs.existsSync(sourceFilePath)) {
                sourceFd = fs.readFileSync(sourceFilePath, 'utf8');
            } else {
                logToConsoleAndAlert(null, sourceFilePath + ' doesn\'t exist');
                return;
            }

            //Read from checksum file only if it exists
            if (fs.existsSync(checksumFilePath)) {
                checksumFd = fs.readFileSync(checksumFilePath, 'utf8');
            } else {
                //If it doesn't exist assume its a checksum value
                console.log(checksumFilePath + ' doesn\'t exist. Assuming its a hash.');
                checksumFd = checksumFilePath;
            }

            //Proceed only if some value is present in the file descriptors
            if (typeof(sourceFd) === 'string' && typeof(checksumFd) === 'string') {
                //Create a hash from the selected hash value
                var hash = crypt.createHash(hashTypes.value || 'md5');

                //Get the hash for source file
                var sourceHash = hash.update(sourceFd).digest('hex');

                //Store the checksum hash
                var checksumHash = checksumFd.trim();

                //Check if the hash matches
                if (sourceHash === checksumHash) {
                    logToConsoleAndAlert(null, 'The file is intact');
                } else {
                    logToConsoleAndAlert(null, 'Oops! Seems the file has been tampered!');
                }
            } else {
                logToConsoleAndAlert(null, 'Some weird error occured!');
            }
        } catch (error) {
            logToConsoleAndAlert(error);
        }
    } else {
        logToConsoleAndAlert(null, 'Can\'t verify integrity without both files');
    }
});

//Logging to both console and window
var logToConsoleAndAlert = function(error, message) {
    if (error) {
        alert('Error occured reading file');
        console.log(error);
    } else {
        alert(message);
        console.log(message);
    }
};