const mod = Process.getModuleByName("WeChat");
console.log("[+] Base Address:", mod.base);
var counterMap = new Map();

function checkValid(p) {
    if (p.isNull()) {
        return false;
    }

    if (!p.and(0x7).isNull()) {
        return false;
    }
    return p.compare("0x200000000000")  >= 0 && p.compare("0x700000000000000") < 0;
}

function handlePr(addr, keyword) {
    const realAddr = ptr("0x" + addr).sub("0x100000000").add(mod.base);
    console.log("[+] real Address:", realAddr)

    Interceptor.attach(realAddr, {
        onEnter(args) {
            const currentCount = counterMap.get(addr) || 0;
            counterMap.set(addr, currentCount + 1);
            for (let i = 0; i < 30; i++) {
                try {
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

                        if (s.includes(keyword) || keyword === "") {
                            console.log(`\n[+] ${addr} || arg${i} ${args[i]}`);
                            console.log(hexdump(args[i], {length: 64}));
                            console.log(addr + "|| " + s + "\n" +
                                Thread.backtrace(this.context, Backtracer.ACCURATE)
                                    .map(DebugSymbol.fromAddress).join('\n'));
                        }
                    }
                } catch (e) {
                    console.log("Enter Error:", e);
                }
            }


        },

        onLeave(retval) {
            console.log(`===== ${addr} LEAVE =====`);
            console.log(` ${addr}  Return value ${retval}`);
        }
    });

}


const prs = ["105831328", "1058469dc", "10587c208"]
const k = "o.o.o.o";
for (let pr of prs) {
    handlePr(pr, k);
}

function ShowCount() {
    for (let [addr, count] of counterMap) {
        console.log(`${addr}: ${count}`);
    }
}

function clearCount() {
    counterMap.clear();
    console.log("Counter cleared.");
}
