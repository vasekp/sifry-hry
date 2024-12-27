wasm.wasm: wasm.cpp
	clang --target=wasm32 -emit-llvm -c -S wasm.cpp
	llc -march=wasm32 -filetype=obj wasm.s
	wasm-ld --no-entry --export-all --import-undefined -o wasm.wasm wasm.s.o
