/**
 * @license
 * Copyright 2022 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */

mergeInto(LibraryManager.library, {
  $wasmFS$node$isWindows: !!process.platform.match(/^win/),
  $wasmFS$node$flagsForNodeMap: (() => {
    let flags = process["binding"]("constants");
    // Node.js 4 compatibility: it has no namespaces for constants
    if (flags["fs"]) {
      flags = flags["fs"];
    }
    let flagsForNodeMap = {
      "{{{ cDefine('O_APPEND') }}}": flags["O_APPEND"],
      "{{{ cDefine('O_CREAT') }}}": flags["O_CREAT"],
      "{{{ cDefine('O_EXCL') }}}": flags["O_EXCL"],
      "{{{ cDefine('O_NOCTTY') }}}": flags["O_NOCTTY"],
      "{{{ cDefine('O_RDONLY') }}}": flags["O_RDONLY"],
      "{{{ cDefine('O_RDWR') }}}": flags["O_RDWR"],
      "{{{ cDefine('O_DSYNC') }}}": flags["O_SYNC"],
      "{{{ cDefine('O_TRUNC') }}}": flags["O_TRUNC"],
      "{{{ cDefine('O_WRONLY') }}}": flags["O_WRONLY"],
      "{{{ cDefine('O_NOFOLLOW') }}}": flags["O_NOFOLLOW"],
    };
#if ASSERTIONS
      // The 0 define must match on both sides, as otherwise we would not
      // know to add it.
      assert(flagsForNodeMap["0"] === 0);
#endif
    return flagsForNodeMap;
  })(),
  $wasmFS$node$convertNodeCode: (e) => {
    var code = e.code;
#if ASSERTIONS
    assert(code in ERRNO_CODES, 'unexpected node error code: ' + code + ' (' + e + ')');
#endif
    return ERRNO_CODES[code];
  },
  // This maps the integer permission modes from http://linux.die.net/man/3/open
  // to node.js-specific file open permission strings at http://nodejs.org/api/fs.html#fs_fs_open_path_flags_mode_callback
  $wasmFS$node$flagsForNode: (flags) => {
    // Ignore these flags from musl, otherwise node.js fails to open the file.
    flags &= ~{{{ cDefine('O_PATH') }}};
    flags &= ~{{{ cDefine('O_NONBLOCK') }}};
    flags &= ~{{{ cDefine('O_LARGEFILE') }}};
    // Node.js doesn't need this passed in, it errors.
    flags &= ~{{{ cDefine('O_DIRECTORY') }}};
    // Some applications may pass it; it makes no sense for a single process.
    flags &= ~{{{ cDefine('O_CLOEXEC') }}};

    var newFlags = 0;
    for (var k in NODEFS.flagsForNodeMap) {
      if (flags & k) {
        newFlags |= NODEFS.flagsForNodeMap[k];
        flags ^= k;
      }
    }
    if (!flags) {
      return newFlags;
    } else {
      // TODO: EINVAL
      abort('EINVAL');
    }
  },
  // TODO: copy more stuff from library_nodefs.js

});
