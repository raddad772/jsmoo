class snes_cart {
	constructor() {
		this.ROM = new Uint8Array();
	}
	
	load_cart(filename) {
		/*const reader = new FileReader();
		reader.addEventListener('load', (event) => {
			this.ROM = event.target.result;
			console.log(this.ROM);
		});
		reader.readAsDataURL(filename);*/
		let dt = document.getElementById('displaytext');
		console.log(dt);
		const ROM = localStorage.getItem(filename)
		console.log(ROM);
		if (ROM === null) {
			dt.innerHTML = 'ROM not found!'
		}
		else {
			dt.innerHTML = 'ROM found!'
		}
	}
};