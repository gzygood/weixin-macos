# weixin-macos
使用frida进行逆向       
frida -f /Applications/WeChat.app/Contents/MacOS/WeChat -l script.js        

### 第一次尝试，根据关键字失败
报错：Failed to attach: unable to access process with pid 43649 from the current user account    
重启进入recovery模式，然后关闭安全模式    

frida-trace -p 进程号 -i "*Message*" --decorate 比较好用 
```
frida-trace -p 89797 -i '*send*'  -x '*objc_msgSend_noarg*' -x '*objc_msgSend_debug*' -x '*objc_msgSend*' -x "*_HIDisableSuddenTerminationForSendEvent*" -x "*_HIEnableSuddenTerminationForSendEvent*" -x "*SendEventToEventTarget*" -x "*s10RTCUtility10XPCMessageV4dictAA16RTCXPCDictionaryVvg*" -x "*MTLMessageContextEnd*" -x "*ictAA16RTCXPCDictionaryVvg*" -x "*_MTLMessageContextBegin_*" -x "*CFMachMessageCheckForAndDestroyUnsentMessag*" -x "*SLEventCopyAuthenticationMessage*" -x "*SendTextInputEvent_WithCompletionHandler*" -x '*mach_msg_send*' -x "*dispatch_mach_send_with_result_and_async_reply_4libxpc*" -x "*dispatch_mach_send_with_result_and_async_reply_4libxpc*" -x "*dispatch_mach_send_with_result*" --decorate --ui-port 60000     
```

打印上游调用
```
defineHandler({
  onEnter(log, args, state) {
    const connectionPtr = args[0];
    const messagePtr = args[1];
    const targetqPtr = args[2];
    const handlerPtr = args[3];

    // --- 1. 打印函数调用信息 ---
    log(`\n======================================================`);
    log(`[HOOKED] xpc_connection_send_message_with_reply 被调用`);

    // --- 2. 打印调用栈（最重要的一步，用于定位上层应用函数）---
    const backtrace = Thread.backtrace(this.context, Backtracer.ACCURATE)
        .map(DebugSymbol.fromAddress).join('\n');
    log("调用栈 (寻找上游应用函数):");
    log(backtrace); 
    log("------------------------------------------------------");

    // --- 3. 打印指针参数 ---
    log(`[Arg 1] Connection (xpc_connection_t): ${connectionPtr}`);
    log(`[Arg 2] Message (xpc_object_t):       ${messagePtr}`);
    log(`[Arg 3] Target Queue (dispatch_queue_t): ${targetqPtr}`);
    log(`[Arg 4] Reply Handler:                ${handlerPtr}`);
    log("------------------------------------------------------");

    // --- 4. 打印 XPC 消息的 HexDump 预览 ---
    if (messagePtr.isNull() === false) {
        log(`[Arg 2] Message 原始数据预览 (32 Bytes):`);
        
        // 注意：这里我们使用 hexdump()，然后将结果作为一个字符串打印到 log() 中
        const hexDumpOutput = hexdump(messagePtr, { length: 32 });
        log(hexDumpOutput); 
    }
    
    log(`======================================================`);
  },

  onLeave(log, retval, state) {
    // 留空，或在这里打印返回值，例如：
    // log(`xpc_connection_send_message_with_reply 返回: ${retval}`);
  }
});
```

会有一个http页面，进去之后，会有一些微信的代码，这些代码中能分析出微信是怎么发送消息的

### 第二次尝试，根据mac的系统函数
```
frida-trace -p 89797 -i "*_send*" -i "*_sendto*" -i "*_write*" -x "*xpc_connection_send_message*" -x '*objc_msgSend_noarg*' -x '*objc_msgSend_debug*' -x '*objc_msgSend*' -x "*_HIDisableSuddenTerminationForSendEvent*" -x "*_HIEnableSuddenTerminationForSendEvent*" -x "*SendEventToEventTarget*" -x "*s10RTCUtility10XPCMessageV4dictAA16RTCXPCDictionaryVvg*" -x "*MTLMessageContextEnd*" -x "*ictAA16RTCXPCDictionaryVvg*" -x "*_MTLMessageContextBegin_*" -x "*CFMachMessageCheckForAndDestroyUnsentMessag*" -x "*SLEventCopyAuthenticationMessage*" -x "*SendTextInputEvent_WithCompletionHandler*" -x '*mach_msg_send*' -x "*dispatch_mach_send_with_result_and_async_reply_4libxpc*" -x "*dispatch_mach_send_with_result_and_async_reply_4libxpc*" -x "*dispatch_mach_send_with_result*" --decorate --ui-port 60000     
```
