const libc = Process.getModuleByName("libSystem.B.dylib");

// 2. 拦截 memcpy
const memcpy_ptr = libc.findExportByName("memcpy");

if (memcpy_ptr) {
    console.log("[+] Hooking memcpy.");
    Interceptor.attach(memcpy_ptr, {
        onEnter(args) {
            console.log("=====  Enter =====");
            for (let i = 0; i < 10; i++) {
                try {
                    if (checkValid(args[i])) {
                        const buf = args[i].readByteArray(128)
                        if (!buf) {
                            continue;
                        }
                        console.log(`\n[+] arg${i} ${args[i]}`);
                        let s = "";
                        const u8 = new Uint8Array(buf);
                        for (let b of u8) {
                            if (b >= 0x20 && b <= 0x7E) {
                                s += String.fromCharCode(b);
                            } else {
                                s += ".";
                            }
                        }

                        if (s.includes("3.3.3.3")) {
                            console.log(`\n[+] arg${i} ${args[i]}`);
                            console.log(hexdump(args[i], { length: 64 }));
                            console.log(
                                Thread.backtrace(this.context, Backtracer.ACCURATE)
                                    .map(DebugSymbol.fromAddress).join('\n'));
                            return;
                        }
                    }
                } catch (e) {

                }
            }
        },
        onLeave(retval) {
            // console.log("=====  LEAVE =====");
            // console.log("Return value:", retval);
            // try {
            //     if (checkValid(retval)) {
            //         console.log("Return hexdump:");
            //         console.log(hexdump(retval, {
            //             offset: 0,
            //             length: 128
            //         }));
            //     }
            // } catch (_) {
            // }
        }
    });
}

function checkValid(p) {
    if (p.isNull()) {
        return false;
    }

    if (!p.and(0x7).isNull()) {
        return false;
    }
    if (p.compare(ptr("0x600000000000")) >= 0 && p.compare(ptr("0x700000000000")) < 0) {
        return true;
    }
    return false;
}