/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See www.spikesource.com/license.html)
 *
 * author: Vinay Srini (vsrini@spikesource.com)
 */

com.spikesource.tg4w.tg4w_fillInProgress = false;

com.spikesource.tg4w.Recorder = function() {
    this.loadedFileVersion = this.getMyVersion();
    this.loadedFileName = null;
    this.actions = com.spikesource.tg4w.tg4wcommon.createTg4wArray();
    this.recording = false;
    this.playing   = false;
    this.pagesready = com.spikesource.tg4w.tg4wcommon.createTg4wArray();
    this.selectedText = null;
    this.lastRightClickedTarget = null;
    this.nextOnclickActionGoesTo = null;
    this.paused = com.spikesource.tg4w.tg4wcommon.TG4W_NOT_PAUSED;
    this.runContext = com.spikesource.tg4w.tg4wcommon.createTg4wArray();
    this.findObject = new com.spikesource.tg4w.FindObject();

    this.expectDialog = new com.spikesource.tg4w.ExpectDialog();
    this.batch = com.spikesource.tg4w.tg4wcommon.createTg4wArray();
    this.batchstep = 0;

    this.replaystep = 0;
    this.playLoop = false;
    this.playLoopTimes = "-1";
    this.loopCount = 0;
    this.windowObserver = new com.spikesource.tg4w.NewWindowObserver(this);
    this.openWindows = com.spikesource.tg4w.tg4wcommon.createTg4wArray();
    this.tg4wdh = new com.spikesource.tg4w.Tg4wDatasetHandler();
    this.runtimevars = {};

    this._statusCallback = com.spikesource.tg4w.tg4wcommon.createTg4wArray();
    this._editorCallback = com.spikesource.tg4w.tg4wcommon.createTg4wArray();
    this._editStepEditorCallback = com.spikesource.tg4w.tg4wcommon.createTg4wArray();

    this.editorDetached = null;
    try {
        this.simulBrowse = new Tg4wSimulBrowse("http://testgen4web.appspot.com/");
    } catch (e) {
        this.simulBrowse = null;
    }

    try {
        this.reporting = new com.spikesource.tg4w.TestReport(this);
    } catch (e) {
        alert(e);
        this.reporting = null;
    }
}

com.spikesource.tg4w.Recorder.prototype.getMyVersion = function() {
    return com.spikesource.tg4w.RECORDER_VERSION;
}

com.spikesource.tg4w.Recorder.prototype.externalEditorClosing = function () {
    this.callEditorWindowEvents("closing");
    this.editorDetached = null;
}

com.spikesource.tg4w.Recorder.prototype.clearCookies = function (domain, name) {
    var cookieMgr = Components.classes["@mozilla.org/cookiemanager;1"]
        .getService(Components.interfaces.nsICookieManager);

    var cookiesToRemove = [];
    for (var e = cookieMgr.enumerator; e.hasMoreElements();) {
        var cookie = e.getNext().QueryInterface(Components.interfaces.nsICookie); 
        if (domain == cookie.host && (name == null || name == cookie.name)) {
            cookiesToRemove.push(cookie);
        }
    }
    for (var i = 0; i < cookiesToRemove.length; i ++) {
        var cookie = cookiesToRemove[i];
        cookieMgr.remove(cookie.host, cookie.name, cookie.path, false);
    }
    return cookiesToRemove.length;
}

com.spikesource.tg4w.Recorder.prototype.toggleInlineEditSteps = function () {
    var inlineeditor = document.getElementById("newrecordeditor");
    var sizer = document.getElementById("tg4wresizer");
    if (inlineeditor.hasAttribute("collapsed")) {
        inlineeditor.setAttribute("height", com.spikesource.tg4w.tg4woptions.getInlineEditorSize());
        inlineeditor.removeAttribute("collapsed");
        sizer.removeAttribute("collapsed");
        this.callEditorWindowEvents("opening");

        document.getElementById("inline-minimize-button").removeAttribute("hidden");
    } else {
        inlineeditor.setAttribute("collapsed", "true");
        sizer.setAttribute("collapsed", "true");
        document.getElementById("inline-tg4w").removeAttribute("height");
        this.callEditorWindowEvents("closing");

        document.getElementById("inline-minimize-button").setAttribute("hidden", "true");
    }
}

com.spikesource.tg4w.Recorder.prototype.saveInlineEditorHeight = function () {
    var elem = document.getElementById('newrecordeditor');
    com.spikesource.tg4w.tg4woptions.setInlineEditorSize(window.getComputedStyle(elem, "height").getPropertyValue("height"));
}

com.spikesource.tg4w.Recorder.prototype.toggleInlineEditor = function () {
    if (this.editorDetached) {
        this.editorDetached.focus();
        return;
    }

    var inlinetg4w = document.getElementById("inline-tg4w");
    if (inlinetg4w.hasAttribute("hidden")) {
        inlinetg4w.removeAttribute("hidden");
        this.callEditorWindowEvents("opening");
        if (this.editorDetached && !this.editorDetached.closed) {
            this.editorDetached.close();
            this.editorDetached = null;
        }
    } else {
        inlinetg4w.setAttribute("hidden", "true");
        this.callEditorWindowEvents("closing");
    }
}

com.spikesource.tg4w.Recorder.prototype.callEditorWindowEvents = function(state) {
    var windowNames = ["newEditStepEditor", "newEditSteps", "runStatusWindow", "debugWindow"];
    for (var i = 0; i < windowNames.length; i ++) {
        var win = this.getLayoutDocument().getElementById(windowNames[i]).contentWindow;
        if (state == "opening") {
            win.openingYou(com.spikesource.tg4w.recorder);
        } else if (state == "closing") {
            win.closingYou(com.spikesource.tg4w.recorder);
        }
    }
}

/*
com.spikesource.tg4w.Recorder.prototype.detachEditor = function () {
    this.toggleInlineEditor();
    this.editorDetached = window.openDialog("chrome://recorder/content/detachedEditorOverlay.xul", "detachedTg4wEditor", "", {recorder:this} );
}

com.spikesource.tg4w.Recorder.prototype.toggleEditor = function () {
    var editor = this.getLayoutDocument().getElementById('recordeditor');
    if (editor.hasAttribute("hidden")) {
        editor.removeAttribute('hidden');
    } else {
        editor.setAttribute('hidden', 'true');
    }
}

com.spikesource.tg4w.Recorder.prototype.toggleTestGen4WebShow = function () {
    if (com.spikesource.tg4w.tg4woptions.showInToolbar()) {
        var recorderToolbar = this.getLayoutDocument().getElementById("recordtoolbar");
        if (recorderToolbar.parentNode.getAttribute("id") != "navigator-toolbox") {
            var toolbox = this.getLayoutDocument().getElementById("navigator-toolbox");
            toolbox.appendChild(recorderToolbar);
        } else {
            var tg4wOverlay = this.getLayoutDocument().getElementById("tg4w-overlay");
            tg4wOverlay.appendChild(recorderToolbar);
        }

        var tg4wOverlay = this.getLayoutDocument().getElementById("tg4w-overlay");
        tg4wOverlay.setAttribute("hidden", "true");
    } else {
        var tg4wOverlay = this.getLayoutDocument().getElementById("tg4w-overlay");
        if (tg4wOverlay.hasAttribute("hidden")) {
            tg4wOverlay.removeAttribute("hidden");
        } else {
            tg4wOverlay.setAttribute("hidden", "true");
        }
    }
}
*/

com.spikesource.tg4w.Recorder.prototype.openUrlInNewTab = function (browserWindow, url) {
    var newTab = browserWindow.addTab(url);
    browserWindow.selectedTab = newTab; 
}

com.spikesource.tg4w.Recorder.prototype.whatIs = function() {
    if (this.lastRightClickedTarget != null) {
        this.error(this.getXpath(this.lastRightClickedTarget));
    }
}

com.spikesource.tg4w.Recorder.prototype.findMe = function(winref, element) {
    if (!element) {
        element = this.lastRightClickedTarget;
    }
    var xpath = this.findCrudeXpath(element, winref);
    this.error(xpath);
    var element = this.getElement(window.content.document, com.spikesource.tg4w.tg4wcommon.trimStr(xpath));
    com.spikesource.tg4w.tg4wcommon.hilightObject(element, "red", true);
}

com.spikesource.tg4w.Recorder.prototype.changeLoopImage = function(imgType, label) {
    var loopElem = this.getLayoutDocument().getElementById("loop");
    loopElem.image = "chrome://recorder/skin/loop_" + imgType + ".png";
    loopElem.setAttribute("tooltiptext", label);
    loopElem.setAttribute("label", label);
}

com.spikesource.tg4w.Recorder.prototype.updateLoopState = function() {
    if (this.playLoop) {
        this.playLoop = false;
        this.changeLoopImage("none", "No Loop");
    } else {
        var answer = prompt("Enter '-1' to loop infinitely", this.playLoopTimes);

        if (answer) {
            if (! isNaN(parseInt(answer))) {
                this.playLoopTimes = parseInt(answer);
                this.playLoop = true;
                if (this.playLoopTimes == -1) {
                    this.changeLoopImage("infinite", "Loop Infinite");
                } else if (this.playLoopTimes > 1) {
                    this.changeLoopImage("n", "Loop " + this.playLoopTimes);
                }
            } else {
                this.log(answer + " not a number, ignoring command");
            }
        } else {
            this.log("esc pressed, ignoring command");
        }
    }
}

com.spikesource.tg4w.Recorder.prototype.verifyPageTitle = function(winref) {
    var frameSequence = this.findObject.getFrameSequenceFromEventTarget(this.getWorkingDocument().body);
    this.record("verify-title", "*", this.getPageTitle(), false, frameSequence, winref);
}

com.spikesource.tg4w.Recorder.prototype.getPageTitle = function() {
    var txt = this.getWorkingDocument().title;
    return com.spikesource.tg4w.tg4wcommon.trimStr(txt);
}

com.spikesource.tg4w.Recorder.prototype.redirectNextOnclickAction = function(fctn, msg) {
    this.nextOnclickActionGoesTo = fctn;
    this.setStatus(msg);
}

com.spikesource.tg4w.Recorder.prototype.newStep = function(stepName) {
    if (stepName == "assert-text") {
        this.redirectNextOnclickAction(this.verifySelectedText, 'Select text now!');
    } else if (stepName == "assert-no-text") {
        this.assertTextNotPresent();
    } else {
        com.spikesource.tg4w.recorder.editStepEditorCallback(this, 'new', stepName);
    }
}

