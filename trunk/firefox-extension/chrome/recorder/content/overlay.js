/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See www.spikesource.com/license.html)
 * 
 * author: Vinay Srini (vsrini@spikesource.com)
 */

com.spikesource.tg4w.initOverlay = function() {
    var recorder = new com.spikesource.tg4w.Recorder();

    var newrecorder = true;
    try {
        if (window.arguments[0].recorder) {
            recorder = window.arguments[0].recorder;
            recorder.debug("new window, will use existing recorder");
            newrecorder = false;
        }
    } catch (e) {
        dump("overlay.js : new window recorder error: " + e);
    }

    if (newrecorder) {
        window.addEventListener("load", function(e) { recorder.onLoad(".", e); }, false);
    } else {
        window.addEventListener("load", function(e) {
            document.getElementById("recordtoolbar").setAttribute("hidden", true);
            var winName = recorder.windowObserver.addWindow(window);
            gBrowser.addProgressListener(new com.spikesource.tg4w.PageLoadListener(winName));
            recorder.addWindowEventListeners(window, winName);
        }, false);
    }

    return recorder;
}

try {
    com.spikesource.tg4w.recorder = com.spikesource.tg4w.initOverlay();
} catch (e) {
    alert(e);
}
