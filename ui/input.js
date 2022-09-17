"use strict";


const DEFAULT_NES1 = {
    'up': ['arrowUp', 38],
    'down': ['arrowDown', 40],
    'left': ['arrowLeft', 37],
    'right': ['arrowRight', 39],
    'start': ['f', 70],
    'select': ['Tab', 9],
    'b': ['z', 90],
    'a': ['x', 88]
}

const DEFAULT_NES2 = {
    'up': [null, null],
    'down': [null, null],
    'left': [null, null],
    'right': [null, null],
    'start': [null, null],
    'select': [null, null],
    'b': [null, null],
    'a': [null, null]
}

const DEFAULT_SNES1 = {
    'up': ['arrowUp', 38],
    'down': ['arrowDown', 40],
    'left': ['arrowLeft', 37],
    'right': ['arrowRight', 39],
    'start': ['f', 70],
    'select': ['Tab', 9],
    'l': ['q', 81],
    'r': ['w', 87],
    'x': ['s', 83],
    'y': ['a', 65],
    'a': ['x', 88],
    'b': ['z', 90],
}

const DEFAULT_SNES2 = {
    'up': [null, null],
    'down': [null, null],
    'left': [null, null],
    'right': [null, null],
    'start': [null, null],
    'select': [null, null],
    'l': [null, null],
    'r': [null, null],
    'x': [null, null],
    'y': [null, null],
    'b': [null, null],
    'a': [null, null]
}

const DEFAULT_SMS1 = {
    'up': ['arrowUp', 38],
    'down': ['arrowDown', 40],
    'left': ['arrowLeft', 37],
    'right': ['arrowRight', 39],
    'start': ['f', 70],
    'select': ['Tab', 9],
    'b1': ['z', 90],
    'b2': ['x', 88],
}

const DEFAULT_SMS2 = {
    'up': [null, null],
    'down': [null, null],
    'left': [null, null],
    'right': [null, null],
    'start': [null, null],
    'select': [null, null],
    'b1': [null, null],
    'b2': [null, null],
}



const CONTROLLERS = {
    NES: 0,
    SNES: 1,
    SMS: 2
}

class controller_button_t {
    constructor(config, name, x1, y1, x2, y2) {
        this.key = config[name][0];
        this.keycode = config[name][1];
        this.name = name;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;

        this.pressed = 0;
    }

    test_click(x, y) {
        return ((x >= this.x1) && (x <= this.x2) && (y >= this.y1) && (y <= this.y2));
    }
}

class controller_input_config_t {
    constructor(name, id, savedict, kind) {
        // For a specific controller
        this.name = name;
        this.id = id;
        this.kind = kind;
        this.el = document.getElementById(id);
        this.el.addEventListener('click', this.click.bind(this));
        this.savedict = savedict;

        this.changed = false;

        this.buttons = {};

        switch(this.kind) {
            case CONTROLLERS.NES:
                this.setup_nes();
                break;
            case CONTROLLERS.SNES:
                this.setup_snes();
                break;
            case CONTROLLERS.SMS:
                this.setup_sms();
                break;
        }
    }

    save_to_dict() {
        console.log(this.savedict[this.id]);
        for (let button_name in this.buttons) {
            let button = this.buttons[button_name];
            this.savedict[this.id][button.name] = [button.key, button.keycode];
        }
    }

    setup_nes() {
        if (typeof this.savedict[this.id] === 'undefined') {
            this.changed = true;
            switch(this.id) {
                case 'nes1cfg':
                    this.savedict[this.id] = DEFAULT_NES1;
                    break;
                case 'nes2cfg':
                    this.savedict[this.id] = DEFAULT_NES2;
                    break;
            }
        }
        let c = this.savedict[this.id];
        this.buttons.up = new controller_button_t(c,'up', 30, 30, 41, 45);
        this.buttons.left = new controller_button_t(c,'left', 15, 45, 30, 59);
        this.buttons.right = new controller_button_t(c,'right', 41, 46, 55, 59);
        this.buttons.down = new controller_button_t(c,'down', 30, 60, 41, 72);
        this.buttons.select = new controller_button_t(c,'select', 79, 60, 94, 68);
        this.buttons.start = new controller_button_t(c,'start', 108, 60, 125, 67);
        this.buttons.b = new controller_button_t(c,'b', 142, 54, 166, 75);
        this.buttons.a = new controller_button_t(c,'a', 172, 54, 194, 75);
    }

    setup_snes() {
        if (typeof this.savedict[this.id] === 'undefined') {
            this.changed = true;
            switch(this.id) {
                case 'snes1cfg':
                    this.savedict[this.id] = DEFAULT_SNES1;
                    break;
                case 'snes2cfg':
                    this.savedict[this.id] = DEFAULT_SNES2;
                    break;
            }
        }
        let c = this.savedict[this.id];

        this.buttons.up = new controller_button_t(c,'up', 63, 58, 79, 73);
        this.buttons.left = new controller_button_t(c,'left', 42, 75, 59, 93);
        this.buttons.right = new controller_button_t(c,'right', 80, 75, 94, 94);
        this.buttons.down = new controller_button_t(c,'down', 63, 93, 78, 108);
        this.buttons.select = new controller_button_t(c,'select', 117, 82, 140, 105);
        this.buttons.start = new controller_button_t(c,'start', 151, 82, 171, 105);
        this.buttons.l = new controller_button_t(c,'l', 37, 1, 105, 32);
        this.buttons.r = new controller_button_t(c,'r', 206, 1, 278, 32);
        this.buttons.y = new controller_button_t(c,'y', 204, 73, 227, 96);
        this.buttons.x = new controller_button_t(c,'x', 232, 47, 255, 74);
        this.buttons.b = new controller_button_t(c,'b', 231, 95, 255, 118);
        this.buttons.a = new controller_button_t(c,'a', 260, 69, 282, 96);
    }

