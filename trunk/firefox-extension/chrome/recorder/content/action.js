/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See www.spikesource.com/license.html)
 *
 * author: Vinay Srini (vsrini@spikesource.com)
 */

com.spikesource.tg4w.Action = function(action_or_xmlElem, xpath, value, pagerefresh, framesequence, winref, ajaxCount) {
    this.tg4wcommon = com.spikesource.tg4w.tg4wcommon;

    this.action = "";
    this.xpath = "";
    this.value = "";
    this.label = "";
    this.pagerefreshed = "false";
    this.framesequence = "";
    this.winref = "";
    this.ajaxCount = 0;

    if (arguments.length ==1) {
        this._createFromXmlElem(action_or_xmlElem);
    } else {
        this._createFromValues(action_or_xmlElem, xpath, value, pagerefresh, framesequence, winref, ajaxCount);
    }

    this.reportActionId = -1;
 
}

com.spikesource.tg4w.duplicateAction = function(action) {
    var newAction = new com.spikesource.tg4w.Action(action.action, action.xpath, 
        action.value, action.pagerefreshed, action.framesequence, action.winref, action.ajaxCount);
    newAction.label = action.label;
    newAction.reportActionId = action.reportActionId;
    return newAction;
}


com.spikesource.tg4w.Action.prototype.getInfo = function() {
    return this.getReadableString();
}

com.spikesource.tg4w.Action.prototype.simplyfyXpath = function() {
    var xpathsplit = this.xpath.split("/");
    var pre = xpathsplit.pop();
    return pre;
}

com.spikesource.tg4w.Action.prototype.getReadableString = function() {
    if (this.action == "goto") {
        return "<span class='command_name'>goto location</span> <span class='command_value'>" + this.value + "</span>";
    } else if (this.action == "goto-label") {
        return "<span class='command_name'>jump to label </span> <span class='command_value'>" + this.value + "</span> if " + "<span class='command_value'><pre style='display:inline;'>" + this.xpath + "</pre></span>";
    } else if (this.action == "click") {
        return "<span class='command_name'>click</span> <span class='command_value'>" + this.simplyfyXpath() + "</span>";
    } else if (this.action == "fill") {
        return "<span class='command_name'>enter text</span> <span class='command_value'>" + this.simplyfyXpath() + "</span> = [<strong>" + this.value + "</strong>]";
    } else if (this.action.indexOf("loop-dataset") == 0) {
        var match = this.action.match(/^loop-dataset-(.*)-(.*)$/);
        return "<span class='command_name'>while dataset</span> <span class='command_value'>" + match[1] + "</span> has more data";
    } else if (this.action.indexOf("loop-condition") == 0) {
        var match = this.action.match(/^loop-condition-(.*)$/);
        return "<span class='command_name'>while</span> <span class='command_value'>" + this.xpath + " " + match[1] + " " + this.value + "</span>";
    } else if (this.action.indexOf("condition") == 0) {
        var match = this.action.match(/^condition-(.*)$/);
        return "<span class='command_name'>if</span> <span class='command_value'>" + this.xpath + " " + match[1] + " " + this.value + "</span>";
    } else if (this.action.indexOf("setvar-") == 0) {
        var match = this.action.match(/^setvar-(.*)-(.*)$/);
        return "<span class='command_name'>set</span> <span class='command_value'>" + match[1] + "</span> = [" + this.xpath + " ]";
    } else if (this.action.indexOf("verify-title") == 0) {
        return "<span class='command_name'>assert page title</span> <span class='command_value'>" + this.value + "</span>"
    } else if (this.action.indexOf("wait-for-ms") == 0) {
        return "<span class='command_name'>sleep</span> <span class='command_value'>" + (this.value)/1000.0 + "</span> seconds"
    } else if (this.action.indexOf("assert-text-exists") == 0) {
        return "<span class='command_name'>assert text: [</span><span class='command_value'>" + this.value + "</span><span class='command_name'>] exists </span>"
    } else if (this.action.indexOf("assert-text-does-not-exist") == 0) {
        return "<span class='command_name'>assert text: [</span><span class='command_value'>" + this.value + "</span><span class='command_name'>] does NOT exist </span>"
    } else {
        return this.action + " " + this.xpath + " " + this.value;
    }
}

