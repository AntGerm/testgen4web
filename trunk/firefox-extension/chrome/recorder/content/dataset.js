// Evaluate an XPath expression aExpression against a given DOM node
// or Document object (aNode), returning the results as an array
// thanks wanderingstan at morethanwarm dot mail dot com for the
// initial work.
com.spikesource.tg4w.Tg4wDatasetHandler = function() {
    this.datasets = {};
}

com.spikesource.tg4w.Tg4wDatasetHandler.prototype.tg4w_data_handler_evaluateXPath = function(aNode, aExpr) {
    var xpe = new XPathEvaluator();
    var nsResolver = xpe.createNSResolver(aNode.ownerDocument == null ?
            aNode.documentElement : aNode.ownerDocument.documentElement);
    var result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
    var found = [];
    var res;
    while (res = result.iterateNext())
        found.push(res);
    return found;
}

com.spikesource.tg4w.Tg4wDatasetHandler.prototype.deleteDataset = function(name) {
    delete this.datasets[name];
}

com.spikesource.tg4w.Tg4wDatasetHandler.prototype.loadDataset = function(name, xpath, filename, type, iterable) {
    if (!iterable) {
        iterable = "true";
    }
    this.datasets[name] = new com.spikesource.tg4w.Tg4wDataset(name, xpath, filename, type, iterable);
}

com.spikesource.tg4w.Tg4wDatasetHandler.prototype.reset = function() {
    for (i in this.datasets) {
        if (i && i != "undefined" && i != null && i != "null") {
            this.datasets[i].reset();
        }
    }
}

com.spikesource.tg4w.Tg4wDatasetHandler.prototype.node2text = function(obj) {
    // element
    var oChildren = obj.childNodes;
    // iterate
    var data = "";
    for (var i = 0; i < oChildren.length; i++) {
        // cache each child node in a temporary variable
        var oNode = oChildren.item(i);
        // *in this data set* each element node contained within the root element
        // contains a text node containing the desired data
        data += oNode.data;
    }
    return data;
}

com.spikesource.tg4w.Tg4wDatasetHandler.prototype.incrementLoopCount = function(name) {
    var recorder = com.spikesource.tg4w.recorder;
    var set = this.datasets[name];
    if (set && set.iterable == "true") {
        set.loopCount ++;
        recorder.showStatusCallback(recorder, "ds-update", name);
    }

}

com.spikesource.tg4w.Tg4wDatasetHandler.prototype.getDatasetNames = function() {
    var names = new Array();
    for (i in this.datasets) {
        if (i && i != "undefined" && i != null && i != "null") {
            names.push(i);
        }
    }
    return names;
}

com.spikesource.tg4w.Tg4wDatasetHandler.prototype.getDataFromDataset = function(name, xpath) {
    try {
        var ds = this.datasets[name];
        ds.initialize();

        if (ds && ds.type == "xml") {
            if (xpath == ".") {
                return this.node2text(ds.data[ds.loopCount]);
            } else {
                var obj = this.tg4w_data_handler_evaluateXPath(ds.data[ds.loopCount], xpath)[0];
                if (obj.nodeType == 1) {
                    return this.node2text(obj);
                } else if (obj.nodeType == 2) {
                    return obj.value;
                }
            }
        } else if (ds && ds.type == "csv") {
            // xpath will be used as variable
            // TODO: CODE HERE
            return ds.data[ds.loopCount][xpath];
        } else {
            alert("no such dataset: " + name);
            return null;
        }
    } catch (e) {
        alert("getDataFromDataset " + name + " var: " + xpath + " error:" + e);
        return null;
    }
}

com.spikesource.tg4w.Tg4wDatasetHandler.prototype.getDataset = function(name) {
    return this.datasets[name];
}

com.spikesource.tg4w.Tg4wDataset = function(name, xpath, filename, type, iterable) {
    var recorder = com.spikesource.tg4w.recorder;
    // data
    this.data = null;
    this.init = false;

    // static data
    this.name = name;
    this.xpath = xpath;
    this.type = type;
    this.filename = filename;

    // dynamic increment
    this.loopCount = -1;
    this.loadedFile = null;
    this.iterable = iterable;

    if (this.iterable == "false") {
        this.loopCount = 0;
    }

    if (this.type == "csv") {
        var dsnames = recorder.tg4wdh.getDatasetNames();
        for (var dsc = 0; dsc < dsnames.length; dsc++) {
            var ds = recorder.tg4wdh.getDataset(dsnames[dsc]);
            var headers = this.xpath.split(",");
            for (var x = 0; x < headers.length; x ++) {
                if (ds.containsVar(headers[x])) {
                    recorder.error("WARNING: duplicate variable name: [" 
                        + headers[x] + "] in datasets: [" 
                        + this.name + "] and [" + ds.name + "]");
                }
            }
        }
    }
}

