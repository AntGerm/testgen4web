if(!com) var com={};
if(!com.spikesource) com.spikesource = {};
if(!com.spikesource.tg4w) com.spikesource.tg4w={};

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

// basic wrapper for nsIXULTemplateResult
com.spikesource.tg4w.TemplateResult = function(aData) {
  this._data = aData;
  // just make a random number for the id
  this._id = Math.random(100000).toString();
}

com.spikesource.tg4w.TemplateResult.prototype = {
  QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIXULTemplateResult]),

  // private storage
  _data: null,

  // right now our results are flat lists, so no containing/recursion take place
  isContainer: false,
  isEmpty: true,
  mayProcessChildren: false,
  resource: null,
  type: "simple-item",

  get id() {
    return this._id;
  },

  // return the value of that bound variable such as ?name
  getBindingFor: function(aVar) {
    // strip off the ? from the beginning of the name
    var name = aVar.toString().slice(1);
    //dump("binding for :" + aVar + " " + this._data[name] + "\n");
    return this._data[name];
  },

  // return an object instead of a string for convenient comparison purposes
  // or null to say just use string value
  getBindingObjectFor: function(aVar) {
    return null;
  },

  // called when a rule matches this item.
  ruleMatched: function(aQuery, aRuleNode) { },

  // the output for a result has been removed and the result is no longer being used by the builder
  hasBeenRemoved: function() { }
};


// basic wrapper for nsISimpleEnumerator
com.spikesource.tg4w.TemplateResultSet = function(aArrayOfData) {
  this._index = 0;
  this._array = aArrayOfData;
}

com.spikesource.tg4w.TemplateResultSet.prototype = {
  QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsISimpleEnumerator]),

  hasMoreElements: function() {
    return this._index < this._array.length;
  },

  getNext: function() {
    return new com.spikesource.tg4w.TemplateResult(this._array[this._index++]);
  }
};


// The query processor class - implements nsIXULTemplateQueryProcessor
com.spikesource.tg4w.TemplateQueryProcessor = function() {
  // our basic list of data
  this._data = null; 
}