    setup_sms() {
        /*
        up
        left
        down
        right
        b1
        b2
         */
        if (typeof this.savedict[this.id] === 'undefined') {
            this.changed = true;
            switch(this.id) {
                case 'sms1cfg':
                    this.savedict[this.id] = DEFAULT_SMS1;
                    break;
                case 'sms2cfg':
                    this.savedict[this.id] = DEFAULT_SMS2;
                    break;
            }
        }
        let c = this.savedict[this.id];
        this.buttons.up = new controller_button_t(c,'up', 73, 35, 112, 61);
        this.buttons.left = new controller_button_t(c,'left', 55, 57, 81, 82);
        this.buttons.right = new controller_button_t(c,'right', 109, 57, 132, 82);
        this.buttons.down = new controller_button_t(c,'down', 80, 87, 117, 109);
        this.buttons.b1 = new controller_button_t(c,'b1', 226, 69, 268, 112);
        this.buttons.b2 = new controller_button_t(c,'b2', 283, 69, 323, 112);
    }

    click(event) {
        let x = event.pageX - event.target.offsetLeft;
        let y = event.pageY - event.target.offsetTop;
        console.log(x, y);
        let clicked_button = null;
        for (let button_name in this.buttons) {
            let button = this.buttons[button_name];
            if (button.test_click(x, y)) {
                clicked_button = button;
                input_config.select_button(this, button);
                break;
            }
        }
        console.log('CLICKED?', clicked_button)
    }
}

class input_config_t {
    constructor() {
        this.changes = false;
        this.savedict = {
        }
        this.before_dict = {};
        this.controller_els = {
            nes1: new controller_input_config_t('NES player 1', 'nes1cfg', this.savedict, CONTROLLERS.NES),
            nes2: new controller_input_config_t('NES player 2', 'nes2cfg', this.savedict, CONTROLLERS.NES),
            snes1: new controller_input_config_t('SNES player 1', 'snes1cfg', this.savedict, CONTROLLERS.SNES),
            snes2: new controller_input_config_t('SNES player 2', 'snes2cfg', this.savedict, CONTROLLERS.SNES),
            sms1: new controller_input_config_t('SMS player 1', 'sms1cfg', this.savedict, CONTROLLERS.SMS),
            sms2: new controller_input_config_t('SMS player 2', 'sms2cfg', this.savedict, CONTROLLERS.SMS),
        }
        this.ui_els = {
            controller: document.getElementById('input-cfg-controller'),
            label: document.getElementById('input-cfg-label'),
            key: document.getElementById('input-cfg-input')
        }
        this.ui_els.key.addEventListener("keydown", this.keydown.bind(this));

        this.selected_controller = this.controller_els.nes1;
        this.selected_button = this.selected_controller.buttons.a;
        this.update_selected();

        this.current_tab = 'settings_tab_input_nes';
    }

    tab_change(name) {
        console.log(name);
        switch(name) {
            case 'settings_tab_input_nes':
                this.selected_controller = this.controller_els.nes1;
                this.selected_button = this.selected_controller.buttons.a;
                break;
            case 'settings_tab_input_snes':
                this.selected_controller = this.controller_els.snes1;
                this.selected_button = this.selected_controller.buttons.a;
                break;
            case 'settings_tab_input_sms':
                this.selected_controller = this.controller_els.sms1;
                this.selected_button = this.selected_controller.buttons.b1;
                break;
            default:
                this.selected_controller = null;
                this.selected_button = null;
                break;
        }
    }

    select_button(controller, button) {
        this.selected_controller = controller;
        this.selected_button = button;
        this.update_selected();
    }

    update_selected() {
        if ((this.selected_button === null) || (this.selected_controller === null)) {
            this.ui_els.controller.innerHTML = "No controller";
            this.ui_els.label.innerHTML = "No button";
            this.ui_els.key.value = '<empty>';
            return;
        }
        this.ui_els.controller.innerHTML = this.selected_controller.name;
        this.ui_els.label.innerHTML = this.selected_button.name;
        let r = this.selected_button.key;
        if (r === null) r = '<empty>';
        this.ui_els.key.value = r;
    }

    copy_savedict() {
        this.before_dict = JSON.parse(JSON.stringify(this.savedict));
    }

    keydown(event) {
        console.log(event.key, event.keyCode);
        event.stopPropagation();
        event.preventDefault();
        if (this.selected_controller === null) {
            event.target.blur();
            return;
        }
        if (!this.changes) {
            this.changes = true;
            this.copy_savedict();
        }
        this.selected_button.keycode = event.keyCode;
        this.selected_button.key = event.key;
        this.selected_controller.save_to_dict();
        this.ui_els.key.value = this.selected_button.key;
        event.target.blur();
        console.log(input_config.savedict);
    }
}

