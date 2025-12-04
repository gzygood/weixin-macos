const targetModule = Process.findModuleByName("WeChat"); // 仅关注主二进制文件
console.log("Module:", targetModule.base);

function dectectPr(p) {
    const targetPtr = ptr("0x" + p);

    MemoryAccessMonitor.enable(
        {
            base: targetPtr,
            size: 0x10
        },
        {
            onAccess(details) {
                console.log("from:", details.from);
                if (details.from.compare("0x180000000") < 0) {
                    console.log("Operation:", details.operation, p); // read / write / exec
                    console.log("From:", details.from.sub(targetModule.base).add(0x100000000).toString(), p);
                    console.log("Address:", details.address, p);
                    console.log(
                        Thread.backtrace(details.context, Backtracer.ACCURATE)
                            .map(DebugSymbol.fromAddress)
                            .join("\n")
                    );
                }
            }
        });

}

const ps = ["60000132EC32"]
for (let i = 0; i < ps.length; i++) {
    dectectPr(ps[i]);
}