com.spikesource.tg4w.TemplateQueryProcessor.prototype = {
  QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIXULTemplateQueryProcessor]),
  classDescription: "TestGen4Web report query",
  classID: Components.ID("{7b6faa73-75ca-4258-8bbc-63eaa28badae}"),
  contractID: "@mozilla.org/xul/xul-query-processor;1?name=simpledata",

  getDatasource: function(aDataSources, aRootNode, aIsTrusted, aBuilder, aShouldDelayBuilding) {
      var file = Components.classes["@mozilla.org/file/directory_service;1"]
          .getService(Components.interfaces.nsIProperties)
          .get("ProfD", Components.interfaces.nsIFile);
      file.append("tg4w_test_reports.sqlite");

      var storageService = Components.classes["@mozilla.org/storage/service;1"]
          .getService(Components.interfaces.mozIStorageService);

      this.dbConn = storageService.openDatabase(file);

      var readableStringGenerator = this;
      readableStringGenerator.indent = 0;

      this.dbConn.createFunction("humanReadableAction", 3, function(arr) {
              try {
                  var a = arr.getString(0);
                  var x = arr.getString(1);
                  var v = arr.getString(2);
                  return readableStringGenerator.getReadableString(a, x, v);
              } catch (e) {
                  //dump("ERROR:" + e);
                return "ERR-" + arr;
              }
      });
      this.dbConn.createFunction("file_normalize", 1, function(arr) {
          try {
              var t = arr.getString(0);
              return t.split("/").reverse()[0];
          } catch (e) {
            return "Err"
          }
      });

      this.dbConn.createFunction("humanReadableDataChangeType", 1, function(arr) {
          try {
              var t = arr.getString(0);
              //dump("humanReadableAction:" + t);
              if (t == "ds-fetch") {
                return "fetch";
              } else if (t == "var-fetch") {
                return "fetch";
              } else if (t == "var") {
                return "set";
              } else if (t == "ds") {
                return "check";
              } else {
                return "L-" + t;
              }
          } catch (e) {
            return "Err"
          }
      });

      return [];
  },

    simplyfyXpath : function(xpath) {
        var xpathsplit = xpath.split("/");
        var pre = xpathsplit.pop();
        return pre;
    },

    calculateIndent : function() {
        var str = "";
        for (var i = 0; i < this.indent; i ++) {
            str += "    ";
        }
        return str;
    },

    getReadableString : function(action, xpath, value) {
        var str = this.calculateIndent();
        if (action == "goto") {
            str += "goto location" + value;
        } else if (action == "end") {
            this.indent --;
            str += "end";
        } else if (action == "goto-label") {
            str += "jump to label " + value + " if " + " [" + xpath + "]";
        } else if (action == "click") {
            str += "click [" + this.simplyfyXpath(xpath) + "]";
        } else if (action == "fill") {
            str += "enter text [" + this.simplyfyXpath(xpath) + "] = [" + value + "]";
        } else if (action.indexOf("loop-dataset") == 0) {
            var match = action.match(/^loop-dataset-(.*)-(.*)$/);
            str += "while dataset [" + match[1] + "] has more data";
            this.indent ++;
        } else if (action.indexOf("loop-condition") == 0) {
            var match = action.match(/^loop-condition-(.*)$/);
            str += "while [" + xpath + " " + match[1] + " " + value + "]";
            this.indent ++;
        } else if (action.indexOf("condition") == 0) {
            var match = action.match(/^condition-(.*)$/);
            str += "if (" + xpath + " " + match[1] + " " + value + ")";
            this.indent ++;
        } else if (action.indexOf("setvar-") == 0) {
            var match = action.match(/^setvar-(.*)-(.*)$/);
            str += "set " + match[1] + " = [" + xpath + "]";
        } else if (action.indexOf("verify-title") == 0) {
            str += "assert page title [" + value + "]"
        } else if (action.indexOf("wait-for-ms") == 0) {
            str += "sleep [" + (value)/1000.0 + "] seconds"
        } else if (action.indexOf("assert-text-exists") == 0) {
            str += "assert text [" + value + "] exists"
        } else if (action.indexOf("assert-text-does-not-exist") == 0) {
            str += "assert text: [" + value + "] does NOT exist"
        } else {
            str += action + " " + xpath + " " + value;
        }
        return str;
    },

  initializeForBuilding: function(aDatasource, aBuilder, aRootNode) {
    // perform any initialization that can be delayed until the content builder
    // is ready for us to start
  },

  done: function() {
    // called when the builder is destroyed to clean up state
    //this.dbConn.close();
  },

  compileQuery: function(aBuilder, aQuery, aRefVariable, aMemberVariable) {
    // outputs a query object.
    // eventually we should read the <query> to create filters
    var query = null;
    var allQuery = null;
    var useAllQuery = false;
    var params = {};
    for (var i = 0; i < aQuery.childNodes.length; i ++) {
        var child = aQuery.childNodes[i];
        if (child.nodeType == child.ELEMENT_NODE && child.nodeName == "param") {
            var paramName = child.getAttribute("name");
            var paramValue = child.textContent;
            params[paramName] = paramValue;
            if (paramValue == "_all_") {
                useAllQuery = true;
            }
            //dump("collecting params:" + paramName + "=" + paramValue + "\n");
        } else if (child.nodeType == child.ELEMENT_NODE) {
            if (child.nodeName == "default") {
                query = child.textContent;
            } else if (child.nodeName == "all") {
                allQuery = child.textContent;
            }
        } else if (child.nodeType == child.TEXT_NODE && query == null) {
            query = child.textContent;
        }
    }
    if (useAllQuery) {
        query = allQuery;
    }
    //dump("query:[" + query + "]\n");
    var stmt = this.dbConn.createStatement(query);
    //dump("reporter:" + stmt + "\n");

    if (!useAllQuery) {
        for (var param in params) {
            //dump("param: " + param + " = " + params[param] + "\n");
            stmt.params[param] = params[param];
        }
    }

    this._data = [];
    try {
        var columns = [];
        while (stmt.executeStep()) {
            if (columns.length == 0) {
                for (var i = 0; i < stmt.columnCount; i ++) {
                    columns.push(stmt.getColumnName(i));
                }
            }
            this._data.push(this.scrapeData(stmt.row, columns));
        }
    } finally {
        //stmt.reset();
    }

    //dump("data length: " + this._data.length);
    return this._data;
  },

  scrapeData: function(row, columns) {
    var data = {};
    for (var i = 0; i < columns.length; i ++) {
        data[columns[i]] = row[columns[i]];
    }
    return data;
  },

  generateResults: function(aDatasource, aRef, aQuery) {
    //dump("generating results\n");
    // preform any query and pass the data to the result set
    return new com.spikesource.tg4w.TemplateResultSet(this._data);
  },

  addBinding: function(aRuleNode, aVar, aRef, aExpr) {
    // add a variable binding for a particular rule, which we aren't using yet
  },

  translateRef: function(aDatasource, aRefstring) {
    // if we return null, everything stops
    return new com.spikesource.tg4w.TemplateResult(null);
  },

  compareResults: function(aLeft, aRight, aVar) {
    //dump("compareResults\n");
    // -1 less, 0 ==, +1 greater
    var leftValue = aLeft.getBindingFor(aVar);
    var rightValue = aRight.getBindingFor(aVar);
    if (leftValue < rightValue) {
      return -1;
    }
    else if (leftValue > rightValue) {
      return  1;
    }
    else {
      return 0;
    }
  }
};


var components = [com.spikesource.tg4w.TemplateQueryProcessor];
function NSGetModule(compMgr, fileSpec) {
  var val = XPCOMUtils.generateModule(components);
  return val;
}

//dump("testreport.js loaded\n");