com.spikesource.tg4w.Tg4wDataset.prototype.getXml = function(doc, indent) {
    var dsElem = doc.createElement("dataset");
    dsElem.setAttribute("id", this.name);
    dsElem.setAttribute("xpath", this.xpath);
    dsElem.setAttribute("file", this.filename);
    dsElem.setAttribute("type", this.type);
    dsElem.setAttribute("iterable", this.iterable);
    return dsElem;
}

com.spikesource.tg4w.Tg4wDataset.prototype.containsVar = function(varname) {
    if (this.type == "csv") {
        return ((this.xpath + ",").indexOf(varname+",") != -1);
    } else {
        return false;
    }
}

com.spikesource.tg4w.Tg4wDataset.prototype.length = function() {
    this.initialize();
    return this.data.length;
}

com.spikesource.tg4w.Tg4wDataset.prototype.initialize = function() {
    if (!this.init) {
        this._loadDataset();
        this.init = true;
    }
}

com.spikesource.tg4w.Tg4wDataset.prototype.reset = function() {
    var recorder = com.spikesource.tg4w.recorder;
    if (this.iterable == "true") {
        this.loopCount = -1;
    }
    recorder.showStatusCallback(recorder, "ds-update", name);
}

com.spikesource.tg4w.Tg4wDataset.prototype._loadDataset = function() {
    var recorder = com.spikesource.tg4w.recorder;
    try {
        var file = null;
        if (this.filename == "TG4W_ASK") {
            const nsIFilePicker = Components.interfaces.nsIFilePicker;

            var fp = Components.classes["@mozilla.org/filepicker;1"]
                .createInstance(nsIFilePicker);
            fp.init(window, "Select file to load", nsIFilePicker.modeOpen);
            fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);

            var rv = fp.show();
            if (rv == nsIFilePicker.returnOK) {
                file = fp.file;
            } else {
                return;
            }
        } else if (this.filename.length > 9 && this.filename.substring(0, 9) == "TG4W_TEST") {
            file = com.spikesource.tg4w.tg4wcommon.getTestFile(this.filename.substring(10));
        } else {
            file = com.spikesource.tg4w.tg4wcommon.getFileObject(this.filename);
        }
        
        var istream = Components.classes["@mozilla.org/network/file-input-stream;1"]
            .createInstance(Components.interfaces.nsIFileInputStream);
        try {
            istream.init(file, 0x01, 0444, 0);
        } catch (e) {
            alert("Error initializing file " + this.filename + " for dataset " + this.name + ". Check if the file exists, and has read permissions");
            return;
        }
        istream.QueryInterface(Components.interfaces.nsILineInputStream);

        if (this.type == "xml") {
            var domParser = new DOMParser();
            var doc = domParser.parseFromStream(istream, null, file.fileSize, "text/xml");
            this.data = (new com.spikesource.tg4w.Tg4wDatasetHandler())
                .tg4w_data_handler_evaluateXPath(doc.documentElement, this.xpath);
        } else if (this.type == "csv") {
            // TODO: write code to load csv
            var lines = com.spikesource.tg4w.tg4wcommon.getContentsAsArray(file.path);
            this.data = new Array();
            for (var lc = 0; lc < lines.length; lc++) {
                var line = lines[lc];
                var vars = line.split(",");
                var fields = this.xpath.split(",");
                var row = {};
                if (vars.length == fields.length) {
                    for (var fc = 0; fc < fields.length; fc ++) {
                        row[fields[fc]] = vars[fc];
                        recorder.log(fields[fc] + " = " + vars[fc]);
                    }
                    recorder.log("consumed line:" + line);
                } else {
                    recorder.log("WARNING: skipping line:" + line);
                }
                this.data.push(row);
            }
        }
    } catch (e) {
        alert("error loading dataset:" + e);
    }
}
