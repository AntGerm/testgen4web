/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See www.spikesource.com/license.html)
 * 
 * author: Vinay Srini (vsrini@spikesource.com)
 */
// types can be 'alert', 'prompt', 'confirm'
com.spikesource.tg4w.Dialog = function(type, text, answer, value) {
    this.type = type;
    this.text = text;
    this.answer = answer;
    this.value = value;
}

// all types have text
com.spikesource.tg4w.Dialog.prototype.getText = function() {
    return this.text;
}

// confirm and prompt can have an answer
com.spikesource.tg4w.Dialog.prototype.getAnswer = function() {
    if (this.type != "alert") {
        return this.answer;
    } else {
        throw (this.type + " cannot have an answer");
    }
}

// only prompt can have a value
com.spikesource.tg4w.Dialog.prototype.getValue = function() {
    if (this.type != "prompt") {
        return this.value;
    } else {
        throw (type + " cannot have a value");
    }
}

// types can be 'alert', 'prompt', 'confirm'
com.spikesource.tg4w.Dialog.prototype.getType = function() {
    return this.type;
}

com.spikesource.tg4w.ExpectDialog = function() {
    this.dialogs = new Array();
}

com.spikesource.tg4w.ExpectDialog.prototype.pushAlert = function(txt) {
    var recorder = com.spikesource.tg4w.recorder;
    this.dialogs.push(new com.spikesource.tg4w.Dialog("alert", txt, null, null));
    recorder.log("alert pushed, length: " + this.dialogs.length);
}

com.spikesource.tg4w.ExpectDialog.prototype.pushConfirm = function(txt, answer) {
    var recorder = com.spikesource.tg4w.recorder;
    this.dialogs.push(new com.spikesource.tg4w.Dialog("confirm", txt, answer, null));
    recorder.log("confirm pushed, length: " + this.dialogs.length);
}

com.spikesource.tg4w.ExpectDialog.prototype.pushPrompt = function(txt, answer) {
    var recorder = com.spikesource.tg4w.recorder;
    this.dialogs.push(new com.spikesource.tg4w.Dialog("prompt", txt, answer, null));
    recorder.log("confirm pushed, length: " + this.dialogs.length);
}

com.spikesource.tg4w.ExpectDialog.prototype.popConfirm = function(txt, answer) {
    var recorder = com.spikesource.tg4w.recorder;
    if (this.dialogs.length > 0 && this.dialogs[0].getType() == "confirm") {
        return this.dialogs.shift();
    } else {
        recorder.log("no confirms expected on the top of the queue");
        return null;
    }
}

com.spikesource.tg4w.ExpectDialog.prototype.popPrompt = function(txt, answer) {
    var recorder = com.spikesource.tg4w.recorder;
    if (this.dialogs.length > 0 && this.dialogs[0].getType() == "prompt") {
        return this.dialogs.shift();
    } else {
        recorder.log("no confirms expected on the top of the queue");
        return null;
    }
}

com.spikesource.tg4w.ExpectDialog.prototype.popAlert = function(txt, answer) {
    var recorder = com.spikesource.tg4w.recorder;
    if (this.dialogs.length > 0 && this.dialogs[0].getType() == "alert") {
        return this.dialogs.shift();
    } else {
        recorder.log("no alerts on the top of the queue");
        return null;
    }
}

/*
var testexpect = new com.spikesource.tg4w.ExpectDialog();
testexpect.pushAlert("new alert");
testexpect.pushConfirm("new confirm1", true);

alert("this should be null " + testexpect.popConfirm());
alert("this should be alert '" + testexpect.popAlert().getText() + "'");
alert("this should be null " + testexpect.popAlert());
alert("this should be confirm '" + testexpect.popConfirm().getText() + "'");
*/