com.spikesource.tg4w.Recorder.prototype.findCrudeXpath = function(element, winref) {
    var xpath = this.getXpath(element, winref);
    if (xpath.search(/\/\*\//, 'g') == (xpath.length - 3)) {
        xpath = xpath.replace(/\/\*\//, '');
    }

    var moreXpath = "";
    if (com.spikesource.tg4w.tg4woptions.getRecordMode() == "tg4w_smart") {
        var untilElement = null;
        if (xpath == "*/") {
            untilElement = this.getWorkingDocument();
            xpath = "*";
        } else {
            untilElement = this.getElement(this.getWorkingDocument(), xpath);
        }

        if (untilElement != element) {
            moreXpath = this.findObject.tg4w_dumb_getXpath(element, untilElement);
            if (moreXpath.indexOf("/HTML") == 0) {
                var split = moreXpath.split("/");
                split.splice(0, 3);
                moreXpath = "";
                for (var i = 0; i < split.length; i++) {
                    moreXpath += "/" + split[i];
                }
            }
        }
    }

    xpath += moreXpath;
    return xpath;
}

com.spikesource.tg4w.Recorder.prototype.assertTextNotPresent = function() {
    var answer = prompt("Assert text not present");
    answer = com.spikesource.tg4w.tg4wcommon.trimStr(answer);
    if (!com.spikesource.tg4w.tg4wcommon.isBlank(answer)) {
        var frameSequence = this.findObject.getFrameSequenceFromEventTarget(this.getWorkingDocument().body);
        this.record("assert-text-does-not-exist", "*", answer, false, frameSequence, ".");
    }
}

com.spikesource.tg4w.Recorder.prototype.verifySelectedText = function(winref, e) {
    var txt = '';
    var foundIn = '';
    if (window.content.getSelection) {
        txt = window.content.getSelection();
        foundIn = 'window.getSelection()';
    } else if (this.getWorkingDocument().getSelection) {
        txt = this.getWorkingDocument().getSelection();
        foundIn = 'document.getSelection()';
    } else if (this.getWorkingDocument().selection) {
        txt = this.getWorkingDocument().selection.createRange().text;
        foundIn = 'document.selection.createRange()';
    }

    if (txt == '') {
        this.log("None selected");
        return;
    }

    var xpath = this.findCrudeXpath(e.target, winref);
    this.log("found selected text under xpath : " + xpath);
    var answer = prompt("Text was found under the following element.\nPress OK to keep xpath, or cancel to assert text in entire page", xpath);
    if (!answer) {
        xpath = "*";
    }

    this.record("assert-text-exists", xpath, txt, false, null, ".");
    this.setStatus("assert-text recorded");
}

com.spikesource.tg4w.Recorder.prototype.reset = function() {
    var answer = confirm(com.spikesource.tg4w.tg4wcommon.localizeString("resetConfirm"));
    if (answer) {
        this.reset_all();
        this.setStatus("Reset");
        this.showStatusCallback(this, "reset");
        this.editorCallback(this, "reset");
    }
}

com.spikesource.tg4w.Recorder.prototype.reset_all = function() {
    this.reset_all_but_batch();
    this.reset_batch();
}

com.spikesource.tg4w.Recorder.prototype.reset_batch = function() {
    this.log ("resetting batch");
    this.batch = com.spikesource.tg4w.tg4wcommon.createTg4wArray();
}

com.spikesource.tg4w.Recorder.prototype.reset_all_but_batch = function() {
    this.log ("resetting all but batch");
    this.loadedFileVersion = this.getMyVersion();
    this.loadedFileName = null;
    this.actionsCount = -1;
    this.actions = com.spikesource.tg4w.tg4wcommon.createTg4wArray();
    this.recording = false;
    this.playing = false;
    this.pagesready.length = 0;
    this.runContext = com.spikesource.tg4w.tg4wcommon.createTg4wArray();
    this.setStatus("Ready");
    this.paused = com.spikesource.tg4w.tg4wcommon.TG4W_NOT_PAUSED;
    this.expectDialog = new com.spikesource.tg4w.ExpectDialog();
    this.removeNewWindowObserver();
    this.windowObserver.resetData();
    this.addNewWindowObserver();
    this.tg4wdh = new com.spikesource.tg4w.Tg4wDatasetHandler();
    this.runtimevars = {};
    this.editorCallback(this, "reset");
    this.log("resetting all but batch done.");
}

com.spikesource.tg4w.Recorder.prototype.onAlert = function(text) {
    if (com.spikesource.tg4w.recorder.isRecording()) {
        com.spikesource.tg4w.tg4wcommon.TG4W_promptService.alert(window, "Javascript Alert - Recording", text);
        com.spikesource.tg4w.recorder.log("alert generated: " + text + " action number : " + com.spikesource.tg4w.recorder.actions.length);
        com.spikesource.tg4w.recorder.record("alert", "-", text, false);
    } else if (com.spikesource.tg4w.recorder.isPlaying()) {
        var alertDialog = com.spikesource.tg4w.recorder.expectDialog.popAlert();
        com.spikesource.tg4w.recorder.log("alert generated while on step : " + com.spikesource.tg4w.recorder.actions[com.spikesource.tg4w.recorder.replaystep].action);
        setTimeout("window.openDialog('chrome://recorder/content/myalert.xul', 'myAlert', 'modal,centerscreen,chrome', {delay:1000, text:\"" + text + "\", alertType:\"" + com.spikesource.tg4w.tg4wcommon.localizeString('Alert')+ "\"} )", 10);
    }
}

com.spikesource.tg4w.Recorder.prototype.onWindowOpen = function(url, name, features, more) {
    this.log("new window opened.");
    return window.open(url, name, features, more);
}

com.spikesource.tg4w.Recorder.prototype.onPrompt = function(text, defaultValue) {
    if (com.spikesource.tg4w.recorder.isRecording()) {
        if (!defaultValue) {
            val = {value:""};
        } else {
            val = {value:defaultValue};
        }
        var answer = com.spikesource.tg4w.tg4wcommon.TG4W_promptService.prompt(window, "Javascript Prompt - Recording", text, val, null, {value:false});
        com.spikesource.tg4w.recorder.log("prompt requested: " + text
            + " answer was : " + answer
            + " action number : " + com.spikesource.tg4w.recorder.actions.length);
        com.spikesource.tg4w.recorder.record("prompt", text, answer + "," + val.value, false);
        return val.value;
    } else if (com.spikesource.tg4w.recorder.isPlaying()) {
        var promptDialog = com.spikesource.tg4w.recorder.expectDialog.popPrompt();
        if (promptDialog != null) {
            var answer = promptDialog.getAnswer();
            if (text != promptDialog.getText()) {
                com.spikesource.tg4w.recorder.error("expected prompt dialog: <"
                    + promptDialog.getText() + "> but was <" + text + ">");
                com.spikesource.tg4w.recorder.playing = false;
                return false;
            } else {
                // reset
                com.spikesource.tg4w.recorder.log("prompt '" + text + "' dialog simulated with : " + answer);
                setTimeout("window.openDialog('chrome://recorder/content/myalert.xul', 'myAlert', 'modal,centerscreen,chrome', {delay:1000, text:\"" + text + "\", alertType:\"" + com.spikesource.tg4w.tg4wcommon.localizeString('Confirm')+ "\"} )", 10);
                if (answer.split(",")[0] == "false") {
                    return null;
                } else {
                    return answer.substring(5);
                }
            }
        } else {
            com.spikesource.tg4w.recorder.error("did not expect prompt here");
            com.spikesource.tg4w.recorder.playing = false;
            return false;
        }
    }
}

com.spikesource.tg4w.Recorder.prototype.onConfirm = function(text) {
    if (com.spikesource.tg4w.recorder.isRecording()) {
        var answer = com.spikesource.tg4w.tg4wcommon.TG4W_promptService.confirm(window, "Javascript Confirm - Recording", text);
        com.spikesource.tg4w.recorder.log("confirmation requested: " + text
            + " answer was : " + answer
            + " action number : " + com.spikesource.tg4w.recorder.actions.length);

        com.spikesource.tg4w.recorder.record("confirm", text, answer, false);
        return answer;
    } else if (com.spikesource.tg4w.recorder.isPlaying()) {
        var confirmDialog = com.spikesource.tg4w.recorder.expectDialog.popConfirm();
        if (confirmDialog != null) {
            var answer = confirmDialog.getAnswer();
            if (text != confirmDialog.getText()) {
                com.spikesource.tg4w.recorder.error("expected confirmation dialog: <"
                    + confirmDialog.getText() + "> but was <" + text + ">");
                com.spikesource.tg4w.recorder.playing = false;

                return false;
            } else {
                // reset
                com.spikesource.tg4w.recorder.log("confirm '" + text + "' dialog simulated with : " + answer);
                setTimeout("window.openDialog('chrome://recorder/content/myalert.xul', 'myAlert', 'modal,centerscreen,chrome', {delay:1000, text:\"" + text + "\", alertType:\"" + com.spikesource.tg4w.tg4wcommon.localizeString('Confirm')+ "\"} )", 10);
                if (answer == "false") {
                    return false;
                } else {
                    return true;
                }
            }
        } else {
            com.spikesource.tg4w.recorder.error("did not expect confirm dialog here");
            com.spikesource.tg4w.recorder.playing = false;

            return false;
        }
    }
}

com.spikesource.tg4w.Recorder.prototype.getActions = function() {
    return this.actions;
}

com.spikesource.tg4w.Recorder.prototype.isRecording = function() {
    return this.recording;
}

com.spikesource.tg4w.Recorder.prototype.isPlaying = function() {
    return this.playing;
}

com.spikesource.tg4w.Recorder.prototype.isRecordingPaused = function() {
    return (this.paused == com.spikesource.tg4w.tg4wcommon.TG4W_RECORDING_PAUSED);
}

com.spikesource.tg4w.Recorder.prototype.isPlayingPaused = function() {
    return (this.paused == com.spikesource.tg4w.tg4wcommon.TG4W_PLAYING_PAUSED);
}

com.spikesource.tg4w.Recorder.prototype.resetMenu = function() {
    if (this.recording || this.playing) {
        this.setMenuDisabled(true, false, false, true, true, true);
    } else if (this.isRecordingPaused()) {
        this.setMenuDisabled(true, true, false, true, false, true);
    } else if (this.isPlayingPaused()) {
        this.setMenuDisabled(true, true, false, true, true, true);
    } else {
        // normal
        this.setMenuDisabled(false, true, true, false, false, false);
    }

    if (com.spikesource.tg4w.tg4woptions.showProgressBar()) {
        if (this.playing || this.isPlayingPaused()) {
            this.setProgressbarDisplay("inline");
        } else {
            this.setProgressbarDisplay("none");
        }
    } else {
        this.setProgressbarDisplay("none");
    }

    var addRemoveLabels = function(doc, id, mode) {
        var bar = doc.getElementById(id);
        if (bar) {
            var childNodes = bar.getElementsByTagName("toolbarbutton");
            for (var i = 0; i < childNodes.length; i++) {
                if (mode == "full") {
                    if (childNodes[i].label == "") { childNodes[i].label = childNodes[i].oldLabel; }
                } else if (mode == "icons") {
                    childNodes[i].oldLabel = childNodes[i].label;
                    childNodes[i].label = "";
                }
            }
        }
    }

    if (com.spikesource.tg4w.tg4woptions.showTextWithButtons()) {
        this.getLayoutDocument().getElementById("recordtoolbar").setAttribute("mode", "full");
        addRemoveLabels(this.getLayoutDocument(), "recordtoolbar", "full");
        addRemoveLabels(this.getLayoutDocument(), "edittoolbar", "full");
    } else {
        this.getLayoutDocument().getElementById("recordtoolbar").setAttribute("mode", "icons");
        addRemoveLabels(this.getLayoutDocument(), "recordtoolbar", "icons");
        addRemoveLabels(this.getLayoutDocument(), "edittoolbar", "icons");
    }

    /*
    if (com.spikesource.tg4w.tg4woptions.showOldEditor()) {
        if (document.getElementById("review-steps").hasAttribute("hidden")) {
            this.getLayoutDocument().getElementById("review-steps").removeAttribute("hidden");
        }
    } else {
        this.getLayoutDocument().getElementById("review-steps").setAttribute("hidden", true);
    }
    */
}

com.spikesource.tg4w.Recorder.prototype.setProgressbarDisplay = function(val) {
    this.getLayoutDocument().getElementById("play-progress").style.display = val;
    this.getLayoutDocument().getElementById("play-progress-text").style.display = val;
}

com.spikesource.tg4w.Recorder.prototype.setMenuDisabled = function(record, stop, pause, play, save, load) {
    if (this.getActions().length == 0 && this.batch.length == 0) {
        play = true;
        save = true;
    }

    var statusBarIconElem = this.getLayoutDocument().getElementById("tg4w-statusbar-icon");
    // no blinking when both record and play are enabled
    if (!record && !play || !record && play) {
        statusBarIconElem.image = "chrome://recorder/skin/record-spike.png";
    } else {
        statusBarIconElem.image = "chrome://recorder/skin/record-spike-active.gif";
    }

    this.setDisabled("start-record-menu",   record, "record");
    this.setDisabled("stop-record-menu",    stop,   "stop");
    this.setDisabled("pause-menu",          pause,  "pause");
    this.setDisabled("play-menu",           play,   "play");
    this.setDisabled("save-script-menu",    save,   "save");
    this.setDisabled("load-script-menu",    load,   "open");

    if (!pause) {
        if (this.paused == com.spikesource.tg4w.tg4wcommon.TG4W_NOT_PAUSED) {
            this.getLayoutDocument().getElementById("pause-menu").image = "chrome://recorder/skin/pause.png";
        } else {
            this.getLayoutDocument().getElementById("pause-menu").image = "chrome://recorder/skin/resume.png";
        }
    }
}

com.spikesource.tg4w.Recorder.prototype.setDisabled = function(id, val, imgname) {
    var elem = this.getLayoutDocument().getElementById(id);
    elem.disabled = val;

    if (val) {
        elem.image = "chrome://recorder/skin/" + imgname + "-disabled.png";
    } else {
        elem.image = "chrome://recorder/skin/" + imgname + ".png";
    }
}

com.spikesource.tg4w.Recorder.prototype.findTextOnPage = function(actionFrameWindow, text, xpath) {
    if (xpath == "*") {
        searcher = gBrowser.webBrowserFind.QueryInterface(Components.interfaces.nsIWebBrowserFindInFrames);
        searcher.wrapFind = true;
        searcher.rootSearchFrame = window.content;
        searcher.searchString = text;
        return searcher.findNext();
    } else {
        var element = this.getElement(actionFrameWindow.document, xpath);
        if (this.assertElement(element, xpath)) {
            var i_text = element.innerHTML;
            this.log("text found under: " + xpath + " = " + i_text);
            var myregex = new RegExp(text, "g");
            var match = i_text.search(myregex);
            this.log("text :" + text + " matched at location:" + match);
            return match != -1;
        }
        return false;
    }
}

com.spikesource.tg4w.Recorder.prototype.connect = function() {
    if (this.simulBrowse) {
        var sessionId = prompt("Enter session id to connect to existing session,\nIf you want to create a new one, just press [OK]");
        if (sessionId) {
            this.simulBrowse.connect(sessionId);
        } else {
            this.simulBrowse.newSession(sessionId);
        }
    }
}

com.spikesource.tg4w.Recorder.prototype.start = function() {
    this.loadedFileVersion = this.getMyVersion();
    if (this.getActions().length > 0) {
        var dialog = new com.spikesource.tg4w.Dialog();
        dialog.answer = 'cancel';
        window.openDialog('chrome://recorder/content/recordconfirmation.xul', 'recordConfirmation',
                'modal,centerscreen,chrome', {dialog:dialog} );

        if (dialog.answer == "accept") {
            // fall through, recording will start.
        } else if (dialog.answer == "reset") {
            this.reset_all();
            setTimeout("com.spikesource.tg4w.recorder.start()", 100);
            return;
        } else {
            // don't do anything
            return;
        }
    } else {
        /* location.href instead of location */
        if (this.getWorkingDocument().location.href == "about:blank") {
            this.error(com.spikesource.tg4w.tg4wcommon.localizeString("ErrorNeedStartPageToStartRecord"));
            return;
        }

        this.reset_all();

        /* empty frame sequence because it is the starting navigation page */
        //this.record("goto", "window.location", window.content.document.location, true);
        this.record("goto", "window.location.href", this.getWorkingDocument().location.href, ".", []);
        if (com.spikesource.tg4w.tg4woptions.doVerifyPageTitle()) {
            this.verifyPageTitle(".");
        }
    }

    this.setStatus("Recording");
    this.recording = true;
    this.contextMenuVisible(true);
    this.injectWindowDialogReplacer();

    this.addNewWindowObserver();
    this.resetMenu();
}

com.spikesource.tg4w.Recorder.prototype.removeNewWindowObserver = function() {
    var obj = Components.classes["@mozilla.org/observer-service;1"].
        getService(Components.interfaces.nsIObserverService);
    try {
        obj.removeObserver(this.windowObserver, "domwindowopened");
    } catch (e) {
        com.spikesource.tg4w.recorder.debug(e);
    }
}

com.spikesource.tg4w.Recorder.prototype.addNewWindowObserver = function() {
    var obj = Components.classes["@mozilla.org/observer-service;1"].
        getService(Components.interfaces.nsIObserverService);

    this.windowObserver.resetData();
    obj.addObserver(this.windowObserver, "domwindowopened", false);
}

com.spikesource.tg4w.Recorder.prototype.pause = function() {
    if (this.paused == com.spikesource.tg4w.tg4wcommon.TG4W_NOT_PAUSED) {
        if (this.recording) {
            this.paused = com.spikesource.tg4w.tg4wcommon.TG4W_RECORDING_PAUSED;
            this.setStatus("Recording Paused");
            this.debug("Recording Paused");
            this.recording = false;
        } else if (this.playing) {
            this.paused = com.spikesource.tg4w.tg4wcommon.TG4W_PLAYING_PAUSED;
            this.setStatus("Play scheduled to pause");
            this.debug("Play scheduled to pause");
            this.playing = false;
        } else {
            this.error("What is the current state? Pause failed");
        }
    } else {
        if (this.paused == com.spikesource.tg4w.tg4wcommon.TG4W_RECORDING_PAUSED) {
            this.debug("restart recording");
            this.setStatus("Recording");
            this.recording = true;
        } else if (this.paused == com.spikesource.tg4w.tg4wcommon.TG4W_PLAYING_PAUSED) {
            this.debug("restart play");
            this.setStatus("Playing");
            this.playing = true;
            setTimeout("com.spikesource.tg4w.recorder.step()", this.getSkippedDelay());
        } else {
            this.error("invalid value for paused: " + this.paused);
        }
        this.paused = com.spikesource.tg4w.tg4wcommon.TG4W_NOT_PAUSED;
    }

    this.removeNewWindowObserver();
}

com.spikesource.tg4w.Recorder.prototype.stop = function(msg) {
    if (this.recording) {
        this.setStatus("Stopped Recording");
        this.recording = false;
    } else if (this.playing) {
        this.setStatus("Play stop scheduled");
        this.playing = false;
    }

    this.playStopMsg = msg;

    this.contextMenuVisible(false);
    this.removeNewWindowObserver();
}

com.spikesource.tg4w.Recorder.prototype.getLayoutDocument = function() {
    if (this.editorDetached && this.editorDetached.closed) {
        this.editorDetached = null;
    }

    if (this.editorDetached) {
        return this.editorDetached.document;
    } else {
        return document;
    }
}

com.spikesource.tg4w.Recorder.prototype.contextMenuVisible = function(visibility) {
    var contextMenu = document.getElementById("record-context-menu");
    if (visibility) {
        contextMenu.style.display="inline";
    } else {
        contextMenu.style.display="none";
    }
}

com.spikesource.tg4w.Recorder.prototype.load = function() {
    const nsIFilePicker = Components.interfaces.nsIFilePicker;

    var fp = Components.classes["@mozilla.org/filepicker;1"]
        .createInstance(nsIFilePicker);
    fp.init(window, "Select file to load", nsIFilePicker.modeOpen);
    fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);

    var rv = fp.show();
    if (rv == nsIFilePicker.returnOK) {
        this.reset_all();
        var file = fp.file;

        // parse file
        this.parseFile(file);
    } else {
        this.setStatus("Load cancelled.");
    }
}

com.spikesource.tg4w.Recorder.prototype.parseFile = function(file) {
    // open an input stream from file
    var istream = Components.classes["@mozilla.org/network/file-input-stream;1"]
        .createInstance(Components.interfaces.nsIFileInputStream);
    istream.init(file, 0x01, 0444, 0);
    istream.QueryInterface(Components.interfaces.nsILineInputStream);

    var domParser = new DOMParser();
    var doc = null;
    try {
        doc = domParser.parseFromStream(istream, null, file.fileSize, "text/xml");
    } catch (e) {
        this.debug("parse error:" + e + " may not be xml. could be batch");
    }

    this.loadedFileName = file.path;

    var loadedBatchFile = false;

    if (doc == null || (doc.documentElement.localName != "tg4w" && doc.documentElement.localName != "actions")) {
        if (this.batch.length > 0) {
            handleError("batch files cannot point to another batch file.");
            return;
        }
        var lines = com.spikesource.tg4w.tg4wcommon.getContents(file.path).split("\n")
        var lineCount;
        var batchCount = 0;
        for (lineCount = 0; lineCount < lines.length; lineCount ++) {
            var line = lines[lineCount];
            if (!com.spikesource.tg4w.tg4wcommon.isBlank(line)) {
                var fileExists = com.spikesource.tg4w.tg4wcommon.fileExists(line);
                if (!fileExists) {
                    line = com.spikesource.tg4w.tg4wcommon.getRelativeFilePath(file.path, line);
                    fileExists = com.spikesource.tg4w.tg4wcommon.fileExists(line)
                }
                if (fileExists) {
                    this.debug("batch load: " + line);
                    this.batch[batchCount ++] = com.spikesource.tg4w.tg4wcommon.trimStr(line);
                } else {
                    this.debug("file not found?: " + line);
                }
            } else {
            }
        }
        loadedBatchFile = true;
    } else if (doc.documentElement.localName == "tg4w") {
        var tg4w = doc.documentElement;
        var version = tg4w.getAttribute("version");
        this.loadedFileVersion = version;
        // there should only be one 'actions' element, if there are multiple, i don't care
        var actions = doc.getElementsByTagName("actions")[0];
        var datasets = doc.getElementsByTagName("dataset");
        if (version >= "0.37.0") {
            this.loadActions(actions);
            this.loadDatasets(datasets);
        } else {
            // Old format.
            this.loadActions_v0360(actions);
        }
    } else if (doc.documentElement.localName == "actions") {
        // this is just for backward compatibility, will be removed after 0.40
        this.showDeprecationError("document format changed");
        this.loadActions_v0360(doc.documentElement);
    }
    // close stream
    istream.close();

    if (loadedBatchFile) {
        this.setStatus("Loaded batch file with " + this.batch.length + " xml script" + (this.batch.length > 1 ? "s." : "."));
    } else {
        this.setStatus("Loaded xml script");
        // EDITOR: new
        this.editorCallback(this, "load");
    }
}

com.spikesource.tg4w.Recorder.prototype.loadActions = function(actions) {
    var j;
    this.log("Loading actions");
    for (j = 0; j < actions.childNodes.length; j++) {
        var actionElem = actions.childNodes.item(j);
        if (actionElem.localName == "action") {
            var actionObj = new com.spikesource.tg4w.Action(actionElem);
            if (actionObj.action != "")  {
                this.actions.push(actionObj);
            }
        }
    }
}

com.spikesource.tg4w.Recorder.prototype.deleteDataset = function(name) {
    this.tg4wdh.deleteDataset(name);
}

com.spikesource.tg4w.Recorder.prototype.testDataset = function() {
    this.tg4wdh.loadDataset("test0", "term,pagetitle", "/tmp/google-loop-dataset.csv", "csv", "true");
    for (var i = 0; i < 3; i ++) {
        var term = this.tg4wdh.getDataFromDataset("test0", "term");
        this.tg4wdh.incrementLoopCount("test0");
    }
}

com.spikesource.tg4w.Recorder.prototype.getDataset = function(name) {
    return this.tg4wdh.getDataset(name);
}

com.spikesource.tg4w.Recorder.prototype.getDatasetNames = function() {
    return this.tg4wdh.getDatasetNames();
}

com.spikesource.tg4w.Recorder.prototype.getVariableNames = function() {
    var varnames = com.spikesource.tg4w.tg4wcommon.createTg4wArray();
    for (var i = 0; i < this.getActions().length; i ++) {
        var varmatch = this.getActions()[i].isVariableAction();
        if (varmatch) {
            var varname = varmatch[1];
            if (!varnames.contains_tg4w(varname)) {
                varnames.push(varname);
            }
        }
    }
    return varnames;

}

com.spikesource.tg4w.Recorder.prototype.addVariable = function(name, type, js) {
    this.runtimevars[name] = new com.spikesource.tg4w.RuntimeVariable(name, type, js);
}

com.spikesource.tg4w.Recorder.prototype.getVariableVal = function(varname, fire_callback) {
    if (!fire_callback) fire_callback = true;
    if (this.runtimevars[varname]) {
        if (fire_callback) {
            this.showStatusCallback(this, "var-fetch", varname, this.runtimevars[varname].value);
        }
        return this.runtimevars[varname].value;
    } else {
        var dsnames = this.tg4wdh.getDatasetNames();
        for (var dsc = 0; dsc < dsnames.length; dsc++) {
            var ds = this.tg4wdh.getDataset(dsnames[dsc]);
            if (ds.containsVar(varname)) {
                var value = this.tg4wdh.getDataFromDataset(dsnames[dsc], varname);
                if (fire_callback) {
                    this.showStatusCallback(this, "ds-fetch", varname, value);
                }
                return value;
            }
        }
    }
}

com.spikesource.tg4w.RuntimeVariable = function(name, type, js) {
    this.name = name;
    this.type = type;
    this.js = js;
    this.value = eval(com.spikesource.tg4w.recorder.getEvalPrefixJS() + this.js);
}

com.spikesource.tg4w.RuntimeVariable.prototype.getAssignmentString = function() {
    return this.tg4w_getAssignmentString(this.type, this.value);
}

com.spikesource.tg4w.RuntimeVariable.prototype.tg4w_getAssignmentString = function(type, value) {
    if (type == "bool") {
        return (new Boolean(value)).valueOf();
    } else if (type == "num") {
        return value;
    } else {
        return "\"" + value + "\"";
    }
}

com.spikesource.tg4w.Recorder.prototype.newDataset = function(id, xpath, file, type, iterable) {
    this.tg4wdh.loadDataset(id, xpath, file, type, iterable);
}

com.spikesource.tg4w.Recorder.prototype.loadDatasets = function(datasetArr) {
    if (datasetArr) {
        for (var i = 0; i < datasetArr.length; i ++) {
            var did = datasetArr[i].getAttribute("id");
            var dfile = datasetArr[i].getAttribute("file");
            var dxpath = datasetArr[i].getAttribute("xpath");
            var dtype = datasetArr[i].getAttribute("type");
            var iterable = "true";
            if (datasetArr[i].hasAttribute("iterable")) {
                iterable = datasetArr[i].getAttribute("iterable");
            }
            this.tg4wdh.loadDataset(did, dxpath, dfile, dtype, iterable);
            this.showStatusCallback(this, "ds-update", did);
        }
    }
}

com.spikesource.tg4w.Recorder.prototype.loadActions_v0360 = function(actions) {
    var j;
    this.log("Loading actions v0.36 and before");
    for (j = 0; j < actions.childNodes.length; j++) {
        if (actions.childNodes.item(j).localName == "action") {
            var actionname = com.spikesource.tg4w.tg4wcommon.getChildValue_(actions.childNodes.item(j), "type");
            var xpath = com.spikesource.tg4w.tg4wcommon.getChildValue_(actions.childNodes.item(j), "xpath");
            var value = com.spikesource.tg4w.tg4wcommon.getChildValue_(actions.childNodes.item(j), "value");
            var pagerefresh = com.spikesource.tg4w.tg4wcommon.getChildValue_(actions.childNodes.item(j), "page-refreshed");

            var framesequence;  // will populate it after parsing frame-sequence node

            /* get frame-sequence node value as string */
            var framesequenceString = com.spikesource.tg4w.tg4wcommon.getChildValue_(actions.childNodes.item(j),"frame-sequence");
            // trim string
            framesequenceString = framesequenceString.replace(/^\s+/g, '').replace(/\s+$/g, '');
            this.log("framesequence extracted as string: " + framesequenceString + "-> (has length: " + framesequenceString.length + ")");

            /* get Array of frames to travel down from the framesequence String */
            if(framesequenceString.length==0 || framesequenceString=='undefined'){
                framesequence = com.spikesource.tg4w.tg4wcommon.createTg4wArray();
            } else {
                framesequence = framesequenceString.split(",");
            }

            this.log("framesequence converted to array: " + framesequence + "-> (#"+ framesequence.length + " frames to travel down)");

            this.record(actionname, xpath, value, pagerefresh,framesequence);
        }
    }
}

com.spikesource.tg4w.Recorder.prototype.reloadFile = function() {
    if (this.loadedFileName != null) {
        alert("Are you sure you want to reload the file?");
        this.loadfile(this.loadedFileName, true);
    } else {
        alert("No file loaded!");
    }
}

com.spikesource.tg4w.Recorder.prototype.saveFile = function() {
    if (this.loadedFileName != null) {
        answer = confirm("Overwrite existing file?\n" + this.loadedFileName);
        if (answer) {
            var file2load = Components.classes["@mozilla.org/file/local;1"]
                .createInstance(Components.interfaces.nsILocalFile);
            file2load.initWithPath(this.loadedFileName);

            this.writeRecording2File(file2load);
            this.setStatus("Saved: " + this.loadedFileName);
        } else {
            this.write2file();
        }
    } else {
        this.write2file();
    }
}

com.spikesource.tg4w.Recorder.prototype.write2file = function() {
    this.setStatus("Writing to file");
    const nsIFilePicker = Components.interfaces.nsIFilePicker;

    var fp = Components.classes["@mozilla.org/filepicker;1"]
        .createInstance(nsIFilePicker);
    fp.init(window, "Save recording as..", nsIFilePicker.modeSave);
    fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterXML);

    var rv = fp.show();
    if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
        var file = fp.file;

        this.writeRecording2File(file);

        this.setStatus("Saved");

        if (com.spikesource.tg4w.tg4woptions.alwaysAdd2Favorites() || com.spikesource.tg4w.tg4woptions.askAdd2Favorites()) {
            var answer = com.spikesource.tg4w.tg4woptions.alwaysAdd2Favorites();
            if (! answer) {
                answer = confirm("Add to favorites ?");
            }
            if (answer) {
                this.add2favorites(fp.fileURL.path);
            }
        }
        return;
    } else {
        this.setStatus("Save cancelled");
    }
}

