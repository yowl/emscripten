#include <stdint.h>
#include <stdio.h>
#include <limits.h>
#include <emscripten/em_asm.h>

int main() {
  int64_t num = (2LL << 55) | 42LL;
  printf("native = %lld\n", num);

  EM_ASM({
    console.log("js     = " + $0);
  }, num);
}
