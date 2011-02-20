/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See www.spikesource.com/license.html)
 * 
 * author: Vinay Srini (vsrini@spikesource.com)
 */

com.spikesource.tg4w.FindObject = function() {}

com.spikesource.tg4w.FindObject.prototype.tg4w_default_getObject = function(obj, parentDocument, xpath) {
    if (xpath == "") {
        // no more.
        return obj;
    } else if (xpath.indexOf("/") == -1) {
        //com.spikesource.tg4w.recorder.debug("no more xpath");
        com.spikesource.tg4w.recorder.log("object2find=" + xpath);
        return this.findChild(obj, parentDocument, xpath, false);
    } else if (xpath.indexOf("*/") == 0) {
        xpath = xpath.substring(2);
        com.spikesource.tg4w.recorder.log("xpath started with */ : new xpath=" + xpath);

        // just make sure that there is no more objects to find
        var object2find = xpath;
        if (xpath.indexOf("/") != -1) {
            object2find = xpath.substring(0, xpath.indexOf("/"));
            xpath = xpath.substring(object2find.length + 1);
        } else {
            // no more.
            xpath = "";
        }

        com.spikesource.tg4w.recorder.log("xpath started with */ : object2find=" + object2find);

        return this.tg4w_default_getObject(this.findChild(obj, parentDocument, object2find, true), parentDocument, xpath);
    } else {
        var object2find = xpath.substring(0, xpath.indexOf("/"));
        com.spikesource.tg4w.recorder.log("object2find=" + object2find);
        xpath = xpath.substring(object2find.length + 1);
        return this.tg4w_default_getObject(this.findChild(obj, parentDocument, object2find, false), parentDocument, xpath);
    }
}

com.spikesource.tg4w.FindObject.prototype.evaluateCountPredicate = function(obj, elementName, predicate, recursive) {
    if (recursive || elementName == "TABLE") {
        var topLevelTags = this.getTopLevelTags(obj,elementName);
        if (elementName == "TABLE") {
            com.spikesource.tg4w.recorder.debug("child-expected:available=" + predicate.strValue() + ":" + topLevelTags.length);
        }
        return topLevelTags[predicate.getCount() - 1];
    } else {
        var children = this.getChildrenWithName(obj, elementName);

        if (children.length < predicate.getCount() - 1) {
            com.spikesource.tg4w.recorder.error("not enough children: " + children.length);
            return null;
        } else {
            com.spikesource.tg4w.recorder.log(predicate.strValue() + " found " + children.length + " children");
        }
        return children[predicate.getCount() - 1];
    }
}

com.spikesource.tg4w.FindObject.prototype.evaluatePredicate = function(obj, elementName, predicate, recursive, attrName) {
    var children = null;
    if (recursive || elementName == "TABLE") {
        children = this.getTopLevelTags(obj, elementName);
    } else { 
        children = this.getChildrenWithName(obj, elementName);
    }
    var i;

    com.spikesource.tg4w.recorder.log("evaluatePredicate: children.length " + children.length);

    for (i = 0; i < children.length; i++) {
        // try converting to lower case
        if (! children[i].hasAttribute(attrName)) {
            attrName = attrName.toLowerCase();
        }

        var compareValue;
        if (attrName == "cdata") {
            compareValue = this.getChildValue(children[i])
        } else {
            compareValue = children[i].getAttribute(attrName);
        }

        compareValue = com.spikesource.tg4w.tg4wcommon.trimStr(compareValue);

        com.spikesource.tg4w.recorder.log("comparing : " + compareValue + " with " + predicate.getValue(attrName));
        if (compareValue == predicate.getValue(attrName)) {
            return children[i];
        }
    }

    com.spikesource.tg4w.recorder.log("evaluatePredicate for " + obj + " elementName: " + elementName + " predicate: " + predicate + " recursive: " + recursive + " attrName: " + attrName + " returning null");
    return null;
}