com.spikesource.tg4w.Recorder.prototype.writeRecording2File = function (file) {
    // file is nsIFile, data is a string
    var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
        .createInstance(Components.interfaces.nsIFileOutputStream);

    // use 0x02 | 0x10 to open file for appending.
    foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0); // write, create, truncate

    var doc = this.getXmlDoc(this.actions);
    var serializer = new XMLSerializer();
    this.log("getXmlDoc :" + serializer.serializeToString(doc));
    // Be careful the encoding must match the encoding of the document XML Declaration !
    serializer.serializeToStream(doc, foStream, "UTF-8"); 

    //var data = this.convert2xml(this.actions);
    //foStream.write(data, data.length);

    foStream.close();
}

/*
* Deprecated : use getXmlDoc
* Bruno V. 21/11/2005
*/
com.spikesource.tg4w.Recorder.prototype.convert2xml = function(actions) {
    var data = '<?xml version="1.0" encoding="ascii"?>' + com.spikesource.tg4w.tg4wcommon.TG4W_LINE_BREAK;
    data = data + "<!-- Generated file. Please do not edit. " + (new Date()).toString() + " -->" + com.spikesource.tg4w.tg4wcommon.TG4W_LINE_BREAK;
    data = data + "<tg4w version='" + this.getMyVersion() + "'>" + com.spikesource.tg4w.tg4wcommon.TG4W_LINE_BREAK;
    data = data + "    <actions>" + com.spikesource.tg4w.tg4wcommon.TG4W_LINE_BREAK;
    for (al = 0; al < actions.length; al ++) {
        data = data + "    <!-- Step " + al + "-->" + com.spikesource.tg4w.tg4wcommon.TG4W_LINE_BREAK;
        data = data + actions[al].xmlvalue() + com.spikesource.tg4w.tg4wcommon.TG4W_LINE_BREAK;
    }
    data = data + "    </actions>" + com.spikesource.tg4w.tg4wcommon.TG4W_LINE_BREAK;
    data = data + "</tg4w>" + com.spikesource.tg4w.tg4wcommon.TG4W_LINE_BREAK;
    return data;
}

