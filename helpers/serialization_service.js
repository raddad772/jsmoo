"use strict";

//import {base64ToBytes, bytesToBase64} from "./base64codec";
function SER_evaluate(what, prop) {
    if (typeof what === 'object') {
        if (Array.isArray(what)) {
            console.log(prop, 'SAVE AS ARRAY');
            let data = [];
            for (let j in what) {
                data.push(SER_evaluate(what[j]));
            }
            return {ars: true, data: data};
        }
        else if (typeof what.BYTES_PER_ELEMENT === 'number') {
            console.log(prop, 'SAVE AS BYTES');
            return {bpe: what.BYTES_PER_ELEMENT, byteLength: what.byteLength, data: bytesToBase64(what) }
        }
        else if (typeof what.serialize === 'function') {
            return what.serialize();
        }
        else {
            console.log(prop, 'SAVE STRUCTURED CLONE');
            return structuredClone(what);
        }
    }
    return what;
}

function serialization_helper(to, from, fields) {
    for (let i in fields) {
        let prop = fields[i];
        to[prop] = SER_evaluate(from[prop], prop);
    }
}

class DESER_eval_return {
    constructor(ok, set, value) {
        this.ok = ok;
        this.set = set;
        this.value = value;
    }
}

/**
 * @param what
 * @param {string} prop
 * @param to
 * @returns {DESER_eval_return}
 */
function DESER_evaluate(what, prop, to) {
    /*if (prop === 'P') {
        console.log(what, prop, to);
        debugger;
    }*/
    if (typeof to === 'object') {
        if (typeof what.ars === 'number') {
            console.log('UNPACK LIST OFs', prop);
            let good = true;
            for (let i in what.data) {
                let item = what.data[i];
                let y = DESER_evaluate(item, prop, to[i]);
                if (y.set) to[i] = y.value;
                if (!y.ok) good = false;
            }
            return new DESER_eval_return(good, false, null);
        }
        else if ((typeof what.bpe === 'number') && (typeof what.byteLength === 'number')) {
            console.log(prop, 'RESTORE AS BYTES');
            return new DESER_eval_return(true, true, base64ToBytes(what.data));
        }
        else if (typeof to.deserialize === 'function') {
            let r = to.deserialize(what);
            return new DESER_eval_return(r, false, null);
        }
        else {
            return new DESER_eval_return(true, true, structuredClone(what));
        }
    }
    return new DESER_eval_return(true, true, what);
}

function deserialization_helper(to, from, fields) {
    let good = true;
    for (let i in fields) {
        let prop = fields[i];
        let r = DESER_evaluate(from[prop], prop, to[prop]);
        if (!r.ok) good = false;
        if (r.set) to[prop] = r.value;
    }
    return good;
}