com.spikesource.tg4w.FindObject.prototype.findChild = function(obj, parentDocument, xpathexpr, recursive) {
    if (obj != window.content.document) {
        if (obj.localName && obj.localName.toUpperCase() == "TABLE") { com.spikesource.tg4w.tg4wcommon.hilightIntermediateObject(obj, "red"); }
        if (obj.localName && obj.localName.toUpperCase() == "TD") { com.spikesource.tg4w.tg4wcommon.hilightIntermediateObject(obj, "green"); }
    }

    com.spikesource.tg4w.recorder.log("findChild called with:" + obj + " xpath:" + xpathexpr + " recursive:" + recursive);

    var indexOfOpen = xpathexpr.indexOf("[") + 1;
    var predicate = new com.spikesource.tg4w.Predicate(xpathexpr.substring(indexOfOpen, xpathexpr.lastIndexOf("]")));
    var elementName = xpathexpr.substring(0, xpathexpr.indexOf("["));

    if (predicate.isCount()) {
        // negate predicate by 1 to map array and xpath representations
        return this.evaluateCountPredicate(obj, elementName, predicate, recursive);
    } else if (predicate.isType()) {
        return this.evaluatePredicate(obj, elementName, predicate, recursive, "TYPE");
    } else if (predicate.isId()) {
        return parentDocument.getElementById(predicate.getIdValue());
    } else if (predicate.isName()) {
        return this.evaluatePredicate(obj, elementName, predicate, recursive, "NAME");
    } else if (predicate.isCdata()) {
        return this.evaluatePredicate(obj, elementName, predicate, recursive, "CDATA");
    } else if (predicate.isOfType("ALT")) {
        return this.evaluatePredicate(obj, elementName, predicate, recursive, "ALT");
    } else if (predicate.isOfType("SRC")) {
        return this.evaluatePredicate(obj, elementName, predicate, recursive, "SRC");
    } else if (predicate.isComplex()) {
        var children = null;
        if (recursive || elementName == "TABLE") {
            children = this.getTopLevelTags(obj, elementName);
        } else {
            children = this.getChildrenWithName(obj, elementName);
        }
        var cPred = predicate.getComplexPredicates();

        var childFound = null;
        var cc;
        for (cc = 0; cc < children.length; cc ++) {
            var satisfiesAll = true;
            com.spikesource.tg4w.recorder.debug("checking child: " + children[cc]);
            var pc;
            for (pc = 0; pc < cPred.length; pc++) {
                com.spikesource.tg4w.recorder.debug("    checking predicate: " + cPred[pc].strValue());
                if (cPred[pc].isValue()) {
                    com.spikesource.tg4w.recorder.debug("comparing value : " + cPred[pc].getValueValue() + " with " + com.spikesource.tg4w.tg4wcommon.trimStr(children[cc].value));
                } else if (cPred[pc].isType()) {
                    com.spikesource.tg4w.recorder.debug("comparing type : " + cPred[pc].getTypeValue() + " with " + children[cc].type);
                }

                if ((cPred[pc].isValue() && (com.spikesource.tg4w.tg4wcommon.trimStr(children[cc].value) == cPred[pc].getValueValue())) ||
                        (cPred[pc].isType() && (children[cc].getAttribute("type") == cPred[pc].getTypeValue())) ||
                        (cPred[pc].isName() && (children[cc].name == cPred[pc].getNameValue())) ||
                        (cPred[pc].isCdata() && (this.getChildValue(children[cc]) == cPred[pc].getCdataValue())) ||
                        (cPred[pc].isOfType("ALT") && (children[cc].alt == cPred[pc].getValue())) ||
                        (cPred[pc].isOfType("SRC") && (children[cc].src == cPred[pc].getValue()))
                        ) {
                } else {
                    //com.spikesource.tg4w.recorder.debug("did not match");
                    satisfiesAll = false;
                    break;
                }
            }

            if (satisfiesAll) {
                childFound = children[cc];
                break;
            }
        }

        if (childFound == null) {
            com.spikesource.tg4w.recorder.debug("did not find the child");
        } else {
            return(childFound);
        }
    } else {
        com.spikesource.tg4w.recorder.error("error finding object for predicate: " + predicate.str);
    }

    return null;
}