com.spikesource.tg4w.Recorder.prototype.getEvalPrefixAvailableVariables = function() {
    var varnames = com.spikesource.tg4w.tg4wcommon.createTg4wArray();
    varnames.push("document");
    for (var ac = 0; ac < this.actions.length; ac ++) {
        var varmatch = this.actions[ac].isVariableAction();
        if (varmatch) {
            var temp = varmatch[1] + " (" + varmatch[2] + ")";
            if (!varnames.contains_tg4w(temp)) {
                varnames.push(temp);
            }
        }
    }
}

com.spikesource.tg4w.Recorder.prototype.getEvalPrefixJS = function(whereisdocument) {
    var str = null;
    if (!whereisdocument) {
        str = "var document = window.content.document;";
    } else {
        str = "var document = " + whereisdocument + ";";
    }

    str += "var recorder = com.spikesource.tg4w.recorder;";

    for (varname in this.runtimevars) {
        str += " var " + varname + " = " + this.runtimevars[varname].getAssignmentString() + ";";
    }

    return str;
}

/*
* Get the Recorder/actions as an XML Document
* Bruno V. 21/11/2005
*/
com.spikesource.tg4w.Recorder.prototype.getXmlDoc = function(actions) {

    var doc = document.implementation.createDocument("", "", null);

    var indent = "    ";
    var rootElem = doc.createElement("tg4w");
    rootElem.setAttribute("version", this.getMyVersion());
    /**/rootElem.appendChild(doc.createTextNode("\n"+indent));

    var datasetsElem = doc.createElement("datasets");
    var dsnames = this.tg4wdh.getDatasetNames();
    for (var dsi = 0; dsi < dsnames.length; dsi++) {
        var datasetElem = this.tg4wdh.getDataset(dsnames[dsi]).getXml(doc, "\n"+indent+indent);
        /**/datasetsElem.appendChild(doc.createTextNode("\n"+indent+indent));
        datasetsElem.appendChild(datasetElem);
    }
    /**/datasetsElem.appendChild(doc.createTextNode("\n"+indent));
    rootElem.appendChild(datasetsElem);
    /**/rootElem.appendChild(doc.createTextNode("\n"+indent))

    var actionsElem = doc.createElement("actions");
    /**/actionsElem.appendChild(doc.createTextNode("\n"+indent+indent));

    for (al = 0; al < actions.length; al ++) {
        var actionElem = actions[al].getXml(doc, indent+indent);
        actionElem.setAttribute("step", al);
        actionsElem.appendChild(actionElem);
        /**/if (al != actions.length-1)
            /**/actionsElem.appendChild(doc.createTextNode("\n"+indent+indent));
    }
    /**/actionsElem.appendChild(doc.createTextNode("\n"+indent));

    rootElem.appendChild(actionsElem);
    /**/rootElem.appendChild(doc.createTextNode("\n"));

    doc.appendChild(rootElem);

    // Fake XML Declaration !
    var piElem = doc.createProcessingInstruction("xml", "version='1.0' encoding='UTF-8'");
    doc.insertBefore(piElem, rootElem);
    return doc; 
}


com.spikesource.tg4w.Recorder.prototype.add2favorites = function(filename) {
    com.spikesource.tg4w.tg4woptions.addFavorite(filename);
    this.refreshFavorites();
}

com.spikesource.tg4w.Recorder.prototype.loadfile = function(filename, scriptrun) {
    var file2load = com.spikesource.tg4w.tg4wcommon.getFileObject(filename);
    if (file2load.exists()) {
        this.reset_all();
        this.parseFile(file2load);
        this.resetMenu()

        if (com.spikesource.tg4w.tg4woptions.autoPlayOnFavoriteLoad()) {
            answer = true;
            if (com.spikesource.tg4w.tg4woptions.askBeforeAutoPlayFavorite() && !scriptrun) {
                answer = confirm("Do you want to play selected favorite?");
            }

            if (answer) {
                // reset loop count
                this.loopCount = 0;
                if (this.batch.length > 0) {
                    setTimeout("com.spikesource.tg4w.recorder.runBatch()", 500);
                } else {
                    setTimeout("com.spikesource.tg4w.recorder.replay()", 500);
                }
            }
        }
    } else {
        this.error("Favorite file is invalid.\n Use the Cleanup menu to get rid of invalid files.");
    }
}

