// Copyright 2021 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

#include <memory>

#include "backend.h"
#include "file.h"
#include "wasmfs.h"

namespace wasmfs {

class NodeBackend;

extern "C" {

// JS function declarations
void _wasmfs_node_readdir(const char* path, void* entries);

} // extern "C"

class NodeFile : public DataFile {
public:
  NodeFile(mode_t mode, backend_t backend) : DataFile(mode, backend) {
    // TODO: initialize node file
  }

private:
  size_t getSize() override {
    // TODO: getSize
    return 0;
  }
  __wasi_errno_t read(uint8_t* buf, size_t len, off_t offset) override {
    // TODO: read
    return 0;
  }
  __wasi_errno_t write(const uint8_t* buf, size_t len, off_t offset) override {
    // TODO: write
    return 0;
  }

  void flush() override {}
};

class NodeDirectory : public Directory {
  std::string path;

public:
  NodeDirectory(mode_t mode, backend_t backend, std::string path)
    : Directory(mode, backend), path(path) {}

private:
  std::shared_ptr<File> getEntry(const std::string& name) override {
    // TODO
    return nullptr;
  }

  bool removeEntry(const std::string& name) override {
    // TODO
    return false;
  }

  std::shared_ptr<File> insertEntry(const std::string& name,
                                    std::shared_ptr<File> file) override {
    // TDOO
    return nullptr;
  }

  std::string getName(std::shared_ptr<File> file) override {
    // TODO
    return "";
  }

  size_t getNumEntries() override {
    // TODO
    return 0;
  }

  std::vector<Directory::Entry> getEntries() override {
    std::vector<Directory::Entry> entries;
    _wasmfs_node_readdir(path.c_str(), &entries);
    return {};
  }
};

class NodeBackend : public Backend {
  std::string rootPath;

public:
  NodeBackend(const std::string& rootPath) : rootPath(rootPath) {}

  std::shared_ptr<DataFile> createFile(mode_t mode) override {
    return std::make_shared<NodeFile>(mode, this, rootPath);
  }

  std::shared_ptr<Directory> createDirectory(mode_t mode) override {
    return std::make_shared<NodeDirectory>(mode, this, rootPath);
  }
};

// TODO: symlink

extern "C" {

backend_t wasmfs_create_node_backend(const char* root) {
  return wasmFS.addBackend(std::make_unique<NodeBackend>(root));
}

void EMSCRIPTEN_KEEPALIVE
_wasmfs_node_record_dirent(void* vec, const char* name, int type, int mode) {
  auto& entries = *(std::vector<Directory::Entry>*)vec;
  entries.push_back({string,
  // TODO
}

} // extern "C"

} // namespace wasmfs
