/**
 * @license
 * Copyright 2019 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */

#include "runtime_safe_heap.js"

#if ASSERTIONS || SAFE_HEAP
/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) throw text;
}
#endif

/** @param {string|number=} what */
function abort(what) {
#if ASSERTIONS
  throw new Error(what);
#else
  throw what;
#endif
}

#if SAFE_HEAP
// Globals used by JS i64 conversions (see makeSetValue)
var tempDouble;
var tempI64;
#endif

var tempRet0 = 0;
var setTempRet0 = (value) => { tempRet0 = value };
var getTempRet0 = () => tempRet0;

function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - (x % multiple);
  }
  return x;
}

#if WASM != 2 && MAYBE_WASM2JS
#if !WASM2JS
if (Module['doWasm2JS']) {
#endif
#include "wasm2js.js"
#if !WASM2JS
}
#endif
#endif

#if SINGLE_FILE && WASM == 1 && !WASM2JS
#include "base64Decode.js"
Module['wasm'] = base64Decode('<<< WASM_BINARY_DATA >>>');
#endif

#include "runtime_functions.js"
#include "runtime_strings.js"

var HEAP8, HEAP16, HEAP32, HEAPU8, HEAPU16, HEAPU32, HEAPF32, HEAPF64;
var wasmMemory, buffer, wasmTable;

#if SUPPORT_BIG_ENDIAN
var HEAP_DATA_VIEW;
#endif

function updateGlobalBufferAndViews(b) {
#if ASSERTIONS && USE_PTHREADS
  assert(b instanceof SharedArrayBuffer, 'requested a shared WebAssembly.Memory but the returned buffer is not a SharedArrayBuffer, indicating that while the browser has SharedArrayBuffer it does not have WebAssembly threads support - you may need to set a flag');
#endif
  buffer = b;
#if SUPPORT_BIG_ENDIAN
  HEAP_DATA_VIEW = new DataView(b);
#endif
  HEAP8 = new Int8Array(b);
  HEAP16 = new Int16Array(b);
  HEAP32 = new Int32Array(b);
  HEAPU8 = new Uint8Array(b);
  HEAPU16 = new Uint16Array(b);
  HEAPU32 = new Uint32Array(b);
  HEAPF32 = new Float32Array(b);
  HEAPF64 = new Float64Array(b);
}

#if IMPORTED_MEMORY
#if USE_PTHREADS
if (!ENVIRONMENT_IS_PTHREAD) {
#endif
#if ALLOW_MEMORY_GROWTH && MAXIMUM_MEMORY != FOUR_GB
  var wasmMaximumMemory = {{{ MAXIMUM_MEMORY >>> 16 }}};
#else
  var wasmMaximumMemory = {{{ INITIAL_MEMORY >>> 16}}};
#endif
  wasmMemory = new WebAssembly.Memory({
    'initial': {{{ INITIAL_MEMORY >>> 16 }}}
#if USE_PTHREADS || !ALLOW_MEMORY_GROWTH || MAXIMUM_MEMORY != FOUR_GB
    , 'maximum': wasmMaximumMemory
#endif
#if USE_PTHREADS
    , 'shared': true
#endif
    });
  updateGlobalBufferAndViews(wasmMemory.buffer);
#if USE_PTHREADS
} else {
#if MODULARIZE
  updateGlobalBufferAndViews(Module.buffer);
#else
  updateGlobalBufferAndViews(wasmMemory.buffer);
#endif
}
#endif // USE_PTHREADS
#endif // IMPORTED_MEMORY

#include "runtime_stack_check.js"
#include "runtime_assertions.js"

#if LOAD_SOURCE_MAP
var wasmSourceMap;
#include "source_map_support.js"
#endif

#if USE_OFFSET_CONVERTER
var wasmOffsetConverter;
#include "wasm_offset_converter.js"
#endif

#if EXIT_RUNTIME
var __ATEXIT__    = []; // functions called during shutdown
var runtimeExited = false;
#endif

#if ASSERTIONS || SAFE_HEAP || USE_ASAN
var runtimeInitialized = false;
#endif

#include "runtime_math.js"
#include "memoryprofiler.js"
#include "runtime_debug.js"

// === Body ===