com.spikesource.tg4w.FindObject.prototype.getChildrenWithName = function(obj, tagname) {
    var retList = new Array();
    if (obj.hasChildNodes()) {
        com.spikesource.tg4w.recorder.log(obj + " has child nodes with name: " + tagname);
        var count;
        var i;
        for (i = 0, count = 0; i < obj.childNodes.length; i++) {
            var localname = obj.childNodes.item(i).localName;
            if (localname) {
                localname = localname.toUpperCase();
            }
            com.spikesource.tg4w.recorder.log("checking name: " + localname);
            if (localname == tagname) {
                retList[count] = obj.childNodes.item(i);
                count ++;
            }
        }
    } else {
        com.spikesource.tg4w.recorder.log(obj + " does NOT have child nodes with name: " + tagname);
    }
    return retList;
}

com.spikesource.tg4w.FindObject.prototype.testGetTopLevelTags = function() {
    var list = this.getTopLevelTags(document, "TABLE");
    var k;
    for (k = 0; k < list.length; k++) {
        com.spikesource.tg4w.tg4wcommon.hilightIntermediateObject(list[k], "green");
        var clist = this.getTopLevelTags(list[k], "INPUT");
        var l;
        for (l = 0; l < clist.length; l++) {
            com.spikesource.tg4w.tg4wcommon.hilightIntermediateObject(clist[l], "blue");
        }
    }
}

com.spikesource.tg4w.FindObject.prototype.getTopLevelTags = function(object, tagname) {
    var list = object.getElementsByTagName(tagname);

    var count = 0;
    var retList = new Array();

    com.spikesource.tg4w.recorder.log("original list is " + list.length);
    var i;
    for (i = 0; i < list.length; i++) {
        var curr = list[i];
        var originalCurr = curr;

        if (curr == object) {
            break;
        }

        if (i == 0) {
            com.spikesource.tg4w.tg4wcommon.hilightIntermediateObject(originalCurr, "yellow");
            retList[count ++] = originalCurr;
            continue;
        }
        
        var isChild = false;
        while (curr != null) {
            curr = curr.parentNode;
            if (curr == retList[count - 1]) { isChild = true; }
        }

        if (! isChild) {
            retList[count ++] = originalCurr;
        } else {
            // com.spikesource.tg4w.tg4wcommon.hilightIntermediateObject(originalCurr, "yellow");
        }
    }

    com.spikesource.tg4w.recorder.log("final list is " + retList.length);
    return retList;
}

/** 
 * Returns the text value for a node.
 * Cluttered with statements to help backward compatibility!
 * Prior  to 0.43.0, the string returned could have had carriage returns and spaces
 * After 0.43.0, i am trimming the values to have som consistancy
 * @param node node to convert to string
 * @return string representation
 */
com.spikesource.tg4w.FindObject.prototype.getChildValue  = function(node) {
    var version = com.spikesource.tg4w.recorder.loadedFileVersion;
    if (version >= "0.43.0") {
        return this.getChildValue_0_43_0(node);
    } else {
        return this.getChildValue_old_deprecated(node);
    }
}

com.spikesource.tg4w.FindObject.prototype.getChildValue_old_deprecated  = function(node) {
    var elem = node;

    if (elem.hasChildNodes()) {
        var retStr = "";
        var cnc;
        for (cnc = 0; cnc < elem.childNodes.length; cnc ++) {
            retStr += getChildValue_old_deprecated(elem.childNodes.item(cnc));
        }
        return retStr;
    } else {
        return elem.nodeValue;
    }

    return null;
}

