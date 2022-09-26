"use strict";

/*
Basic filesystem implementation built on-top of localForage.
It works like this:
All keys are prefixed with bfs-
bfs-.metadata is a dict that looks like
{
 version: 1,
 files_list: []
}

Where files_list is a list of files.

Files are specified Unix-style with / separating paths and / being the root.

You need to call bfs_init() to get access.

bfs is meant to be used with WebWorkers, so a SharedArrayBuffer for a few locks is
created. Optionally. In the future. Sigh.
 */

class basic_lock {
    constructor(lock_from=null) {
        if (lock_from !== null) {
            this.sab = lock_from.sab;
        }
        else {
            this.sab = new SharedArrayBuffer(4);
        }
        this.buf = new Int32Array(this.sab);
    }

    acquire_lock() {

    }
}


// path utility functions
// just do a few basic thing like separate filename from path,

function basic_fs_root() { return '/'; }
const BFS_METADATA = 'bfs-.metadata';

function basic_fs_split(path) {
    let els = path.split('/');
    return els[els.length-1];
}

function basic_fs_join(path, filename) {
    if (path[path.length-1] !== '/')
        path += '/';
    let sr = path + filename;
    sr = sr.replace(/\/\//, '/');
    return sr;
}

class basic_fs {
    constructor(lock=null) {
        this.lock = new basic_lock(lock);
    }

    async _get_metadata() {
        let md = await localforage.getItem(BFS_METADATA);
        if (md === null) {
            md = {
                version: 1,
                files_list: []
            };
            localforage.setItem(BFS_METADATA, md);
        }
        if (md['version'] !== 1) {
            alert('Wrong filesystem version, erors may happen...');
        }
        return md;
    }

    async file_exists(path) {
        let allfiles = await this._get_files();
        return allfiles.indexOf(path) !== -1;
    }

    async _set_metadata(md) {
        localforage.setItem(BFS_METADATA, md)
    }

    get_path_from(what) {
        let fn = this.get_filename_from(what);
        return what.slice(0, what.indexOf(fn));
    }

    get_filename_from(what) {
        return what.replace(/^.*[\\\/]/, '');
    }

    async get_files_in_path(path) {
        if (path.at(path.length-1) !== '/')
            path += '/';
        let allfiles = await this._get_files();
        let outlist = [];
        for (let i = 0; i < allfiles.length; i++) {
            let mpath = this.get_path_from(allfiles[i]);
            if (path === mpath) outlist.push(allfiles[i]);
        }
        return outlist;
    }

    async _get_files() {
        let metadata = await this._get_metadata();
        return metadata['files_list'];
    }

    async _set_files(files_list) {
        let metadata = await this._get_metadata();
        metadata['files_list'] = files_list;
        await this._set_metadata(metadata);
    }

    /*// List all paths in a path
    list_paths(path='/', recurse=false) {

    }*/

    // List all files in a path
    async list_files(path='/') {
        return await this._get_files();
    }

    async write_file(path, contents) {
        await localforage.setItem(path, contents);
        let files = await this._get_files();
        if (files.indexOf(path) === -1) {
            files.push(path);
        }
        await this._set_files(files);
    }

    async read_file(path) {
        console.log('READING', path);
        return await localforage.getItem(path);
    }
}