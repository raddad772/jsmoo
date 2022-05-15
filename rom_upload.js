var FILE_KEY = 'ROMFILE';


function setup_uploads() {
// fire processUpload when the user uploads a file.
document.querySelector('#fileUpload').addEventListener('change', handleFileUpload, false);

// Log any previously saved file.
old_rom = retrieveRom();
if (old_rom !== null) {
	console.log('OLD ROM FOUND!', old_rom.byteLength)
	const ui8 = new Uint8Array(old_rom);
	console.log('UI8 len!', ui8.length)
}


// Setup file reading
var reader = new FileReader();
reader.onload = handleFileRead;

function handleFileUpload(event) {
    var file = event.target.files[0];
    reader.readAsArrayBuffer(file); // fires onload when done.
}

function handleFileRead(event) {
    //var save = JSON.parse(event.target.result);
	console.log(event);
	console.log(event.target.result)
    window.localStorage.setItem(FILE_KEY, btoa(event.target.result));
}

function retrieveRom() {
    var se = localStorage.getItem(FILE_KEY);
	return btoa(se);
}
}