com.spikesource.tg4w.FindObject.prototype.getChildValue_0_43_0  = function(node) {
    var elem = node;

    if (elem.hasChildNodes()) {
        var retStr = "";
        var cnc;
        for (cnc = 0; cnc < elem.childNodes.length; cnc ++) {
            var childVal = this.getChildValue_0_43_0(elem.childNodes.item(cnc));
            if (childVal != "") {
                retStr += " " + childVal;
            }
        }
        return com.spikesource.tg4w.tg4wcommon.trimStr(retStr);
    } else {
        var nodeValue = elem.nodeValue;
        if (nodeValue == null) {
            return "";
        }  else {
            return com.spikesource.tg4w.tg4wcommon.trimStr(nodeValue);
        }
    }

    return "";
}

com.spikesource.tg4w.FindObject.prototype.tg4w_default_getXpath = function(obj, suffix) {
    if (obj == null) {
        return suffix;
    }

    if (obj.localName && obj.localName.toUpperCase() == "A") {
        var path = null;
        if (!com.spikesource.tg4w.tg4woptions.ignoreXpathId() && obj.id) {
            path = "A[@ID=\"" + com.spikesource.tg4w.tg4wcommon.escapeCharacters(obj.id) + "\"]";
        } else {
            var childValue = com.spikesource.tg4w.tg4wcommon.trimStr(this.getChildValue(obj));
            if (childValue == null || childValue == "" || childValue == "null" || childValue == "undefined") {
                path = this.tg4w_default_getXpath(obj.parentNode, "A[" + this.countTags(obj, "A") + "]");
            } else {
                path = this.tg4w_default_getXpath(obj.parentNode, "A[@CDATA=\"" + com.spikesource.tg4w.tg4wcommon.escapeCharacters(childValue) + "\"]");
            }
        }
        if (suffix != "" && suffix != "*/") {
            path = path + "/" + suffix;
        }
        return path;
    } else if (obj.localName && (obj.localName.toUpperCase() == "INPUT" || obj.localName.toUpperCase() == "SELECT" || obj.localName.toUpperCase() == "TEXTAREA" || obj.localName.toUpperCase() == "BUTTON")) {
        // try find a form for the element
        var form = obj;
        while (form != null && form.localName && form.localName.toUpperCase() != "FORM") {
            form = form.parentNode;
        }

        var inputXpath = "";

        if (!com.spikesource.tg4w.tg4woptions.ignoreXpathId() && obj.id) {
            inputXpath = obj.localName.toUpperCase() + "[@ID=\"" + com.spikesource.tg4w.tg4wcommon.escapeCharacters(obj.id) + "\"]";
        } else {
            if (obj.type == "button" || obj.type == "submit" || obj.type == "radio" || obj.type == "image" || obj.type == "file" || obj.type == "reset") {
                if (obj.hasAttribute("name")) {
                    inputXpath = obj.localName.toUpperCase() + "[@NAME=\"" + obj.getAttribute("name") + "\"";
                } else if (obj.hasAttribute("type")) {
                    inputXpath = obj.localName.toUpperCase() + "[@TYPE=\"" + obj.getAttribute("type") + "\"";
                }

                // if the input type is a file, don't copy the contents
                if (obj.type != "file" && obj.hasAttribute("value")) {
                    inputXpath = inputXpath + " and @VALUE=\"" + com.spikesource.tg4w.tg4wcommon.escapeCharacters(obj.value) + "\"]";
                } else {
                    // close the [ opened before
                    inputXpath = inputXpath + "]";
                }
            } else {
                if (obj.localName.toUpperCase() == "SELECT" || obj.localName.toUpperCase() == "TEXTAREA") {
                    inputXpath = obj.localName.toUpperCase() + "[@NAME=\"" + com.spikesource.tg4w.tg4wcommon.escapeCharacters(obj.name) + "\"]";
                } else {
                    // this might be a text or a password
                    var objTypePredicate = "";
                    if (obj.hasAttribute("type")) {
                        objTypePredicate = "@TYPE=\"" + obj.getAttribute("type") + "\" and ";
                    }

                    inputXpath = obj.localName.toUpperCase() + "[" +  objTypePredicate + "@NAME=\"" + com.spikesource.tg4w.tg4wcommon.escapeCharacters(obj.name) + "\"]";
                }
            }
        }

        // if a form is found, construct xpath based on that
        if (form != null && form.localName && form.localName.toUpperCase() == "FORM") {

            var recursivePath = "";
            if (obj.parentNode.localName.toUpperCase() != "FORM") {
                // if immediate parent is not a form,
                recursivePath = "*/"
            }

            if (form.id) {
                return "*/FORM[@ID=\"" + form.id + "\"]/" + recursivePath + inputXpath;
            } else if (form.name) {
                return "*/FORM[@NAME=\"" + form.name + "\"]/" + recursivePath + inputXpath;
            } else {
                return "*/FORM[" + this.getFormCount(form) + "]/" + recursivePath + inputXpath;
            }
        } else {
            // if there is no form, just do the regular xpath stuff
            return this.tg4w_default_getXpath(obj.parentNode, inputXpath);
        }
    } else if (obj.localName && obj.localName.toUpperCase() == "IMG") {
        if (!com.spikesource.tg4w.tg4woptions.ignoreXpathId() && obj.id) {
            return this.tg4w_default_getXpath(obj.parentNode, "IMG[@ID=\"" + com.spikesource.tg4w.tg4wcommon.escapeCharacters(com.spikesource.tg4w.tg4wcommon.trimStr(obj.id)) + "\"]");
        } else {
            if (obj.alt != null && obj.alt != "") {
                return this.tg4w_default_getXpath(obj.parentNode, "IMG[@ALT=\"" + com.spikesource.tg4w.tg4wcommon.escapeCharacters(com.spikesource.tg4w.tg4wcommon.trimStr(obj.alt)) + "\"]");
            } else {
                return this.tg4w_default_getXpath(obj.parentNode, "IMG[@SRC=\"" + com.spikesource.tg4w.tg4wcommon.escapeCharacters(com.spikesource.tg4w.tg4wcommon.trimStr(obj.src)) + "\"]");
            }
        }
    } else if (obj.localName && (obj.localName.toUpperCase() == "TD" || obj.localName.toUpperCase() == "TH")) {
        if (!obj.id || com.spikesource.tg4w.tg4woptions.ignoreXpathId()) {
            return this.tg4w_default_getXpath(obj.parentNode, obj.localName.toUpperCase() + "[" + this.countTags(obj, obj.localName.toUpperCase()) + "]/" + suffix);
        } else {
            return obj.localName.toUpperCase() + "[@ID=\"" + obj.id + "\"]/" + suffix;
        }
    } else if (obj.localName && obj.localName.toUpperCase() == "TR") {
        if (!obj.id  || com.spikesource.tg4w.tg4woptions.ignoreXpathId()) {
            return this.tg4w_default_getXpath(obj.parentNode, "TR[" + this.countTags(obj, "TR") + "]/" + suffix);
        } else {
            return "TR[@ID=\"" + obj.id + "\"]/" + suffix;
        }
    } else if (obj.localName && obj.localName.toUpperCase() == "TABLE") {
        if (!obj.id || com.spikesource.tg4w.tg4woptions.ignoreXpathId()) {
            if (false && this.isKnownContainer(obj.parentNode.localName.toUpperCase())) {
                return this.tg4w_default_getXpath(obj.parentNode, "TABLE[" + this.countTags(obj, "TABLE") + "]/" + suffix);
            } else {
                return this.tg4w_default_getXpath(obj.parentNode, "TABLE[" + this.getTopLevelTableCount(obj) + "]/" + suffix);
            }
        } else {
            return "TABLE[@ID=\"" + obj.id + "\"]/" + suffix;
        }
    } else if (obj.localName && obj.localName.toUpperCase() == "TBODY") {
        return this.tg4w_default_getXpath(obj.parentNode, "TBODY[1]/" + suffix);
    } else if (obj.localName && obj.localName.toUpperCase() == "THEAD") {
        return this.tg4w_default_getXpath(obj.parentNode, "THEAD[1]/" + suffix);
    } else if (obj.localName && obj.localName.toUpperCase() == "DIV") {
        com.spikesource.tg4w.recorder.log("adding div to xpath suffix:" + suffix);
        if (!obj.id  || com.spikesource.tg4w.tg4woptions.ignoreXpathId()) {
            return this.tg4w_default_getXpath(obj.parentNode, "DIV[" + this.countTags(obj, "DIV") + "]/" + suffix);
        } else {
            return "DIV[@ID=\"" + obj.id + "\"]/" + suffix;
        }
    } else {
        if (suffix.indexOf("*/") == 0) {
            return this.tg4w_default_getXpath(obj.parentNode, suffix);
        } else {
            return this.tg4w_default_getXpath(obj.parentNode, "*/" + suffix);
        }
    }
}