com.spikesource.tg4w.Action.prototype.addAjaxCount = function(count) {
    var recorder = com.spikesource.tg4w.recorder;
    recorder.debug("adding count:" + count);
    this.ajaxCount += parseInt(count);
    recorder.debug("ajax count is :" + this.ajaxCount);
}

com.spikesource.tg4w.Action.prototype.addPageRefreshed = function(winref) {
    if (this.pagerefreshed == "false") {
        this.pagerefreshed = winref;
    } else {
        this.pagerefreshed = this.pagerefreshed + "," + winref;
    }
}

com.spikesource.tg4w.Action.prototype.waitForRefresh = function() {
    if (this.pagerefreshed != "false") {
        return true;
    } else {
        return false;
    }
}

com.spikesource.tg4w.Action.prototype.isAssertAction = function() {
    if (this.action == "verify-title") {
        return true;
    }
}

com.spikesource.tg4w.Action.prototype.isGotoLabel = function() {
    return this.action.match(/^goto-([a-zA-Z-_0-9]+)-([a-zA-Z_0-9]+)-([a-zA-Z_0-9]+)$/);
}

com.spikesource.tg4w.Action.prototype.isVariableAction = function() {
    return this.action.match(/^setvar-([a-zA-Z-_0-9]+)-([a-zA-Z_0-9]+)$/);
}

com.spikesource.tg4w.Action.prototype._createFromXmlElem = function(actionElem) {
    var recorder = com.spikesource.tg4w.recorder;
    recorder.log("Action.prototype.createFromXmlElem");
    this.action        = this.tg4wcommon.getAttribute( actionElem, "type");
    this.pagerefreshed = this.tg4wcommon.getAttribute( actionElem, "refresh");
    this.label         = this.tg4wcommon.getAttribute( actionElem, "label");
    this.ajaxCount     = this.tg4wcommon.getAttribute( actionElem, "ajax-count");
    if (!this.ajaxCount) { this.ajaxCount = 0; }

    if (this.pagerefreshed == "") this.pagerefreshed = "false";
    if (this.pagerefreshed == "true") this.pagerefreshed = ".";

    if (actionElem.getElementsByTagName("xpath").item(0)) {
        this.xpath = this.tg4wcommon.trimStr( actionElem.getElementsByTagName("xpath").item(0).childNodes.item(0).nodeValue);
    }
    if (actionElem.getElementsByTagName("value").item(0)) {
        this.value = this.tg4wcommon.trimStr( actionElem.getElementsByTagName("value").item(0).childNodes.item(0).nodeValue);
    }

    var framesequence;  // will populate it after parsing frame-sequence node

    /* get frame-sequence value as string */
    var framesequenceString = this.tg4wcommon.getAttribute(actionElem, "frame");
    var winref = this.tg4wcommon.getAttribute(actionElem, "window");
    // trim string
    framesequenceString = framesequenceString.replace(/^\s+/g, '').replace(/\s+$/g, '');
    recorder.log("framesequence extracted as string: " + framesequenceString + "-> (has length: " + framesequenceString.length + ")");

    /* get Array of frames to travel down from the framesequence String */
    if(framesequenceString.length==0 || framesequenceString=='undefined'){
        framesequence = new Array();
    }
    else{
        framesequence = framesequenceString.split(",");
    }

    recorder.log("framesequence converted to array: " + framesequence + "-> (#"+ framesequence.length + " frames to travel down)");

    if (framesequence != null && framesequence != undefined && framesequence != "undefined") {
        this.framesequence = framesequence;
    } else {
        this.framesequence = new Array();
    }

    this.winref = winref;
}

/** added framesequence as last parameter */
com.spikesource.tg4w.Action.prototype._createFromValues = function(action, xpath, value, pagerefresh, framesequence, winref, ajaxCount) {
    var recorder = com.spikesource.tg4w.recorder;
    recorder.log("Action.prototype.createFromValues");


    action = this.tg4wcommon.trimStr(action + "");
    if (action == "verify-text") {
        recorder.showDeprecationError(action + " name change");
        action = "assert-text-exists";
    } else if (action == "verify-link-text" || action == "verify-link-href") {
        recorder.showDeprecationError(action + " not supported after 0.34.4");
        return;
    }


    this.action = action;
    this.xpath = xpath;
    this.value = value;
    this.pagerefreshed = pagerefresh;
    if (ajaxCount) {
        this.ajaxCount = ajaxCount;
    } else {
        this.ajaxCount = 0;
    }

    if (framesequence != null && framesequence != undefined && framesequence != "undefined") {
        this.framesequence = framesequence;
    } else {
        this.framesequence = "";
    }
    if (winref != null && winref != undefined && winref != "undefined") {
        this.winref = winref;
    } else {
        this.winref = ".";
    }
}

