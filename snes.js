class SNES {
	constructor() {
		this.cpu = new w65c816();
		this.cart = new snes_cart();
		this.mem = new snes_mem();
	}
	
	load_ROM(file) {
		this.cart.load_cart(file);
	}
}

function load_ROM(fileId, func) {
	getFromDb(fileId, func);
}

function main3(ROM) {
	snes = new SNES();
	console.log('Got...', ROM);
	//snes.load_ROM('smw.smc');

}

function main2() {
	load_ROM('test', main3);
}

function main() {
	initDb(main2);
}

window.onload = main;