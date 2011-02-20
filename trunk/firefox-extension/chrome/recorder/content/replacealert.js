/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See www.spikesource.com/license.html)
 * 
 * author: Vinay Srini (vsrini@spikesource.com)
 */

//content.document.getElementsByTagName("A")[0].innerHTML = "blah";

content.alert = function (txt) {
    com.spikesource.tg4w.recorder.log('alert called!');
    com.spikesource.tg4w.recorder.onAlert(txt);
}

content.confirm = function (txt) {
    com.spikesource.tg4w.recorder.log('confirm called!');
    return com.spikesource.tg4w.recorder.onConfirm(txt);
}

/*
content.open = function(url, name, features, more) {
    return com.spikesource.tg4w.recorder.onWindowOpen(url, name, features, more);
}
*/

com.spikesource.tg4w.recorder.debug("TestGen4Web-Injected javascript to capture alert/confirm/open");
