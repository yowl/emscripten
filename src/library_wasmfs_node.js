/**
 * @license
 * Copyright 2022 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */

mergeInto(LibraryManager.library, {
  $wasmfs$node$isWindows: !!process.platform.match(/^win/),

  $wasmfs$node$convertNodeCode__deps: ['$ERRNO_CODES'],
  $wasmfs$node$convertNodeCode: function(e) {
    var code = e.code;
#if ASSERTIONS
    assert(code in ERRNO_CODES, 'unexpected node error code: ' + code + ' (' + e + ')');
#endif
    return ERRNO_CODES[code];
  },

  $wasmfs$node$lstat__deps: ['$wasmfs$node$isWindows', '$wasmfs$node$convertNodeCode'],
  $wasmfs$node$lstat: function(path) {
    let stat;
    try {
      // TODO: use throwIfNoEntry = false
      console.log('statting', path);
      stat = fs.lstatSync(path, {throwIfNoEntry: false});
      if (stat === undefined) {
        return undefined;
      }
      if (wasmfs$node$isWindows) {
        // Node.js on Windows never represents permission bit 'x', so
        // propagate read bits to execute bits
        stat.mode = stat.mode | ((stat.mode & 292) >> 2);
      }
    } catch (e) {
      // TODO: return some error here instead of throwing.
      if (!e.code) throw e;
      throw new FS.ErrnoError(wasmfs$node$convertNodeCode(e));
    }
    return stat;
  },

  wasmfs_node_readdir__deps: ['$wasmfs$node$convertNodeCode'],
  wasmfs_node_readdir: function(path_p, vec) {
    let path = UTF8ToString(path_p);
    let entries;
    try {
      entries = fs.readdirSync(path, { withFileTypes: true });
    } catch (e) {
      // TODO: return some error here instead of throwing.
      if (!e.code) throw e;
      throw new FS.ErrnoError(wasmfs$node$convertNodeCode(e));
    }
    for (let entry of entries) {
      withStackSave(() => {
        let name = allocateUTF8OnStack(entry.name);
        let type;
        // TODO: Figure out how to use `cDefine` here.
        if (entry.isFile()) {
          type = 1;
        } else if (entry.isDirectory()) {
          type = 2;
        } else if (entry.isSymbolicLink()) {
          type = 3;
        } else {
          type = 0;
        }
        _wasmfs_node_record_dirent(vec, name, type);
      });
    }
  },

  wasmfs_node_get_mode__deps: ['$wasmfs$node$lstat'],
  wasmfs_node_get_mode: function(path_p, mode_p) {
    let stat = wasmfs$node$lstat(UTF8ToString(path_p));
    if (stat === undefined) {
      return 0;
    }
    {{{ makeSetValue('mode_p', 0, 'stat.mode', 'i32') }}}
    return 1;
  }
});