com.spikesource.tg4w.FindObject.prototype.isKnownContainer = function(tagname) {
    if (tagname == "TD" || tagname == "TABLE") {
        return true;
    } else {
        return false;
    }
}

com.spikesource.tg4w.FindObject.prototype.countTags = function(obj, tagname) {
    var children = obj.parentNode.childNodes;
    var count = 1;
    var i;
    for (i = 0; i < children.length; i++) {
        var child = children.item(i);
        if (child == obj) {
            break;
        } else if (child.localName && child.localName.toUpperCase() == tagname) {
            count ++;
        }
    }
    return count;
}

com.spikesource.tg4w.FindObject.prototype.getFormCount = function(form) {
    forms = window.content.document.forms;
    var i;
    for (i = 0; i < forms.length; i++) {
        if (forms[i] == form) {
            return i + 1;
        }
    }
    return -1;
}

com.spikesource.tg4w.FindObject.prototype.getTopLevelTableCount = function(table) {
    var list = this.getTopLevelTags(this.getKnownParent(table), "TABLE");
    var i;
    for (i = 0; i < list.length; i ++) {
        if (list[i] == table) {
            return i + 1;
        }
    }

    com.spikesource.tg4w.recorder.error("topLevelTableCount: could not get self!");
    return 9999;
}