com.spikesource.tg4w.Recorder.prototype.showTestsFolder = function() {
    var testsDir = com.spikesource.tg4w.tg4wcommon.getRecorderDir("tests");
    testsDir.reveal();
}

com.spikesource.tg4w.Recorder.prototype.refreshTests = function() {
    var selftests = this.getLayoutDocument().getElementById("tg4w-selftests-menu");

    var sibling = this.getLayoutDocument().getElementById("tg4w-selftests-menu-separator").nextSibling;
    while (sibling) {
        nsibling = sibling.nextSibling;
        selftests.removeChild(sibling);
        sibling = nsibling;
    }
    var testfiles = com.spikesource.tg4w.tg4wcommon.getTestFiles();
    for (var i = 0; i < testfiles.length; i ++) {
        var testfile = testfiles[i];
        if (!com.spikesource.tg4w.tg4wcommon.isBlank(testfile)) {
            var tempItem = this.getLayoutDocument().createElement("menuitem");
            tempItem.setAttribute("class", "menuitem-iconic");
            tempItem.setAttribute("image", "chrome://recorder/skin/test.png");
            tempItem.setAttribute("id", testfile);
            tempItem.setAttribute("label", com.spikesource.tg4w.tg4wcommon.basename(testfile));
            tempItem.setAttribute("tooltiptext", testfile);
            tempItem.setAttribute("oncommand", "com.spikesource.tg4w.recorder.loadfile('" + testfile + "')");

            selftests.appendChild(tempItem);
        }
    }
}


com.spikesource.tg4w.Recorder.prototype.refreshFavorites = function() {
    var favorites = this.getLayoutDocument().getElementById("favorites-list");

    var sibling = this.getLayoutDocument().getElementById("favorites-menu-separator").nextSibling;
    while (sibling) {
        nsibling = sibling.nextSibling;
        favorites.removeChild(sibling);
        sibling = nsibling;
    }
    var favfiles = com.spikesource.tg4w.tg4woptions.getFavorites().split(",");
    for (var i = 0; i < favfiles.length; i ++) {
        var favfile = favfiles[i];
        if (!com.spikesource.tg4w.tg4wcommon.isBlank(favfile)) {
            var tempItem = this.getLayoutDocument().createElement("menuitem");
            tempItem.setAttribute("class", "menuitem-iconic");
            tempItem.setAttribute("image", "chrome://recorder/skin/shortcut.gif");
            tempItem.setAttribute("id", favfile);
            tempItem.setAttribute("label", com.spikesource.tg4w.tg4wcommon.basename(favfile));
            tempItem.setAttribute("tooltiptext", favfile);
            tempItem.setAttribute("oncommand", "com.spikesource.tg4w.recorder.loadfile('" + favfile + "')");

            favorites.appendChild(tempItem);
        }
    }
}

com.spikesource.tg4w.Recorder.prototype.cleanupFavorites = function() {
    var favfiles = com.spikesource.tg4w.tg4woptions.getFavorites().split(",");
    com.spikesource.tg4w.tg4woptions.clearFavorites();
    for (var i = 0; i < favfiles.length; i ++) {
        var favfile = favfiles[i];
        if (!com.spikesource.tg4w.tg4wcommon.isBlank(favfile) && com.spikesource.tg4w.tg4wcommon.fileExists(favfile)) {
            com.spikesource.tg4w.tg4woptions.addFavorite(favfile);
        }
    }

    this.refreshFavorites();
}

com.spikesource.tg4w.Recorder.prototype.setStatus = function(str) {
    var statusPrefix = "";

    if (this.playing) {
        if (this.playLoop) {
            statusPrefix += "Loop:" + (this.loopCount + 1) + "/" + (this.playLoopTimes == -1 ? "forever" : this.playLoopTimes) + ", ";
        }
        
        if (this.batch.length > 0) {
            statusPrefix += "Batch " + (this.batchstep + 1) + "/" + this.batch.length + ", ";
        }
    }

    this.getLayoutDocument().getElementById("status-label").value = statusPrefix + str;
    this.log("status:" + statusPrefix + str);
    this.showStatusCallback(this, "status-update", statusPrefix + str);
}

com.spikesource.tg4w.Recorder.prototype.getCurrentAction = function() {
    return this.actions[this.replaystep];
}

com.spikesource.tg4w.Recorder.prototype.updateProgress = function() {
    if (this.playLoop && this.playLoopTimes == -1) {
        this.getLayoutDocument().getElementById("play-progress").mode = "undetermined";
    } else {
        var progress = "0";
        if (this.batch.length > 0) {
            progress = (this.batchstep + this.replaystep / this.actions.length)/ this.batch.length * 100;
        } else {
            progress = ((this.replaystep)/this.actions.length) * 100;
        }
        if (this.playLoop) {
            progress = (this.loopCount/this.playLoopTimes) * 100 + progress / this.playLoopTimes;
        }

        this.getLayoutDocument().getElementById("play-progress").value = progress;
        this.getLayoutDocument().getElementById("play-progress-text").value = progress + "%";
    }
}

com.spikesource.tg4w.Recorder.prototype.updateAjaxCount = function(count) {
    if (!count) { count = 1; }
    var i = this.actions.length;
    while (i != -1 && this.actions[i].isAssertAction()) { i --; }
    if (i != -1) {
        this.actions[i].addAjaxCount(count);
    } else {
        com.spikesource.tg4w.recorder.debug("could not find a non-assert action");
    }
}

com.spikesource.tg4w.Recorder.prototype.pageLoaded = function(winref) {
    this.pagesready.push(winref);
    if (this.recording == true) {
        var i = this.actions.length - 1;
        while (i != -1 && this.actions[i].isAssertAction()) {
            i --;
        }
        if (i != -1) {
            this.actions[i].addPageRefreshed(winref);
        } else {
            this.debug("Skipped page refresh: cannot find any non-assert page before: " + this.actions.length);
        }
    }

    // add title verification if it is on
    if (this.recording && com.spikesource.tg4w.tg4woptions.doVerifyPageTitle()) {
        this.verifyPageTitle(winref);
    }

    if (this.isRecording() || this.isPlaying()) {
        this.log("pageready:" + winref);
        this.injectWindowDialogReplacer();
    }
}

/*
 Inject the window alert, confirm, prompt replace services
 TODO: Optimize
 */
com.spikesource.tg4w.Recorder.prototype.injectWindowDialogReplacer = function () {
    if (this.isRecording() || this.isPlaying()) {
        var sl = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
            .createInstance(Components.interfaces.mozIJSSubScriptLoader);

        var ios = Components.classes["@mozilla.org/network/io-service;1"]
            .getService(Components.interfaces.nsIIOService);

        var replaceFile = com.spikesource.tg4w.tg4wcommon.getContentFile("replacealert.js");
        var fileURI = ios.newFileURI(replaceFile);

        //sl.loadSubScript(fileURI.spec, window);
        var windowx = gBrowser.mCurrentBrowser.contentWindow.wrappedJSObject; 
        windowx.origAlert = windowx.alert;
        windowx.alert = com.spikesource.tg4w.recorder.onAlert;
        windowx.confirm = com.spikesource.tg4w.recorder.onConfirm;
        windowx.prompt = com.spikesource.tg4w.recorder.onPrompt;
    }
}

com.spikesource.tg4w.Recorder.prototype.waitforpages = function(count, winrefs) {
    this.debug("wait for pages called with: " + winrefs);

    if ((count * this.getRescheduleDelay()) > com.spikesource.tg4w.tg4woptions.getMaxTimeAllowedForPageLoad()) {
        var message = "Quit after waiting for "
            + (com.spikesource.tg4w.tg4woptions.getMaxTimeAllowedForPageLoad() / 1000)
            + " seconds for page to reload.";
        this.setStatus(message);
        this.log(message);
        return;
    }

    var hits = this.pagesready.intersect_tg4w(com.spikesource.tg4w.tg4wcommon.createTg4wArray(winrefs.split(",")));
    this.debug("number of hits from: " + this.pagesready.join(",") + " are " + hits.join(","));

    if (hits.length > 0) {
        // new winrefs
        winrefs = com.spikesource.tg4w.tg4wcommon.createTg4wArray(winrefs.split(",")).removeItems_tg4w(this.pagesready);
        if (!winrefs) {
            winrefs = "";
        }
        // reset the pageready
        this.pagesready.length = 0;
    }

    if (winrefs == "") {
        this.log("pageready: schedule step(), " + this.getPageReadyDelay());
        setTimeout("com.spikesource.tg4w.recorder.step()", this.getPageReadyDelay());
    } else {
        this.log("reschedule wait, " + this.getRescheduleDelay() + ", waiting for pages:" + winrefs);
        setTimeout("com.spikesource.tg4w.recorder.waitforpages(" + (count + 1) + ", '" + winrefs + "')", this.getRescheduleDelay());
    }
}

com.spikesource.tg4w.Recorder.prototype.getSkippedDelay = function() {
    return 100;
}

com.spikesource.tg4w.Recorder.prototype.getPageReadyDelay = function() {
    return com.spikesource.tg4w.tg4woptions.getPlayDelay();
}

com.spikesource.tg4w.Recorder.prototype.getRescheduleDelay = function() {
    return 1000;
}


com.spikesource.tg4w.Recorder.prototype.runBatch = function() {
    this.batchstep = -1;
    this.stepBatch();
}

com.spikesource.tg4w.Recorder.prototype.stepBatch = function() {
    this.batchstep ++;
    if (this.batchstep < this.batch.length) {
        this.log ("running batch file " + this.batch[this.batchstep]);
        this.reset_all_but_batch();
        this.parseFile(com.spikesource.tg4w.tg4wcommon.getFileObject(this.batch[this.batchstep]));
        this.play();
    } else {
        this.replayIfLoop();
    }
}

com.spikesource.tg4w.Recorder.prototype.loopEnabled = function() {
    return this.playLoop;
}

com.spikesource.tg4w.Recorder.prototype.getNumberOfLoops = function() {
    return this.playLoopTimes;
}

com.spikesource.tg4w.Recorder.prototype.replayIfLoop = function() {
    this.loopCount ++;
    if (this.playLoop && ( this.playLoopTimes == -1 || this.loopCount < this.playLoopTimes)) {
        this.replay();
    }
}

com.spikesource.tg4w.Recorder.prototype.replay = function() {

    if (this.batch.length > 0) {
        setTimeout("com.spikesource.tg4w.recorder.runBatch()", 500);
        return;
    } else {
        setTimeout("com.spikesource.tg4w.recorder.play()", 500);
    }

    this.getLayoutDocument().getElementById("edit-right-tabs").selectedIndex = 2;

    this.addNewWindowObserver();
}

com.spikesource.tg4w.Recorder.prototype.play = function() {
    this.replaystep = 0;
    this.tg4wdh.reset();

    if (this.reporting != null) {
        this.reporting.startTest();
    }

    // reset expectDialog
    this.expectDialog = new com.spikesource.tg4w.ExpectDialog();
    for (var i = 0; i < this.actions.length; i ++) {
        var action = this.actions[i];
        if (action.action == "confirm") {
            this.expectDialog.pushConfirm(action.xpath, action.value);
        } else if (action.action == "alert") {
            this.expectDialog.pushAlert(action.value);
        } else if (action.action == "prompt") {
            this.expectDialog.pushPrompt(action.xpath, action.value);
        }
    }
    this.continuePlay();
    this.injectWindowDialogReplacer();
}

com.spikesource.tg4w.Recorder.prototype.continuePlay = function() {
    this.setStatus("Playing");
    this.recording  = false;
    this.playing    = true;

    setTimeout("com.spikesource.tg4w.recorder.resetMenu()", 100);
    setTimeout("com.spikesource.tg4w.recorder.step()", 10);
}

