var runReadX0 = ptr(0)
var originCgiPtr = ptr(0)

function patchRunReadWrite() {
    Interceptor.attach(runReadWriteAddr, {
        onEnter: function (args) {
            try {
                if (this.context.x5.isNull() || this.context.x5.compare(baseAddr) <= 0) {
                    return
                }

                const x5 = this.context.x5;
                const cTaskId = x5.add(0x308).readU32();
                if (cTaskId !== taskIdGlobal) {
                    return
                }
                console.log("[+] enter runReadWriteAddr: " + runReadWriteAddr)
                const domainAddr = x5.add(0xd8);
                const domainBytes = [
                    0x73, 0x7A, 0x73, 0x68, 0x6F, 0x72, 0x74, 0x2E, // szshort.
                    0x77, 0x65, 0x69, 0x78, 0x69, 0x6E, 0x2E, 0x71, // weixin.q
                    0x71, 0x2E, 0x63, 0x6F, 0x6D                    // q.com
                ];

                domainAddr.writeByteArray(domainBytes);
                domainAddr.add(domainBytes.length).writeU8(0);
                domainAddr.add(23).writeU8(0x15);

                runReadX0 = this.context.x0;
                originCgiPtr = runReadX0.add(0x1018).readPointer();
                runReadX0.add(0x1018).writePointer(cgiAddr);
                runReadX0.add(0x1020).writeU64(0x22);
                console.log("[+] enter runReadWriteAddr finished: " + domainAddr.readUtf8String())
            } catch (e) {
                console.log("[-] Memory access error at onEnter: " + e);
            }

        }
    })

    Interceptor.attach(runReadWriteAddr1, {
        onEnter: function (args) {
            try {
                if (this.context.x20.isNull() || this.context.x20.compare(baseAddr) <= 0) {
                    return
                }

                const cTaskId = this.context.x20.add(0x308).readU32();
                if (cTaskId !== taskIdGlobal) {
                    return
                }
                runReadX0.add(0x1018).writePointer(originCgiPtr);
                console.log("[+] leave runReadWriteAddr finished: " + runReadWriteAddr)
            } catch (e) {
                console.log("[-] Memory access error at onLeave: " + e);
            }
        }
    })
    runReadWriteAddr1
}

setImmediate(patchRunReadWrite)