com.spikesource.tg4w.FindObject.prototype.getKnownParent = function(table) {
    table = table.parentNode;

    while (table.parentNode != null && table.localName.toUpperCase() != "TABLE" && table.localName.toUpperCase() != "TD") {
        table = table.parentNode;
    }

    return table;
}


/* 
* ================================================
* frame support functions
* ==================================================
*/

/**
* @author Alessio Pace
*/
com.spikesource.tg4w.FindObject.prototype.getFrameSequenceFromFrameWindow = function(currentFrameWindow){
    var frameSequence = new Array();
    var currentWin = currentFrameWindow;

    /* 
     travel up the frame tree while the current window frame is not the 'top' window frame 
     XXX: 'currentFrameWindow.top'  is required instead of just 'top' otherwise the function loops!!
    */
    while(currentWin!=currentFrameWindow.top){
        var parentWin = currentWin.parent;
        
        //com.spikesource.tg4w.recorder.log('Parent win has: #' + parentWin.frames.length + ' frames');
        
        parentWinFrames = parentWin.frames; // DOM compliant??
        for(var i=0; i<parentWinFrames.length; i++){
            var nextFrame = parentWinFrames[i];
            if(nextFrame == currentWin){
                frameSequence.push(nextFrame.name);
            }
        }
        
        currentWin = parentWin;
    }
  
    return frameSequence;

}

