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

function main() {
	setup_uploads();
	snes = new SNES();
	snes.load_ROM('smw.smc');
}

window.onload = main;