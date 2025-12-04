const mod = Process.getModuleByName("ilink_protobuf");
var addr = mod.base.add(0x12DD4);
console.log("Hooking SerializeToArray at", addr);

Interceptor.attach(addr, {
    onEnter(args) {
        this.buf = args[1];
        this.size = args[2].toInt32();

        console.log("[+] SerializeToArray called");
        console.log("Buffer:", this.buf, "Size:", this.size);

        console.log(
            Thread.backtrace(this.context, Backtracer.ACCURATE)
                .map(DebugSymbol.fromAddress)
                .join("\n")
        );
    },
    onLeave() {
        try {
            console.log("Data:");
            console.log(hexdump(Memory.readByteArray(this.buf, this.size)));
        } catch (e) {
            console.log("Error:", e);
        }
    }
});