/* higher level function which uses getFrameSequenceFromFrameWindow */
com.spikesource.tg4w.FindObject.prototype.getFrameSequenceFromEventTarget = function(eventTarget){
	
	/* document where the event originated */
    var docContainingEvent = eventTarget.ownerDocument;
    var winContaingEvent;
    var frameSequence;
    
    /* debug */
    /*
    com.spikesource.tg4w.recorder.log("[getFrameSequenceFromEventTarget] DOM document containing event: "
    + docContainingEvent + "\n" + docContainingEvent.documentElement.innerHTML);
    */
    
    /* DOES NOT WORK->>  winContainingEvent = docContainingEvent.defaultView.window; */
    var winContainingEvent = docContainingEvent.defaultView;
    	
    if(winContainingEvent){
        
    	/* 
        com.spikesource.tg4w.recorder.log("[getFrameSequenceFromEventTarget] DOM window containing event: " + winContainingEvent); 
         */
    	frameSequence = this.getFrameSequenceFromFrameWindow(winContainingEvent);
    	/* debug */
        com.spikesource.tg4w.recorder.log("[getFrameSequenceFromEventTarget] DOM window frames name sequence: " + frameSequence);
    }
    
    return frameSequence;
}


/**
* @author Alessio Pace
*/
com.spikesource.tg4w.FindObject.prototype.locateFrameWindow = function(windowTopFrame, frameSequence, winref){
    com.spikesource.tg4w.recorder.debug("locateFrameWindow: winref = '" + winref + "'");
    if (winref != ".") {
        com.spikesource.tg4w.recorder.debug("finding window with name: " + winref);
        var openWindow = com.spikesource.tg4w.recorder.windowObserver.getWindow(winref);
        if (openWindow != null) {
            // if this is a open window, looks like there is always a top-level-frame
            windowTopFrame = openWindow.content;
            com.spikesource.tg4w.recorder.debug("found window with name: " + winref);
        } else {
            com.spikesource.tg4w.recorder.debug("could not find window with name: " + winref);
        }
    }

    if(!frameSequence){
        return windowTopFrame;
    }
    
    var currentWin = windowTopFrame;	

    /* safe copy frame sequence to use it like a LIFO later */
    var frameSequenceCopy = new Array().concat(frameSequence);

    /* debug */
    /*
    com.spikesource.tg4w.recorder.log("[locateFrameWindow] Top DOM window frame passed: " + currentWin 
    + "\n" + currentWin.document.documentElement.innerHTML);
    */
    
    /* traverse the tree while there are more elements in the frameSequence */
    while(frameSequenceCopy.length > 0){
        var nextFrameName = frameSequenceCopy.pop();

        /*
        com.spikesource.tg4w.recorder.log("[locateFrameWindow] Current DOM window is: " + currentWin
        + "\n" + currentWin.document.documentElement.innerHTML);
        */
        
        com.spikesource.tg4w.recorder.log('[locateFrameWindow] And will try to access sub frame with name: ' + nextFrameName);
        
        /* all sub frames at this level */
        var allFrames = currentWin.frames;

        /* DO NOT TRY TO INDEX allFrames like an associative Array:
         * ex: allFrame['a_frame_name'] does *not* work!!
         * I lost a whole afternoon debugging it
         */

        /* iterate over all sub frames for the one matching the name */
        for(var i=0; i<allFrames.length; i++){
            var subFrameName = allFrames[i].name
            /* debug */
            com.spikesource.tg4w.recorder.log('[locateFrameWindow] Comparing ' + subFrameName + ' with ' + nextFrameName);
            if(subFrameName == nextFrameName){
                /* this is the next currentWin */
                currentWin = allFrames[i];
                com.spikesource.tg4w.recorder.log('[locateFrameWindow] found the frame ' + nextFrameName);
                break;
            }
        }
        
    }

    /* debug */
    /*
    com.spikesource.tg4w.recorder.log("[locateFrameWindow] Returning located window frame: " + currentWin 
    + "\n" + currentWin.document.documentElement.innerHTML);
    */

    return currentWin;
}

