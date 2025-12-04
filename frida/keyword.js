const mod = Process.getModuleByName("WeChat");


function memoGet(p) {
    p = "0x" + p;
    const idaAddr = ptr(p);
    MemoryAccessMonitor.enable(
        {
            base: idaAddr,
            size: 0x10  // buffer 大小
        },
        {
            onAccess(details) {
                console.log("Access by:", details.from);
                if (details.from.compare(mod.base) > 0 && details.from.compare(mod.base.add(mod.size)) < 0) {
                    console.log("dump idaAddr", hexdump(idaAddr, {length: 0x40}));
                }
            }
        }
    );

}

function attach(from) {
    const realAddr = ptr(from);

    console.log("[+] Real Function Address:", realAddr);

    Interceptor.attach(realAddr, {
        onEnter(args) {
            for (let i = 0; i < 30; i++) {
                try {
                    if (args[i].isNull()) {
                        continue;
                    }
                    // console.log(`\n[+] arg${i} ${args[i]}`);

                    if (checkValid(args[i])) {
                        const buf = args[i].readByteArray(128)
                        if (!buf) {
                            continue;
                        }
                        let s = "";
                        const u8 = new Uint8Array(buf);
                        for (let b of u8) {
                            if (b >= 0x20 && b <= 0x7E) {
                                s += String.fromCharCode(b);
                            } else {
                                s += ".";
                            }
                        }

                        if (keyword === "" || s.includes(keyword)) {
                            console.log(`\n[+] arg${i} ${args[i]} ${s}`);
                            console.log(hexdump(args[i], {length: 128}));
                            console.log(
                                Thread.backtrace(this.context, Backtracer.ACCURATE)
                                    .map(DebugSymbol.fromAddress).join('\n'));
                            return;
                        }
                    }
                } catch (e) {
                    console.log("Enter Error:", e);
                }
            }

        },

        onLeave(retval) {
            console.log("===== sub_105808800 LEAVE =====");
            console.log("Return value:", retval);
            try {
                if (checkValid(retval)) {
                    console.log(hexdump(retval, {
                        offset: 0,
                        length: 40
                    }));
                }
            } catch (_) {
            }
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

const keyword = "mmmmm";

const addrs = ["600001EF17DA"]
for (let addr of addrs) {
    memoGet(addr);
}

console.log(keyword);
console.log(addrs);