com.spikesource.tg4w.Recorder.prototype.log = function(msg, force) {
    if (force || com.spikesource.tg4w.tg4woptions.printDebug()) {
        var consoleService = Components.classes['@mozilla.org/consoleservice;1']
            .getService(Components.interfaces.nsIConsoleService);
        consoleService.logStringMessage(msg);
        dump(msg+"\n");
    }
}

com.spikesource.tg4w.Recorder.prototype.debug = function(msg) {
    this.log("debug:" + msg);
}

com.spikesource.tg4w.Recorder.prototype.error = function(msg) {
    this.log("error:" + msg, true);
    alert(com.spikesource.tg4w.tg4wcommon.localizeString(msg));
}

com.spikesource.tg4w.Recorder.prototype.assertElement = function(obj, xpath) {
    if (obj == null) {
        this.log("cannot find object: " + xpath);
        this.handleError("errorWhileAssert", "Could not find object:" + xpath + "\nStep: " + this.replaystep);

        // stop and reset menu on error
        this.stop("Could not find object:" + xpath + ", Step: " + this.replaystep);
        this.resetMenu();
        return false;
    }

    try {
        if (com.spikesource.tg4w.tg4woptions.doScroll()) {
            var x = com.spikesource.tg4w.tg4wcommon.findPosX(obj) - 100;
            var y = com.spikesource.tg4w.tg4wcommon.findPosY(obj) - 100;
            window.content.scrollTo(x, y);
            this.log("window scrolled to : " + x + "," + y);
        }

        com.spikesource.tg4w.tg4wcommon.hilightObject(obj, "green");
        obj.focus();
    } catch (scrollException) {
        this.log("IGNORED: could not scroll/hilightObject: " + e);
    }

    return true;
}

com.spikesource.tg4w.Recorder.prototype.clickOnElement = function(element) {
    var evt = element.ownerDocument.createEvent('MouseEvents');
    evt.initMouseEvent('click', true, true, element.ownerDocument.defaultView
            , 1, 0, 0, 0, 0, false, false, false, false, 0, null);
    this.debug(evt);
    element.dispatchEvent(evt);
}

com.spikesource.tg4w.Recorder.prototype.fixDatasetsAndVariables = function(str) {
    if (str) {
        var index = str.indexOf("${");
        while (index != -1) {
            var closeBraceIndex = str.indexOf("}", index);
            var varname = str.substring(index + 2, closeBraceIndex);
            var value = varname;

            var dotIndex = varname.indexOf(".");
            if (dotIndex != -1) {
                var dsname  = varname.substring(0, dotIndex);
                var xpath   = varname.substring(dotIndex + 1);
                value = this.tg4wdh.getDataFromDataset(dsname, xpath);
                this.showStatusCallback(this, "ds-fetch", varname, value);
            } else {
                value = this.getVariableVal(varname)
            }

            str = str.substring(0, index) + value + str.substring(closeBraceIndex + 1);
            // reindex
            index = str.indexOf("${");
        }
    }

    return str;
}

com.spikesource.tg4w.Recorder.prototype.fixAction = function(action) {
    var newAction = com.spikesource.tg4w.duplicateAction(action);
    newAction.xpath = this.fixDatasetsAndVariables(newAction.xpath);
    newAction.value = this.fixDatasetsAndVariables(newAction.value);
    newAction.winref = this.fixDatasetsAndVariables(newAction.winref);
    newAction.pagerefreshed = this.fixDatasetsAndVariables(newAction.pagerefreshed);
    return newAction;
}

com.spikesource.tg4w.Recorder.prototype.step = function() {
    if (! this.playing) {
        this.setStatus("Play stopped, reason: " + this.playStopMsg);
        this.resetMenu();
        if (this.reporting) {
            this.reporting.endAction(this.actions[this.replaystep-1], "fail", this.playStopMsg);
            this.reporting.endTest("fail");
        }
        return;
    }

    this.setStatus("step: " + this.replaystep + "/" + this.actions.length);

    if (this.replaystep >= this.actions.length) {
        if (this.simulBrowse && this.simulBrowse.polling) {
            this.pause();
            this.setStatus("Waiting for more actions.");
        } else {
            this.setStatus("Play Done with *no* errors.");
            // pass test only if it finishes without errors
            if (this.reporting) {
                this.reporting.endTest("pass");
            }
            this.playing = false;
            this.resetMenu();
            setTimeout("com.spikesource.tg4w.recorder.stepBatch();");
        }
        return;
    }


    var skipped = false;
    // reset waitForMs
    var waitForMs = -1;
    var jump2step = -1;
    var orig_action = this.actions[this.replaystep];
    if (this.reporting) {
        this.reporting.startAction(orig_action);
    }
    var action = this.fixAction(orig_action);

    this.log("new action:" + action.action + ":" + this.replaystep);

    if (this.editorCallback) {
        this.editorCallback(com.spikesource.tg4w.recorder, "step", this.replaystep);
    }

    this.log("Step:" + (this.replaystep + 1) + " of " + this.actions.length);
    this.setStatus("Step: " + action.action + ": " + (this.replaystep + 1) + "/" + this.actions.length + " -Scheduled");

    var actionFrameWindow = this.findObject.locateFrameWindow(window.content.document.defaultView.top, action.framesequence, action.winref);
    //this.log("action: " + action.action + " width: " + actionFrameWindow.innerWidth);

    if (action.action == "goto") {
        /* XXX locate the correct frame also here? */
        //window.content.location = action.value;
        actionFrameWindow.content.location.href = action.value;
    } else if (action.action == "click") {
        /* XXX locate the correct frame also here? */
        //var element = this.getElement(window.content.document, action.xpath);

        /*
         * why does actionFrameWindow.document works but
         * actionFrameWindow.content.document does NOT work??
         */
        var element = null;
        if (action.xpath == "javascript") {
            var jsSnip = com.spikesource.tg4w.recorder.getEvalPrefixJS();
            jsSnip += ";" + action.value;
            try {
                element = eval(jsSnip);
            } catch (e) {
                this.error("user js error: : " + e + ", step num:" + this.replaystep);
            }
        } else {
            element = this.getElement(actionFrameWindow.document, action.xpath);
        }

        if (element) {
            this.log("Got element: " + element);
            this.log("" + element.innerHTML);
        }

        if (this.assertElement(element, action.xpath)) {
            try {
                this.debug("about to click:" + action.xpath + " element: " + element.localName
                   + " objname:" + element.toString() + " prototype:" + element.prototype);
                if (element.localName && element.localName.toUpperCase() == "A") {
                    this.clickOnElement(element);
                } else {
                    this.log("clicking on " + element.localName);
                    try {
                        element.click();
                    } catch (e) {
                        this.debug("error trying to click on element, will try dispatch an event.");
                        this.clickOnElement(element);
                    }
                }
            } catch (e) {
                this.error(e.toString());
            }
        }
    } else if (action.action == "fill") {
        var element = this.getElement(actionFrameWindow.document, action.xpath);
        if (this.assertElement(element, action.xpath)) {
            this.debug("about to fill:" + action.xpath + " element: " + element.localName
                    + " objname:" + element.toString() + " prototype:" + element.prototype);
            try {
                if (com.spikesource.tg4w.tg4woptions.doFancyTyping() && element.localName && (element.localName.toUpperCase() == "TEXTAREA" || 
                            (element.localName.toUpperCase() == "INPUT" && (element.type == "text") || element.type == "password"))) {
                    if (!com.spikesource.tg4w.tg4w_fillInProgress) {
                        element.value = "";
                    }
                    if (element.value != action.value) {
                        var destlength = 0;
                        try { destlength = element.value.length; } catch (e) { }
                        element.value = action.value.substring(0, destlength + 1);
                        com.spikesource.tg4w.tg4w_fillInProgress = true;
                        setTimeout("com.spikesource.tg4w.recorder.step()", com.spikesource.tg4w.tg4woptions.getFancyTypingInterval());
                        return;
                    } else {
                        com.spikesource.tg4w.tg4w_fillInProgress = false;
                    }
                } else {
                    if (element.type == "file") {
                        var filevalue = com.spikesource.tg4w.tg4wcommon.getFileObject(action.value);
                        if (!filevalue) {
                            element.value = action.value;
                        } else {
                            element.value = filevalue.path;
                        }
                    } else {
                        element.value = action.value;
                    }
                }
                this.debug("filled value:" + element.value);
            } catch (e) {
                this.error(e.toString());
            }
        }
    } else if (action.action == "select") {
        var element = this.getElement(actionFrameWindow.document, action.xpath);
        if (this.assertElement(element, action.xpath)) {
            try {
                if (element.type == "select-multiple") {
                    for (var i = 0; i < element.options.length; i++) {
                        var option = element.options[i];
                        if (option.selected) {
                            option.selected = false;
                        }
                    }
                    var optionsToSet = action.value.split(/,/g);
                    for (var i = 0; i < optionsToSet.length; i++) {
                        var option = this.findElementByValue(element.options, unescape(optionsToSet[i]));
                        if (option != null) {
                            option.selected = true;
                        } else {
                            this.error("option with value not found: " + unescape(optionsToSet[i]));
                        }
                    }
                } else {
                    var option = this.findElementByValue(element.options, action.value);
                    if (option == null) {
                        option = this.findElementByText(element.options, action.value);
                    }
                    if (option.selected == false) {
                        option.selected = true;
                        var evt = element.ownerDocument.createEvent('Events');
                        evt.initEvent('change', 1, 0);
                        element.dispatchEvent(evt);
                    } else {
                        this.log("option already selected. not changing");
                    }
                }
            } catch (e) {
                this.error(e.toString());
            }
        }
    } else if (action.action == "check") {
        var element = this.getElement(actionFrameWindow.document, action.xpath);
        if (this.assertElement(element, action.xpath)) {
            if(element.checked != (action.value == true || action.value == "true")){
                element.click();
                this.log("clicking on checkbox " + element.localName);
            }
        }
    } else if (action.action == "verify-button-value") {
        this.log("skipping verification of button value");
        skipped = true;
    } else if (action.action == "assert-text-exists") {
        if (!this.findTextOnPage(actionFrameWindow, action.value, action.xpath)) {
            var answer = confirm("assert text failed. stop running test?\n" + "Could not find (no brackets):[" + action.value +"] on the page!");
            if (answer) {
                this.stop("Could not match text:" + action.value + ", Step: " + this.replaystep);
                this.resetMenu();
            }
        }
    } else if (action.action == "assert-text-does-not-exist") {
        if (this.findTextOnPage(actionFrameWindow, action.value, action.xpath)) {
            var answer = confirm("assert NO text failed. stop running test?");
            if (answer) {
                this.stop("Could not match text:" + action.value + ", Step: " + this.replaystep);
                this.resetMenu();
            }
        }
    } else if (action.action == "verify-title") {
        /* XXX locate the correct frame also here? yes! */
        if (action.value != this.getPageTitle()) {
            this.log(com.spikesource.tg4w.tg4wcommon.localizeString("ErrorPageTitleDoesNotMatch") + " '" + action.value + "'");
        }
    } else if (action.action == "alert" || action.action == "prompt" || action.action == "confirm") {
        // this is already pushed to expectDialog
        skipped = true;
    } else if (action.action == "wait-for-ms") {
        waitForMs = action.value;
    } else if (action.action == "wait-for-element") {
        element = this.getElement(actionFrameWindow.document, action.xpath);
    } else if (action.action == "exec-js") {
        var jsSnip = com.spikesource.tg4w.recorder.getEvalPrefixJS();
        jsSnip += ";" + action.value;
        try {
            eval(jsSnip);
        } catch (e) {
            this.debug("IGNORING! user js erred: : " + e + ", step num:" + this.replaystep);
        }
    } else if (action.action.indexOf("setvar-") == 0) {
        var varmatch = action.isVariableAction();
        if (varmatch) {
            var varname = varmatch[1];
            var vartype = varmatch[2];
            this.addVariable(varname, vartype, action.xpath);
            this.showStatusCallback(com.spikesource.tg4w.recorder, "var-update", varname);
        }
    } else if (action.action == "end") {
        var context = this.runContext.peek();
        if (context.isLoop()) {
            jump2step = context.actionIndex;
        } else {
            this.runContext.pop();
        }
    } else if (action.action.indexOf("loop-") == 0 || action.action.indexOf("condition-") == 0) {
        // take it out
        var context = this.runContext.peek();
        var newContext = false;
        if (!context || context.actionIndex != this.replaystep) {
            context = new Tg4wContainer(this.replaystep);
            newContext = true;
        }
        if (context.evaluateFalse()) {
            jump2step = context.findEnd() + 1;
            // loop or condition evaluated to false, pop
            this.runContext.pop();
        } else {
            if (newContext) {
                this.runContext.push(context);
            }
        }
    } else if (action.action.indexOf("goto-label") == 0) {
        var jsSnip = com.spikesource.tg4w.recorder.getEvalPrefixJS();
        jsSnip += ";" + action.xpath;
        try {
            var evalValue = eval(jsSnip);
            if (evalValue) {
                jump2step = this.findStepWithLabel(action.value);
            }
        } catch (e) {
            this.error("user js erred: : " + e + ", step num:" + this.replaystep);
        }
    } else if (action.action.indexOf("goto-") == 0) {
        var evalVal;
        try {
            var evalVal = null;
            if (action.xpath) {
                var evalCmd = this.getEvalPrefixJS() + action.xpath;
                evalVal = eval(evalCmd);
            }
            this.log("user js = '" + action.xpath + "'");
            this.log("evalVal = '" + evalVal + "'");
            // backward compatible
            var match = action.isGotoLabel();
            if (match) {
                var evalSuccessVal = false;
                labelName = match[1];
                operateOn = match[2];
                operator = match[3];
                this.log("label=" + labelName + ", operator=" + operator + ", on=" + operateOn);

                if (operateOn == "bool" || operateOn == "str") {
                    // here, compare everything as string
                    evalVal = evalVal + "";

                    if ((operator == "eq" && action.value == evalVal)
                            || (operator == "ne" && action.value != evalVal)
                       ) {
                        evalSuccessVal = true;
                    }
                } else if (operateOn == "num") {
                    // compare values as float
                    var compareVal = parseFloat(action.value);
                    evalVal = parseFloat(evalVal);

                    if ((operator == "eq" && compareVal == evalVal)
                            || (operator == "ne" && compareVal != evalVal)
                            || (operator == "gt" && compareVal > evalVal)
                            || (operator == "ge" && compareVal >= evalVal)
                            || (operator == "lt" && compareVal < evalVal)
                            || (operator == "le" && compareVal <= evalVal)
                       ) {
                        evalSuccessVal = true;
                    }
                } else if (operateOn == "loop_on_dataset") {
                    var ds = this.tg4wdh.getDataset(operator);
                    this.tg4wdh.incrementLoopCount(operator);
                    evalSuccessVal = !(ds.loopCount >= this.tg4wdh.getDataset(operator).length());
                    if (!evalSuccessVal) {
                        ds.reset();
                        this.debug("finished loop for :" + operator + ". dataset is reset.");
                    } else {
                        this.debug("looping :" + (ds.loopCount + 1) + "/" 
                            + this.tg4wdh.getDataset(operator).length() + ", set:" + operator);
                    }
                }

                if (evalSuccessVal) {
                    jump2step = this.findStepWithLabel(labelName);
                    if (jump2step == -1) {
                        this.log("could not find step with label " + labelName + ", continuing.");
                    } else {
                        this.log("evaluated was a success, will jump to " + labelName + ", stepnum:" + jump2step);
                    }
                }
            }
            this.log("user js evaluated to: '" + evalVal + "'");
        } catch (e) {
            this.log("user js crashed with error: '" + e + "'. Expression: '" + action.value + "'");
        }
    } else {
        this.error("cannot recognize action: '" + action.action + "'. continuing.");
        skipped = true;
    }

    this.setStatus("Step: " + action.action + ": " + (this.replaystep + 1) + "/" + this.actions.length + " -Done");

    if (com.spikesource.tg4w.tg4woptions.showProgressBar()) {
        com.spikesource.tg4w.recorder.updateProgress();
    }

    if (jump2step == -1) {
        this.replaystep ++;
    } else {
        this.replaystep = jump2step;
    }
    if (waitForMs != -1) {
        this.log("waiting for " + waitForMs + "ms");
        setTimeout("com.spikesource.tg4w.recorder.step()", waitForMs);
    } else if (skipped) {
        this.log("step skipped, moving on");
        setTimeout("com.spikesource.tg4w.recorder.step()", this.getSkippedDelay());
    } else if (action.waitForRefresh()) {
        this.log("schedule wait");
        this.pagesready.length = 0;
        setTimeout("com.spikesource.tg4w.recorder.waitforpages(1, '" + action.pagerefreshed + "')", this.getPageReadyDelay());
    } else {
        try {
            this.log("schedule step: " + com.spikesource.tg4w.recorder.replaystep + " : " + com.spikesource.tg4w.recorder.getActions()[this.replaystep].getReadableString());
        } catch (e) {
            // just in case!
            this.log("schedule step: " + com.spikesource.tg4w.recorder.replaystep);
        }
        setTimeout("com.spikesource.tg4w.recorder.step()", this.getPageReadyDelay());
    }
    
    if (this.reporting != null) {
        this.reporting.endAction(action, "pass", "");
    }
}

