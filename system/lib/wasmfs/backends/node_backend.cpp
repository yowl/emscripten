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
void wasmfs_node_readdir(const char* path,
                         std::vector<Directory::Entry>* entries);
int wasmfs_node_get_mode(const char* path, mode_t* mode);

} // extern "C"

class NodeFile : public DataFile {
  std::string path;

public:
  NodeFile(mode_t mode, backend_t backend, std::string path)
    : DataFile(mode, backend), path(path) {
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
  std::shared_ptr<File> getChild(const std::string& name) override {
    auto childPath = path + '/' + name;
    static_assert(std::is_same_v<mode_t, unsigned int>);
    // TODO: also retrieve and set ctime, atime, ino, etc.
    mode_t mode;
    int exists = wasmfs_node_get_mode(childPath.c_str(), &mode);
    if (!exists) {
      return nullptr;
    }
    std::shared_ptr<File> child;
    if (S_ISREG(mode)) {
      child = std::make_shared<NodeFile>(mode, getBackend(), childPath);
    } else if (S_ISDIR(mode)) {
      child = std::make_shared<NodeDirectory>(mode, getBackend(), childPath);
    } else if (S_ISLNK(mode)) {
      // return std::make_shared<NodeSymlink>(mode, getBackend(), childPath);
    }
    if (!child) {
      return nullptr;
    }
    child->locked().setParent(shared_from_this());
    return child;
  }

  bool removeChild(const std::string& name) override {
    // TODO
    return false;
  }

  std::shared_ptr<File> insertChild(const std::string& name,
                                    std::shared_ptr<File> file) override {
    // TDOO
    return nullptr;
  }

  std::string getName(std::shared_ptr<File> file) override {
    // TODO
    return "";
  }

  size_t getNumEntries() override {
    // TODO: optimize this?
    return getEntries().size();
  }

  std::vector<Directory::Entry> getEntries() override {
    std::vector<Directory::Entry> entries;
    wasmfs_node_readdir(path.c_str(), &entries);
    return entries;
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

void EMSCRIPTEN_KEEPALIVE wasmfs_node_record_dirent(
  std::vector<Directory::Entry>* entries, const char* name, int type) {
  entries->push_back({name, File::FileKind(type), 0});
}

} // extern "C"

} // namespace wasmfs
