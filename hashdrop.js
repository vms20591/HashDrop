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
var flashMessage = document.getElementById('flash-message');
var dialogBox = document.getElementById('dialog');
var loading = document.getElementById('loading');
var overlay = document.getElementById('overlay');

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
                //Create a stream instead of reading file
                //Suitable for large files
                sourceFd = fs.createReadStream(sourceFilePath);
            } else {
                logToConsoleAndAlert(sourceFilePath + ' doesn\'t exist');
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
            if (sourceFd != null && typeof(checksumFd) === 'string') {
                //Create a hash from the selected hash value
                var hash = crypt.createHash(hashTypes.value || 'md5');
                var sourceHash = null;
                var checksumHash = null;

                //Show the overloay and dialog box
                dialogBox.classList.toggle('hide');
                overlay.classList.toggle('hide');

                //Start animating the loading text
                var interval = setInterval(function() {
                    loading.classList.toggle('show');
                }, 500);

                //Get the hash for source file
                sourceFd.on('data', function(data) {
                    hash.update(data, 'utf8');
                }).on('end', function() {
                    //Hide the dialog box and overlay
                    dialogBox.classList.toggle('hide');
                    overlay.classList.toggle('hide');

                    //Clear animation
                    clearInterval(interval);
                    interval = null;

                    //Digest the hash 
                    sourceHash = hash.digest('hex');

                    //Store the checksum hash
                    checksumHash = checksumFd.trim();

                    //Check if the hash matches
                    if (sourceHash === checksumHash) {
                        logToConsoleAndAlert(null, 'The file is intact');
                    } else {
                        logToConsoleAndAlert('Oops! Seems the file has been tampered!');
                    }
                });
            } else {
                logToConsoleAndAlert('Some weird error occured!');
            }
        } catch (error) {
            logToConsoleAndAlert(error);
        }
    } else {
        logToConsoleAndAlert('Can\'t verify integrity without both files');
    }
});

//Logging to both console and window
var logToConsoleAndAlert = function(error, message) {
    if (error) {
        console.log(error);
        flashTheMessage(error.message || error, true);
    } else {
        console.log(message);
        flashTheMessage(message, false);
    }
};

//Flash message onto screen instead of alert
var flashTheMessage = function(message, isError) {
    //Show flash message after a small delay
    setTimeout(function() {
        var color = '#2AB33B';

        if (isError) {
            color = '#FF1C1C';
        }

        flashMessage.innerHTML = message;
        flashMessage.style.border = '2px solid ' + color;
        flashMessage.style.color = color;
        flashMessage.style.visibility = 'visible';
    }, 300);

    //Hide flash message after sometime
    setTimeout(function() {
        flashMessage.style.visibility = 'hidden';
    }, 3000);
};