com.spikesource.tg4w.Recorder.prototype.who = function() {
    return "i am tg4w " + RECORDER_VERSION;
}


com.spikesource.tg4w.Recorder.prototype.findStepWithLabel = function(labelName) {
    for (var i = 0; i < this.actions.length; i ++) {
        if (this.actions[i].label == labelName) {
            return i;
        }
    }
    return -1;
}

com.spikesource.tg4w.Recorder.prototype.findElementByText = function(list, value) {
    for (lc = 0; lc < list.length; lc ++) {
        if (list[lc].text == value) {
            return list[lc];
        }
    }
    return null;
}

com.spikesource.tg4w.Recorder.prototype.findElementByValue = function(list, value) {
    for (lc = 0; lc < list.length; lc ++) {
        if (list[lc].value == value) {
            return list[lc];
        }
    }
    return null;
}

com.spikesource.tg4w.Recorder.prototype.findElementByName = function(list, value) {
    for (lc = 0; lc < list.length; lc ++) {
        if (list[lc].name == value) {
            return list[lc];
        }
    }
    return null;
}

com.spikesource.tg4w.Recorder.prototype.getXpath = function(obj, winref) {
    var xpath = null;

    if ((!winref || winref == ".") && obj.ownerDocument != this.getWorkingDocument()) {
        return xpath = "*/";
    } else if (winref && winref != ".") {
        var objWin = this.windowObserver.getWindow(winref);
        if (objWin == null || objWin.content.document != obj.ownerDocument) {
            return xpath = "*/";
        }
    }

    if (com.spikesource.tg4w.tg4woptions.getRecordMode() == "tg4w_smart") {
        // find this function in com.spikesource.tg4w.tg4wcommon.js
        xpath = this.findObject.tg4w_default_getXpath(obj, "");
    } else if (com.spikesource.tg4w.tg4woptions.getRecordMode() == "tg4w_dumb") {
        xpath = this.findObject.tg4w_dumb_getXpath(obj);
    } else {
        com.spikesource.tg4w.recorder.error("Invalid recording mode :" + PLAYER_PLUGIN);
        throw "Invalid recording mode :" + PLAYER_PLUGIN;
    }
    return xpath;
}

com.spikesource.tg4w.Recorder.prototype.getElement = function(obj, xpath) {
    // find this function in com.spikesource.tg4w.tg4wcommon.js
    try {
        if (com.spikesource.tg4w.tg4woptions.getRecordMode() == "tg4w_smart") {
            return this.findObject.tg4w_default_getObject(/*base object*/ obj, /*parentObject*/ obj, xpath);
        } else if (com.spikesource.tg4w.tg4woptions.getRecordMode() == "tg4w_dumb") {
            return this.findObject.tg4w_dumb_getObject(/*base object*/ obj, /*parentObject*/ obj, xpath);
        } else {
            com.spikesource.tg4w.recorder.error("Invalid recording mode :" + PLAYER_PLUGIN);
            throw "Invalid recording mode :" + PLAYER_PLUGIN;
        }
    } catch (e) {
        this.log(e);
        this.handleError(e, "Could not find object:" + xpath + "\nStep: " + this.replaystep);

        // stop and reset menu on error
        this.stop("Could not find object:" + xpath + ", Step: " + this.replaystep);
        this.resetMenu();
        return null;
    }
}

com.spikesource.tg4w.Recorder.prototype.stopEventPropagation = function(event) {
    event.stopPropagation();
}

com.spikesource.tg4w.Recorder.prototype.handleError = function(error, msg) {
    if (this.playing) {
        this.playing = false;
        this.resetMenu();
    }
    this.error(msg);
}

com.spikesource.tg4w.Recorder.prototype.onLoad = function(winref, eventObj) {
    this.getLayoutDocument().getElementById("recordtoolbar").removeAttribute("hidden");
    gBrowser.addProgressListener(new com.spikesource.tg4w.PageLoadListener(winref));


    this.resetMenu();
    this.refreshFavorites();
    this.refreshTests();
    this.addWindowEventListeners(window, winref);

    var windowNames = ["newEditStepEditor", "newEditSteps", "runStatusWindow", "debugWindow"];
    for (var i = 0; i < windowNames.length; i ++) {
        var win = this.getLayoutDocument().getElementById(windowNames[i]).contentWindow;
        win.arguments = new Array();
        win.arguments[0] = new com.spikesource.tg4w.DummyHolder();
        win.arguments[0].recorder = this;
        win.arguments[0].tg4wcommon = com.spikesource.tg4w.tg4wcommon;
    }
}

com.spikesource.tg4w.Recorder.prototype.addWindowEventListeners = function(win, winref) {
    win.addEventListener("change", function(e) { com.spikesource.tg4w.recorder.onChange(winref, e); }, true);
    win.addEventListener("submit", function(e) { com.spikesource.tg4w.recorder.onSubmit(winref, e); }, true);
    //win.addEventListener("click", function(e) { com.spikesource.tg4w.recorder.onClick(winref, e); }, true);
    win.addEventListener("mouseup", function(e) { com.spikesource.tg4w.recorder.onClick(winref, e); }, true);
}

com.spikesource.tg4w.Recorder.prototype.onMenuItemCommand = function() {
}

com.spikesource.tg4w.Recorder.prototype.onSubmit = function(winref, e) {
}

com.spikesource.tg4w.Recorder.prototype.onChange = function(winref, e) {
    if (this.recording == false) return;

    /* FIND FRAME SEQUENCE :) */
    var frameSequence = this.findObject.getFrameSequenceFromEventTarget(e.target);

    var localname = e.target.localName ? e.target.localName.toUpperCase() : "";
    var xpath = this.getXpath(e.target, winref);

    if (xpath == "*/") {
        this.debug("could not find xpath for target:" + e.target);
        return;
    }

    if (localname == "INPUT") {
        if (e.target.type == "text" || e.target.type == "password" || e.target.type == "file") {
            this.record("fill", xpath, e.target.value,false,frameSequence, winref);
        } else if (e.target.type == "checkbox") {
            this.record("check", xpath, e.target.checked,false,frameSequence, winref);
        }
    } else if (localname == "SELECT") {
        var selectValue = e.target.value;
        if (e.target.type == "select-multiple") {
            selectValue = ""
            for (var i = 0; i < e.target.options.length; i++) {
                if (e.target.options[i].selected) {
                    var tmp = e.target.options[i].value;
                    tmp = escape(tmp);
                    if (selectValue != "") {
                        selectValue = selectValue + "," + tmp;
                    } else {
                        selectValue = tmp;
                    }
                }
            }
        }
        this.record("select", xpath, selectValue, false,frameSequence, winref);
    } else if (localname == "TEXTAREA") {
        this.record("fill", xpath, e.target.value,false,frameSequence, winref);
    }
}