com.spikesource.tg4w.Action.prototype.dump = function() {
    this.error(this.strvalue());
}

com.spikesource.tg4w.Action.prototype.strvalue = function() {
    return (this.action + " | " + this.xpath + " | " + this.value + " | " + this.pagerefreshed + " | " + this.framesequence + "|" + this.winref);
}


/*
* Get the action as an XML Element
* @param doc : an xml document
* @param indent : a string indentation (spaces)
* Bruno V. 21/11/2005
*/
com.spikesource.tg4w.Action.prototype.getXml = function(doc, indent) {
    //var doc = document.implementation.createDocument("", "", null);

    var actionElem = doc.createElement("action");

    actionElem.setAttribute("type", this.action);
    if (this.label != "") {
        actionElem.setAttribute("label", this.label);
    }

    if (this.pagerefreshed!="false")
        actionElem.setAttribute("refresh", this.pagerefreshed);

    if (this.ajaxCount)
        actionElem.setAttribute("ajax-count", this.ajaxCount + "");

    if (this.framesequence.length > 0)
        actionElem.setAttribute("frame", this.framesequence);

    if (this.winref.length > 0)
        actionElem.setAttribute("window", this.winref);

    var xpathElem = doc.createElement("xpath");
    var xpathData = doc.createCDATASection(this.xpath);
    xpathElem.appendChild(xpathData);

    var valueElem = doc.createElement("value");
    var valueData = doc.createCDATASection(this.value);
    valueElem.appendChild(valueData);

    /**/actionElem.appendChild(doc.createTextNode("\n    "+indent));
    actionElem.appendChild(xpathElem);
    /**/actionElem.appendChild(doc.createTextNode("\n    "+indent));
    actionElem.appendChild(valueElem);
    /**/actionElem.appendChild(doc.createTextNode("\n"+indent));

    return actionElem;
}

com.spikesource.tg4w.Action.prototype.isStartContainer = function() {
    return (this.action.indexOf("loop-") == 0 || this.action.indexOf("condition-") == 0);
}

com.spikesource.tg4w.Action.prototype.isEndContainer = function() {
    return (this.action == "end");
}

/*
* Deprecated : use Action.prototype.getXml
* Bruno V. 21/11/2005
*/
com.spikesource.tg4w.Action.prototype.xmlvalue = function() {
    var retStr = "";
    retStr += "        <action>" + this.tg4wcommon.TG4W_LINE_BREAK;
    retStr += "            <type>" + this.tg4wcommon.TG4W_CDATA_OPEN + this.action + this.tg4wcommon.TG4W_CDATA_CLOSE + "</type>" + this.tg4wcommon.TG4W_LINE_BREAK;
    retStr += "            <xpath>" + this.tg4wcommon.TG4W_CDATA_OPEN + this.xpath + this.tg4wcommon.TG4W_CDATA_CLOSE + "</xpath>" + this.tg4wcommon.TG4W_LINE_BREAK;
    retStr += "            <value>" + this.tg4wcommon.TG4W_CDATA_OPEN + this.value + this.tg4wcommon.TG4W_CDATA_CLOSE + "</value>" + this.tg4wcommon.TG4W_LINE_BREAK;
    retStr += "            <page-refreshed>" + this.tg4wcommon.TG4W_CDATA_OPEN + this.pagerefreshed + this.tg4wcommon.TG4W_CDATA_CLOSE + "</page-refreshed>" + this.tg4wcommon.TG4W_LINE_BREAK;
    retStr += "            <frame-sequence>" + this.tg4wcommon.TG4W_CDATA_OPEN + this.framesequence + this.tg4wcommon.TG4W_CDATA_CLOSE + "</frame-sequence>" + this.tg4wcommon.TG4W_LINE_BREAK;
    retStr += "        </action>";
    return retStr;
}
