/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See www.spikesource.com/license.html)
 *
 * author: Vinay Srini (vsrini@spikesource.com)
 */

com.spikesource.tg4w.Common = function() {
    this.TG4W_LINE_BREAK = "\n";
    this.TG4W_CDATA_OPEN = "<![CDATA[ ";
    this.TG4W_CDATA_CLOSE = " ]]>";

    this.TG4W_RECORDING_PAUSED = "recording";
    this.TG4W_PLAYING_PAUSED = "playing";
    this.TG4W_NOT_PAUSED = "null";
    this.TG4W_GUID = "{3c20433a-61bc-42fe-831d-415860e17283}";

    this.TG4W_promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
    this.TG4W_bundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
    this.TG4W_localize = this.TG4W_bundleService.createBundle("chrome://recorder/locale/overlay.properties");
}

com.spikesource.tg4w.Common.prototype.encodeUrl = function (url) {
    return escape(url)
        .replace(/\+/g, '%2B')
        .replace(/\"/g,'%22')
        .replace(/\'/g, '%27')
        .replace(/\//g,'%2F');
}

com.spikesource.tg4w.Common.prototype.getContents = function (filename) {
    return this.getContentsAsArray(filename).join("\n");
}

com.spikesource.tg4w.Common.prototype.getContentsAsArray = function (filename) {
    var file2load = Components.classes["@mozilla.org/file/local;1"]
        .createInstance(Components.interfaces.nsILocalFile);
    file2load.initWithPath(filename);

    // open an input stream from file
    var istream = Components.classes["@mozilla.org/network/file-input-stream;1"]
        .createInstance(Components.interfaces.nsIFileInputStream);
    istream.init(file2load, 0x01, 0444, 0);
    istream.QueryInterface(Components.interfaces.nsILineInputStream);

    // read lines into array
    var line = {}, lines = [], hasmore;
    do {
        var hasmore = istream.readLine(line);
        lines.push(line.value);
    } while(hasmore);

    istream.close();

    return lines;
}

com.spikesource.tg4w.Common.prototype.createDirectory = function (dirpath) {
    var path2create = Components.classes["@mozilla.org/file/local;1"]
        .createInstance(Components.interfaces.nsILocalFile);

    try {
        path2create.initWithPath(dirpath);
        if (! path2create.exists()) {
            path2create.create(1, 0777);
        }
    } catch (e) {
        var recorder = com.spikesource.tg4w.recorder;
        recorder.error("dir '" + dirpath + "' could not be created. Reason: " + e);
        return null;
    }
    return path2create;
}

com.spikesource.tg4w.Common.prototype.getRelativeFilePath = function (relativeFile, filepath) {
    var relativeFileObj = this.getFileObject(relativeFile);
    if (relativeFileObj.exists()) {
        if (relativeFileObj.isDirectory()) {
            relativeFileObj.append(filepath);
            return relativeFileObj.path;
        } else if (relativeFileObj.isFile()) {
            var rparent = relativeFileObj.parent;
            rparent.append(filepath);
            return rparent.path;
        }
    }
    return null;
}

com.spikesource.tg4w.Common.prototype.fileExists = function (filepath) {
    var file2load = Components.classes["@mozilla.org/file/local;1"]
        .createInstance(Components.interfaces.nsILocalFile);
    try {
        if (filepath.length > 9 && filepath.substring(0, 9) == "TG4W_TEST") {
            filepath = this.getTestFile(filepath.substring(10)).path;
        } else if (filepath.length > 9 && filepath.substring(0, 8) == "TEST_DIR") {
            filepath = this.getFileRelativeToFileLoaded(filepath.substring(9)).path;
        }
        file2load.initWithPath(filepath);
    } catch (e) {
        var recorder = com.spikesource.tg4w.recorder;
        recorder.debug("file '" + filepath + "' does not exist");
        return false;
    }
    return file2load.exists();
}

com.spikesource.tg4w.Common.prototype.getFileObject = function (filepath) {
    var file2load = Components.classes["@mozilla.org/file/local;1"]
        .createInstance(Components.interfaces.nsILocalFile);
    if (filepath.length > 9 && filepath.substring(0, 9) == "TG4W_TEST") {
        filepath = this.getTestFile(filepath.substring(10)).path;
    } else if (filepath.length > 9 && filepath.substring(0, 8) == "TEST_DIR") {
        filepath = this.getFileRelativeToFileLoaded(filepath.substring(9)).path;
    }
    file2load.initWithPath(filepath);
    return file2load;
}

com.spikesource.tg4w.Common.prototype.getFileRelativeToFileLoaded = function (filename) {
    if (com.spikesource.tg4w.recorder.loadedFileName != null) {
        var path = this.getRelativeFilePath(com.spikesource.tg4w.recorder.loadedFileName, filename);
        return this.getFileObject(path);
    } else {
        return null;
    }
}

com.spikesource.tg4w.Common.prototype.getTestFiles = function () {
    var testsDir = this.getRecorderDir("tests");
    var entries = testsDir.directoryEntries;
    var files = [];
    while(entries.hasMoreElements())
    {
        var entry = entries.getNext();
        entry.QueryInterface(Components.interfaces.nsIFile);
        if (entry.path.indexOf(".xml") != -1) {
            files.push(entry.path);
        }
    }
    return files;
}

com.spikesource.tg4w.Common.prototype.getTestFile = function (filename) {
    var testsDir = this.getRecorderDir("tests");
    testsDir.append(filename);
    return testsDir;
}

com.spikesource.tg4w.Common.prototype.getContentFile = function (filename) {
    var contentDir = this.getRecorderDir("content");
    contentDir.append(filename);
    return contentDir;
}

com.spikesource.tg4w.Common.prototype.getRecorderDir = function (dirname) {
    var file = Components.classes["@mozilla.org/file/directory_service;1"]
        .getService(Components.interfaces.nsIProperties)
        .get("ProfD", Components.interfaces.nsILocalFile);

    file.append("extensions");
    file.append(this.TG4W_GUID);
    file.append("chrome");
    file.append("recorder");
    file.append(dirname);

    return file;
}

com.spikesource.tg4w.Common.prototype.basename = function (filename) {
    var index = filename.lastIndexOf("/");
    if (index == -1) {
        // for windows
        var index = filename.lastIndexOf("\\");
    }

    if (index != -1) {
        return filename.substring(index + 1);
    } else {
        return filename;
    }
}

com.spikesource.tg4w.Common.prototype.localizeString = function (str) {
    try {
        return this.TG4W_localize.GetStringFromName(str);
    } catch (e) {
        var recorder = com.spikesource.tg4w.recorder;
        recorder.debug("Not Localized:" + str);
        return str;
    }
}

com.spikesource.tg4w.Common.prototype.hilightObject = function (object, color, force) {
    if (force || com.spikesource.tg4w.tg4woptions.doHilightObjects()) {
        object.style.setProperty("border", "2px " + color + " solid;", 1);
    }
}

com.spikesource.tg4w.Common.prototype.hilightIntermediateObject = function (object, color, force) {
    if (force || com.spikesource.tg4w.tg4woptions.doHilightIntermediateObjects()) {
        this.hilightObject(object, color, force);
    }
}

com.spikesource.tg4w.Common.prototype.trimStr = function (sInString) {
    try {
        sInString = sInString.replace( /^\s+/g, "" );// strip leading
        sInString = sInString.replace( /^\n+/g, "" );// strip leading
        sInString = sInString.replace( /^\r+/g, "" );// strip leading
        return sInString.replace( /\s+$/g, "" );// strip trailing
    } catch (e) {
        var recorder = com.spikesource.tg4w.recorder;
        recorder.log(sInString + " had error trimming.");
        return sInString;
    }
}

com.spikesource.tg4w.Common.prototype.testEscapeChars = function (testStr) {
    var orig = "http://www.spikesource.com";
    var recorder = com.spikesource.tg4w.recorder;
    recorder.error(orig + " = " + this.unEscapeCharacters(escapeCharacters(orig)));
    recorder.error(testStr + " = " + this.unEscapeCharacters(escapeCharacters(testStr)));
}

com.spikesource.tg4w.Common.prototype.unEscapeCharacters = function (str) {
    str = str.replace(/\\"/g, "\"");
    str = str.replace(/\\/g, "/");
    return str;
}

com.spikesource.tg4w.Common.prototype.escapeCharacters = function (str) {
    str = str.replace(/\"/g, "\\\"");
    str = str.replace(/\//g, "\\");
    return str;
}

com.spikesource.tg4w.Common.prototype.isBlank  = function (val){
    if (val == null) { return true; }
    for (var i = 0; i < val.length; i++) {
        if ((val.charAt(i)!=' ')
            && (val.charAt(i)!="\t")
            && (val.charAt(i)!="\n")
            && (val.charAt(i)!="\r")) {
            return false;
        }
    }
    return true;
}

com.spikesource.tg4w.Common.prototype.isInteger = function (val){
    if (this.isBlank(val)) { return false; }
    for (var i=0;i<val.length;i++) {
        if (!this.isDigit(val.charAt(i))){ return false; }
    }
    return true;
}

com.spikesource.tg4w.Common.prototype.isDigit = function (num) {
    if (num.length>1){ return false; }
    var string="1234567890";
    if (string.indexOf(num)!=-1) { return true; }
    return false;
}

com.spikesource.tg4w.Common.prototype.findPosX = function (obj)
{
    var curleft = 0;
    if (obj.offsetParent)
    {
        while (obj.offsetParent)
        {
            curleft += obj.offsetLeft
                obj = obj.offsetParent;
        }
    }
    else if (obj.x)
        curleft += obj.x;
    return curleft;
}

com.spikesource.tg4w.Common.prototype.findPosY = function (obj)
{
    var curtop = 0;
    if (obj.offsetParent)
    {
        while (obj.offsetParent)
        {
            curtop += obj.offsetTop
                obj = obj.offsetParent;
        }
    }
    else if (obj.y)
        curtop += obj.y;
    return curtop;
}

com.spikesource.tg4w.Common.prototype.getAttribute = function (node, attrName) {
    if (node.hasAttribute(attrName)) {
        return node.getAttribute(attrName);
    } else {
        return "";
    }
}


/**
* Be carefull, the name of this function is reserved !!!
* Bruno V. 23/11/2005
*/
com.spikesource.tg4w.Common.prototype.getChildValue_ = function (node, childName) {
    var elem = node;
    if (childName != null) {
        elem = node.getElementsByTagName(childName).item(0);
    }

    /* TODO: try/catch if 'elem' if no elem is found otherwise the execution
     * dies!
     */
    var recorder = com.spikesource.tg4w.recorder;
    try {
        recorder.log(elem.localName + " " + elem.hasChildNodes());
        if (elem.hasChildNodes()) {
            return elem.childNodes.item(0).nodeValue;
        } else {
            return elem.nodeValue;
        }
    } catch (elemErr) {
        recorder.log("getChildValue caught exception: " + elemErr);
    }

    return "";
}

com.spikesource.tg4w.Common.prototype.createTg4wArray = function(a) {
    var myarr = new Array();
    this.extendArray(myarr);
    if (a) {
        for (var i = 0; i < a.length; i ++) {
            myarr[i] = a[i];
        }
    }
    return myarr;
}

com.spikesource.tg4w.Common.prototype.extendArray = function(a) {
    a.peek = function() {
        return this[this.length - 1];
    };

    a.contains_tg4w = function (element) {
        return this.containsAt_tg4w(element, 0) != -1;
    };

    a.containsAt_tg4w = function (element, searchFrom) {
        if (!searchFrom || searchFrom < 0) {
            searchFrom = 0;
        }
        for (var i = searchFrom; i < this.length; i++) {
            if (this[i] == element) {
                return i;
            }
        }
        return -1;
    };

    a.removeItem_tg4w = function (element) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == element) {
                return this.splice(i, 1);
            }
        }
        return false;
    };

    a.removeItems_tg4w = function (arr) {
        while (arr.length > 0) {
            var index = this.containsAt_tg4w(arr.shift())
                if (index != -1) {
                    this.splice(index, 1);
                }
        }
    };

    a.duplicate_tg4w = function (element) {
        var _dup = com.spikesource.tg4w.tg4wcommon.createTg4wArray();
        for (var i = 0; i < this.length; i++) {
            _dup[i] = this[i];
        }
        return _dup;
    };

    a.intersect_tg4w = function (arr2) {
        var _arr1 = this.duplicate_tg4w();
        var _arr2 = arr2.duplicate_tg4w();
        var _intersection = com.spikesource.tg4w.tg4wcommon.createTg4wArray();

        var matched = com.spikesource.tg4w.tg4wcommon.createTg4wArray();

        for (var i = 0; i < _arr1.length; i ++) {
            for (var j = 0; j < _arr2.length; j ++) {
                if (_arr1[i] == _arr2[j]) {
                    if (! matched.contains_tg4w(j)) {
                        matched.push(j);
                        _intersection.push(_arr1[i]);
                        break;
                    }
                }
            }
        }
        return _intersection;
    };

    a.is_tg4w_array = function() {
        return true;
    }
}

function Tg4wContainer(actionIndex) {
    this.actionIndex = actionIndex;
    var recorder = com.spikesource.tg4w.recorder;
    this.action = recorder.getActions()[this.actionIndex];

    // debug - remove
    this.tmpcount = 0;
}

Tg4wContainer.prototype.convertOperatorCode = function(code) {
    if (code == "eq") { return "==";
    } else if (code == "ne") { return "!=";
    } else if (code == "gt") { return ">";
    } else if (code == "ge") { return ">=";
    } else if (code == "lt") { return "<";
    } else if (code == "le") { return "<=";
    }
}

Tg4wContainer.prototype.evaluateFalse = function() {
    return !this.evaluateTrue();
}

Tg4wContainer.prototype.evaluateTrue = function() {
    var recorder = com.spikesource.tg4w.recorder;
    var jsSnip = recorder.getEvalPrefixJS();
    if (this.action.action.indexOf("loop-condition") == 0) {
        var match = this.action.action.match(/^loop-condition-(.*)$/);
        jsSnip += ";" + this.action.xpath + " " 
            + this.convertOperatorCode(match[1]) + " "
            + this.action.value;
    } else if (this.action.action.indexOf("condition") == 0) {
        var match = this.action.action.match(/^condition-(.*)$/);
        jsSnip += ";" + this.action.xpath + " "
            + this.convertOperatorCode(match[1]) + " "
            + this.action.value;
    } else if (this.action.action.indexOf("loop-dataset") == 0) {
        var match = this.action.action.match(/^loop-dataset-(.*)-(.*)$/);
        var dsname = match[1];
        var ds = recorder.tg4wdh.getDataset(dsname);
        // important! initial loopCount is -1
        recorder.tg4wdh.incrementLoopCount(dsname);
        evalSuccessVal = !(ds.loopCount >= recorder.tg4wdh.getDataset(dsname).length());
        if (!evalSuccessVal) {
            ds.reset();
            recorder.debug("finished loop for :" + dsname + ". dataset is reset.");
            return false;
        } else {
            recorder.debug("looping :" + (ds.loopCount + 1) + "/" 
                + recorder.tg4wdh.getDataset(dsname).length() + ", set:" + dsname);
            return true;
        }
    }

    var evalValue = eval(jsSnip);
    return evalValue;
}

Tg4wContainer.prototype.isLoop = function() {
    return (this.action.action.indexOf("loop-") == 0);
}

Tg4wContainer.prototype.findEnd = function() {
    var recorder = com.spikesource.tg4w.recorder;
    var actions = recorder.getActions();
    var stackDepth = 0;
    for (var i = this.actionIndex + 1; i < actions.length; i ++) {
        var a = actions[i];
        if (a.isEndContainer()) {
            if (stackDepth == 0) { return i; }
            else { stackDepth --; }
        } else if (a.isStartContainer()) {
            stackDepth ++;
        }
    }
}

com.spikesource.tg4w.Common.prototype.flushDnsCache = function() {
    var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
    ioService.offline = true;

    var cacheService = Components.classes["@mozilla.org/network/cache-service;1"].getService(Components.interfaces.nsICacheService) ;
    cacheService.evictEntries(Components.interfaces.nsICache.STORE_ANYWHERE);
    ioService.offline = false;
}

com.spikesource.tg4w.Common.prototype.resolveIpAddress = function(hostname) {
    var dnsService = Components.classes["@mozilla.org/network/dns-service;1"].
        getService(Components.interfaces.nsIDNSService);

    var dataListener = {
        data:"",
        QueryInterface : function(aIID) {
             if (aIID.equals(Components.interfaces.nsIDNSListener) || aIID.equals(Components.interfaces.nsISupports)) {
                 return this;
             }
             throw Components.results.NS_NOINTERFACE;
             Components.returnCode = Components.results.NS_ERROR_NO_INTERFACE;
             return null;
         },
        onLookupComplete: function( aRequest, aRecord, aStatus ) {
            this.data = aRecord.getNextAddrAsString();
            listener.finished(this.data);
        }
    };

    try {
        var dns = dnsService.resolve(hostname, null, dataListener, null);
        while(dns.hasMore()) {
            return dns.getNextAddrAsString();
        }
    } catch(ex){
        return "error:" + ex;
    }
}
com.spikesource.tg4w.tg4wcommon = new com.spikesource.tg4w.Common();
