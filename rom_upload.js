let db;
let dbVersion = 1;
let dbReady = false;

function initDb(func) {
    let request = indexedDB.open('FileStorage', dbVersion);

    request.onerror = function(e) {
        console.error('Unable to open database.');
    }

    request.onsuccess = function(e) {
        db = e.target.result;
        console.log('db opened');
		func();
    }

    request.onupgradeneeded = function(e) {
        let db = e.target.result;
        db.createObjectStore('files', {keyPath:'id', autoIncrement: false});
        dbReady = true;
    }
}

function uploadFile(fileId) {
    fileIn = document.getElementById('fileUpload');
    if(fileIn.files && fileIn.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            console.log(e.target.result);

            let bits = e.target.result;
            let ob = {
                id: fileId,
                type: fileIn.files[0].type,
                name: fileIn.files[0].name,
                data: bits
            };

            let trans = db.transaction(['files'], 'readwrite');
            let addReq = trans.objectStore('files').put(ob);

            addReq.onerror = function(e) {
                console.log('error storing data');
                console.error(e);
            }

            trans.oncomplete = function(e) {
                console.log('data stored');
            }
        };
        reader.readAsBinaryString(fileIn.files[0])
    }
}




function getFromDb(fileId, func) {
    var trans = db.transaction(['files'], 'readonly');
    var dlReq = trans.objectStore('files').get(fileId);
	let ready = false;
	let errored = false;
	
    dlReq.onerror = function(e) {
        console.log('error reading data');
        console.error(e);
    };
    
    dlReq.onsuccess = function(e) {
        console.log('data read');
        console.log(dlReq.result);
		func(dlReq.result);
    };
}


function downloadFile(fileId) {
    console.log('downloading');
    var trans = db.transaction(['files'], 'readonly');
    var dlReq = trans.objectStore('files').get(fileId);
    
    dlReq.onerror = function(e) {
        console.log('error reading data');
        console.error(e);
    };
    
    dlReq.onsuccess = function(e) {
        console.log('data read');
        console.log(dlReq.result);
        var element = document.createElement('a');
        //element.setAttribute('href', 'data:' + dlReq.result.type + ';charset=utf-8,' + encodeURIComponent(dlReq.result.data));
        element.setAttribute('href', 'data:' + dlReq.result.type + ';base64,' + dlReq.result.data);
		element.setAttribute('download', dlReq.result.name);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    };
}