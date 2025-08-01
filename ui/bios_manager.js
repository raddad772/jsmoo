'use strict';

const SYSTEMS_WITH_BIOS = [
    ['sms', 'Sega Master System'],
    ['spectrum', 'ZX Spectrum 48k'],
    ['gb', 'GameBoy'],
    ['gbc', 'GameBoy Color'],
    ['ps1', 'Sony PS1'],
]


const SER_BIOS_t = ['kind', 'loaded', 'BIOS', 'selected_bios_filename'];

class bios_t {
    constructor(kind, name) {
        this.kind = kind;
        this.name = name;
        this.loaded = false;
        this.select_el_name = '';
        this.bios_path = '/' + this.kind + '/bios/';
        this.config = {};

        this.options = []

        this.selected_bios_filename = null;
        this.BIOS = new Uint8Array(0);
    }

    serialize() {
        let o = {version: 1};
        serialization_helper(o, this, SER_BIOS_t);
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('BAD BIOS VERSION');
            return false;
        }
        return deserialization_helper(this, from, SER_BIOS_t);
    }

    async load_selected_bios() {
        let el = document.getElementById(this.select_el_name);
        if (el.value !== this.selected_bios_filename) {
            await this.load_bios(el.value);
        }
    }

    async load_bios(fn) {
        this.config.last_bios_file = fn;
        await this.save_config();
        this.selected_bios_filename = fn;
        let r = await bfs.read_file(this.selected_bios_filename);
        this.BIOS = str2ab(r);
        this.loaded = true;
    }

    async save_config() {
        let g = await bfs.read_file('/config/bios.json');
        if (!g) {
            g = {version: 1}
        }
        g[this.kind] = this.config;
        await bfs.write_file('/config/bios.json', g);
    }

    async onload() {
        let fs = new basic_fs();
        let g = await fs.read_file('/config/bios.json');
        if (g === null) {
            await this.save_config();
        }
        else {
            if (typeof g[this.kind] === 'undefined') {
                g[this.kind] = {version: 1, file: null};
                await this.save_config();
            }
            this.config = g[this.kind];
        }
        await this.refresh_options();
        for (let i in this.options) {
            let item = this.options[i];
            if (item[1] === this.config.last_bios_file) {
                await this.load_bios(item[1]);
                break;
            }
        }
    }

    async refresh_options() {
        this.options = [];
        let fs = new basic_fs();
        let allfiles = await fs.get_files_in_path(this.bios_path); //this.bios_path

        for (let i in allfiles) {
            let fn = allfiles[i];
            this.options.push([fs.get_filename_from(fn), fn]);
        }
    }

    async get_html_select() {
        await this.refresh_options();
        this.select_el_name = 'select_bios_' + this.kind;
        let ostr = this.name + ': <select id="' + this.select_el_name + '" name="' + this.select_el_name + '" onchange="global_player.bios_manager.el_change(\'' + this.kind + '\')">\n';
        if (this.options.length === 0) {
            ostr += '    <option value="null" selected disabled hidden>No BIOS files found</option>\n';
        }
        else {
            if (this.selected_bios_filename === null) {
                ostr += '    <option value="null" selected disabled hidden>Select a BIOS file</option>\n';
            }
            for (let i in this.options) {
                let item = this.options[i];
                if (this.selected_bios_filename === item[1]) {
                    ostr += '    <option value="' + item[1] + '" selected>' + item[0] + '</option>\n';
                }else {
                    ostr += '    <option value="' + item[1] + '">' + item[0] + '</option>\n';
                }

            }
        }
        ostr += '</select>'
        //console.log(ostr);
        return ostr;
    }
}

class bios_manager_t {
    constructor() {
        this.el_cont = document.getElementById('bios-container');
        this.el_system_select = document.getElementById('bios_upload_select');

        /**
         * @type {Array<bios_t>}
         */
        this.bioses = {}
        for (let i in SYSTEMS_WITH_BIOS) {
            let item = SYSTEMS_WITH_BIOS[i];
            this.bioses[item[0]] = new bios_t(item[0], item[1]);
        }
    }

    async el_change(kind) {
        await this.bioses[kind].load_selected_bios();
    }

    async upload_file() {
        console.log('UPLOAD FILE CALLED');
        let sys_kind = document.getElementById('bios_upload_select').value;
        let path = '/' + sys_kind + '/bios/';
        let el = document.getElementById('bios_fileUpload');
        await do_upload_file('bios', el, path);
        this.update_page();
    }

    async onload() {
        for (let i in this.bioses) {
            await this.bioses[i].onload();
        }
        await this.update_page();
    }

    async update_page() {
        let ostr1 = '';
        let ostr2 = '';
        let first = true;
        for (let i in this.bioses) {
            ostr1 += await this.bioses[i].get_html_select();
            ostr1 += '<br>';
            if (first)
                ostr2 += '<option value="' + this.bioses[i].kind + '" selected>' + this.bioses[i].name + '</option>\n';
            else
                ostr2 += '<option value="' + this.bioses[i].kind + '">' + this.bioses[i].name + '</option>\n';
            first = false;
        }
        this.el_cont.innerHTML = ostr1;
        this.el_system_select.innerHTML = ostr2;
    }
}
