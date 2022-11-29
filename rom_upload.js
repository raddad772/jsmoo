"use strict";

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

const bfs = new basic_fs();

async function uploadFile(fileId) {
    let rk = romkind_sub(global_player.system_kind)
    let path = '/' + rk + '/roms/';
    let el = document.getElementById('fileUpload');
    console.log('DO UPLOAD FILE!', el, path);
    await do_upload_file('test', el, path)
    await reload_roms(rk);
}

async function do_upload_file(fileId, el, path) {
    let fileIn = el;
    if (fileIn.files && fileIn.files[0]) {
        let file_name = fileIn.files[0].name;
        let reader = new FileReader();
        reader.onload = async function (e) {

            let bits = e.target.result;
            let ob = {
                id: fileId,
                type: fileIn.files[0].type,
                name: fileIn.files[0].name,
                data: bits
            };
            path = path + file_name;
            console.log('NEW PATH', path);
            if (await bfs.file_exists(path)) {
                alert('File already exists!');
                return;
            }

            console.log('ABOUT TO BFS WRITE')

            await bfs.write_file(path, e.target.result);
            console.log('BFS WROTE!');
        };
        await reader.readAsBinaryString(fileIn.files[0])
    }
    else {
        console.log('WHAT?');
    }
}


function dumb_convert(instr) {
    var abuf = new ArrayBuffer(instr.length);
    var buf = new Uint8Array(abuf);
    for (var i = 0, strLen = instr.length; i < strLen; i++) {
        buf[i] = instr.charCodeAt(i);
    }
    return buf;
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
        console.log("loaded bytes", dlReq.result.data.length);
        //console.log('hi', dlReq.result.data)
        /*var myvar = new TextEncoder("utf-8").encode(dlReq.result.data);
        console.log(myvar.byteLength, typeof(myvar))
        var yourvar = new Uint8Array(myvar);
        console.log(typeof(yourvar), yourvar.byteLength, yourvar);
        myvar = dumb_convert(dlReq.result.data);
        console.log("done dumb:", myvar.byteLength);
        var my = myvar[0xFFD5 + 512];*/
        //console.log(my.toString(16));
		func(dumb_convert(dlReq.result.data));
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
        var element = document.createElement('a');
        //element.setAttribute('href', 'data:' + dlReq.result.type + ';charset=utf-8,' + encodeURIComponent(dlReq.result.data));
        /*element.setAttribute('href', 'data:' + dlReq.result.type + ';base64,' + dlReq.result.data);
		element.setAttribute('download', dlReq.result.name);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);*/
    };
}