com.spikesource.tg4w.Recorder.prototype.onClick = function(winref, e) {
    if (!this.nextOnclickActionGoesTo) {
        if (e.button == 0) {
            this.onLeftClick(winref, e);
        } else if (e.button == 2) {
            this.onRightClick(winref, e);
        }
    } else {
        try {
            this.nextOnclickActionGoesTo(winref, e);
        } catch (e) {
            this.setStatus("onclick receiver error!");
            alert(e);
        } finally {
            this.nextOnclickActionGoesTo = null;
        }
    }
}

com.spikesource.tg4w.Recorder.prototype.onRightClick = function(winref, e) {
    // just record what this is clicked on
    this.lastRightClickedTarget = e.target;
}

com.spikesource.tg4w.Recorder.prototype.onLeftClick = function(winref, e) {
    if (this.isRecording() || this.isPlaying()) {
        this.debug("click winref:" + winref + ", e:" + e.target);
        this.recordTarget(winref, e.target);
    }
}

com.spikesource.tg4w.Recorder.prototype.runUnitTest = function(winref) {
    var inlineeditor = document.getElementById("newrecordeditor");
    if (inlineeditor.hasAttribute("collapsed")) {
        this.toggleInlineEditSteps();
    }
    this.loadfile("TG4W_TEST/batch.txt");
}

com.spikesource.tg4w.Recorder.prototype.recordTarget = function(winref, eTarget) {
    if (this.recording == false) return;
    if (eTarget == null) { return; }

    /* FIND FRAME SEQUENCE :) */
    var frameSequence = this.findObject.getFrameSequenceFromEventTarget(eTarget);
    // UNCOMMENT TO DEBUG IT HAS FOUND THE CORRECT frame sequence
    //locateFrameWindow(eTarget.ownerDocument.defaultView.top, frameSequence);


    var localname = eTarget.localName ? eTarget.localName.toUpperCase() : "";
    if (localname == "INPUT" || localname == "BUTTON") {
        if (eTarget.type == "button" || eTarget.type == "submit" || eTarget.type == "radio" || eTarget.type == "image" || eTarget.type == "reset") {
            var xpath = this.getXpath(eTarget, winref);
            this.log("trying to record " + eTarget.type + " " + xpath);
            this.log("trying to record " + xpath);
            this.record("click", xpath, eTarget.getAttribute("name"), false , frameSequence, winref);
        }
    } else if (localname == "A") {
        var xpath = this.getXpath(eTarget, winref);
        this.record("click", xpath, "", false,frameSequence, winref);
    }
    else {
        // only if the xpath contains something with /A[
        if (this.getXpath(eTarget, winref).indexOf("A[") != -1) {
            this.recordTarget(winref, eTarget.parentNode);
        } else {
            var onclickFoundElem = eTarget;
            while (onclickFoundElem != null && onclickFoundElem.getAttribute && onclickFoundElem.getAttribute("onclick") == null) {
                onclickFoundElem = onclickFoundElem.parentNode;
            }

            if (onclickFoundElem != null && onclickFoundElem.getAttribute && onclickFoundElem.getAttribute("onclick") != null) {
                var xpath = this.getXpath(onclickFoundElem, winref);
                if (xpath != "*/") {
                    this.debug("clicked on " + eTarget.localName
                            + " onClick is on element: "
                            + onclickFoundElem.localName + " recording it.");
                    com.spikesource.tg4w.recorder.log('LOCALNAME: ' + localname);
                    com.spikesource.tg4w.recorder.log('XPATH: ' + xpath);
                    this.record("click", xpath, "", false, frameSequence);
                }
            } else {
                this.debug("clicked on " + localname + "don't know how to handle it!");
            }
        }
    }
}

/*
* Deprecated as 0.37
* Bruno V. 23/11/2005
*/
com.spikesource.tg4w.Recorder.prototype.record = function(action, path, value1, pagerefresh, framesequence, winref) {
    var actionObj = new com.spikesource.tg4w.Action(action,
        com.spikesource.tg4w.tg4wcommon.trimStr(path + ""),
        com.spikesource.tg4w.tg4wcommon.trimStr(value1 + ""),
        com.spikesource.tg4w.tg4wcommon.trimStr(pagerefresh + ""),
        framesequence,
        winref, 0);

    if (actionObj.action == "")  return;

    this.actions.push(actionObj);

    this.editorCallback(this, "reset");
    this.editorCallback(this, "scroll");

    if (this.actions.length == 1) {
        this.resetMenu();
    }
}


com.spikesource.tg4w.Recorder.prototype.viewReport = function (browserWindow) {
    var url = "chrome://recorder/content/testreport.xul";
    if (this.reporting != null && this.reporting.reportId != -1) {
        url += "?report=" + this.reporting.reportId;
    } else if (this.loadedFileName != null) {
        url += "?file=" + this.loadedFileName;
    }

    var newTab = browserWindow.addTab(url);
    browserWindow.selectedTab = newTab; 
}

com.spikesource.tg4w.Recorder.prototype.showDeprecationError = function (msg) {
    if (! this.deprecationError) {
        this.error("This file seems to be generated by recorder older than 0.35, please re-save this file to port to newer version. Look in the JS console for all errors.");
        this.deprecationError = true;
    }
    this.debug("deprecated: " + msg);
}

com.spikesource.tg4w.NewWindowObserver = function(recorder) {
    this.recorder = recorder;
    this.count = 1;
    this.openWindows = new Array();
    this.openWindowNames = new Array();
}

com.spikesource.tg4w.NewWindowObserver.prototype.resetData = function(){
    this.count = 1;
    this.winCount = 0;
    this.openWindows = new Array();
    this.openWindowNames = new Array();
}


com.spikesource.tg4w.NewWindowObserver.prototype.addWindow = function(win1){
    var winName = "tg4wnamed" + com.spikesource.tg4w.recorder.windowObserver.count;
    this.count ++;

    com.spikesource.tg4w.recorder.debug("adding:" + winName + " to " + win1 + "to openWindows");

    this.openWindows.push(win1);
    this.openWindowNames.push(winName);

    this.winCount++;

    com.spikesource.tg4w.recorder.debug("window added. new length=" + this.openWindows.length);

    return winName;
}

com.spikesource.tg4w.DummyHolder = function() {
    this.recorder = null;
}

com.spikesource.tg4w.NewWindowObserver.prototype.observe = function(subject, topic, data) {
    try {
        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
            .getService(Components.interfaces.nsIWindowMediator);
        var win = wm.getMostRecentWindow(null);
        win.arguments = new Array();
        win.arguments[0] = new com.spikesource.tg4w.DummyHolder();
        win.arguments[0].recorder = this.recorder;
        com.spikesource.tg4w.recorder.debug("NEW WINDOW:" + win.arguments[0]);
    } catch (e) {
        com.spikesource.tg4w.recorder.error("new window observer error:" + e);
    }
}

com.spikesource.tg4w.NewWindowObserver.prototype.getWindow = function(name) {
    com.spikesource.tg4w.recorder.debug("getWindow: searching thro' " + this.openWindows.length + " windows");
    /*
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
        .getService(Components.interfaces.nsIWindowMediator);
    var win = wm.getMostRecentWindow(null);
    return win;
    */

    for (var i = 0; i < this.openWindowNames.length; i ++) {
        if (this.openWindowNames[i] == name) {
            return this.openWindows[i];
        }
    }
    return null;
}

com.spikesource.tg4w.PageLoadListener = function(windowName) {
    this.windowName = windowName;
}

com.spikesource.tg4w.PageLoadListener.prototype.onStatusChange = function() {}
com.spikesource.tg4w.PageLoadListener.prototype.onLocationChange = function(progress, request, loc) {
    /*
    com.spikesource.tg4w.recorder.debug("navigate to: [" + loc.spec + "]");
    com.spikesource.tg4w.recorder.debug("req : [" + request + "]");
    com.spikesource.tg4w.recorder.debug("progress: [" + progress + "]");
    */
}
com.spikesource.tg4w.PageLoadListener.prototype.onSecurityChange = function() {}
com.spikesource.tg4w.PageLoadListener.prototype.onProgressChange = function() {}

com.spikesource.tg4w.PageLoadListener.prototype.onStateChange = function(a,b,c,d) {
    if (c == 786448 && d == 0) {
        // page load complete
        com.spikesource.tg4w.recorder.pageLoaded(this.windowName);
    } else {
        //this.log("a=" + a + "b=" + b + "c=" + c + "d=" + d);
    }
}


com.spikesource.tg4w.Recorder.prototype.showStatusCallback = function(arg1, arg2, arg3, arg4, arg5) {
    return this._callBackGeneric(this._statusCallback, arg1, arg2, arg3, arg4, arg5);
}

com.spikesource.tg4w.Recorder.prototype.editorCallback = function(arg1, arg2, arg3, arg4, arg5) {
    return this._callBackGeneric(this._editorCallback, arg1, arg2, arg3, arg4, arg5);
}

com.spikesource.tg4w.Recorder.prototype.getDocument = function() {
    return this.getLayoutDocument();
}

com.spikesource.tg4w.Recorder.prototype.getWorkingDocument = function() {
    return window.content.document;
}

com.spikesource.tg4w.Recorder.prototype.editStepEditorCallback = function (arg1, arg2, arg3, arg4, arg5) {
    this._callBackGeneric(this._editStepEditorCallback, arg1, arg2, arg3, arg4, arg5);
}

com.spikesource.tg4w.Recorder.prototype._callBackGeneric = function (functions, arg1, arg2, arg3, arg4, arg5) {
    for (var i = 0; i < functions.length; i ++) {
        var fctn = functions[i];
        try {
            var returnValue = fctn(arg1, arg2, arg3, arg4, arg5);
            if (returnValue != undefined) {
                return returnValue;
            }
        } catch (e) {
            this.log("error:" + e);
            throw e;
        }
    }
}

com.spikesource.tg4w.Recorder.prototype.addRunStatusCallback = function(fctnCallback) {
    this.log("register status callback");
    if (!this._statusCallback.contains_tg4w(fctnCallback)) {
        this._statusCallback.push(fctnCallback);
    }
}

com.spikesource.tg4w.Recorder.prototype.addEditorCallback = function(fctnCallback) {
    this.log("register editor callback");
    if (!this._editorCallback.contains_tg4w(fctnCallback)) {
        this._editorCallback.push(fctnCallback);
    }
}

com.spikesource.tg4w.Recorder.prototype.addEditStepEditorCallback = function(fctnCallback) {
    this.log("register edit step editor callback");
    if (!this._editStepEditorCallback.contains_tg4w(fctnCallback)) {
        this._editStepEditorCallback.push(fctnCallback);
    }
}

com.spikesource.tg4w.Recorder.prototype.removeRunStatusCallback = function(fctnCallback) {
    this.log("unregister status callback");
    this.removeElementFromArray(fctnCallback, this._statusCallback);
}

com.spikesource.tg4w.Recorder.prototype.removeEditorCallback = function(fctnCallback) {
    this.log("unregister editor callback");
    this.removeElementFromArray(fctnCallback, this._editorCallback);
}

com.spikesource.tg4w.Recorder.prototype.removeEditStepEditorCallback = function(fctnCallback) {
    this.log("unregister edit step editor callback");
    this.removeElementFromArray(fctnCallback, this._editStepEditorCallback);
}

com.spikesource.tg4w.Recorder.prototype.removeElementFromArray = function(obj, arr) {
    var index = -1;
    for (var i = 0; i < arr.length; i ++) {
        if (arr[i] == obj) {
            index = i;
            break;
        }
    }

    if (index != -1) {
        arr.splice(index, 1);
        return true;
    } else {
        return false;
    }
}
