/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See www.spikesource.com/license.html)
 * 
 * author: Vinay Srini (vsrini@spikesource.com)
 */
com.spikesource.tg4w.Predicate = function(str) {
    this.str = str;
    this.breakdown = this.breakDown(this.str);
    com.spikesource.tg4w.recorder.debug("new predicate with " + this.str + ". Broken down to " + this.breakdown.length);
}

com.spikesource.tg4w.Predicate.prototype.matches = function(elem) {
}

com.spikesource.tg4w.Predicate.prototype.isCount = function() {
    return com.spikesource.tg4w.tg4wcommon.isInteger(this.str);
}

com.spikesource.tg4w.Predicate.prototype.getCount = function() {
    if (this.isCount()) {
        return this.str;
    } else {
        com.spikesource.tg4w.recorder.error(this.str + " not integer");
    }
    return null;
}

com.spikesource.tg4w.Predicate.prototype.isCdata = function() {
    return (! this.isComplex() && this.isOfType("CDATA"));
}

com.spikesource.tg4w.Predicate.prototype.getCdataValue = function() {
    if (this.isCdata()) {
        return this.getValue();
    } else {
        com.spikesource.tg4w.recorder.error(this.str + " not a cdata");
    }
    return null;
}

com.spikesource.tg4w.Predicate.prototype.isId = function() {
    return (! this.isComplex() && (this.isOfType("ID") || this.isOfType("id")));
}

com.spikesource.tg4w.Predicate.prototype.isType = function() {
    return (! this.isComplex() && this.isOfType("TYPE"));
}

com.spikesource.tg4w.Predicate.prototype.isValue = function() {
    return (! this.isComplex() && this.isOfType("VALUE"));
}

com.spikesource.tg4w.Predicate.prototype.getValueValue = function() {
    if (this.isValue()) {
        return this.getValue();
    } else {
        com.spikesource.tg4w.recorder.error(this.str + " not of type 'value'");
    }
    return null;
}

com.spikesource.tg4w.Predicate.prototype.getTypeValue = function() {
    if (this.isType()) {
        return this.getValue();
    } else {
        com.spikesource.tg4w.recorder.error(this.str + " not of type 'type'");
    }
    return null;
}

com.spikesource.tg4w.Predicate.prototype.getIdValue = function() {
    if (this.isId()) {
        return this.getValue();
    } else {
        com.spikesource.tg4w.recorder.error(this.str + " not of type 'id'");
    }
    return null;
}

com.spikesource.tg4w.Predicate.prototype.getNameValue = function() {
    if (this.isName()) {
        return this.getValue();
    } else {
        com.spikesource.tg4w.recorder.error(this.str + " not of type 'name'");
    }
    return null;
}

com.spikesource.tg4w.Predicate.prototype.isOfType = function(attrName) {
    if (this.isComplex() || this.isCount()) return false;
    var p = this.breakdown[0];
    var regex = '^@' + attrName + '="(.*)"$';
    var re1 = new RegExp(regex);

    var m = p.match(re1);
    if (m) {
        //alert(this.str + " is of type " + attrName);
        return true;
    } else {
        //alert(this.str + " is NOT of type " + attrName);
        return false;
    }
}

com.spikesource.tg4w.Predicate.prototype.getValue = function() {
    if (this.isComplex() || this.isCount()) return false;
    var p = this.breakdown[0];
    var regex = '^@\\w+="(.*)"$';
    var re1 = new RegExp(regex);
    var m = p.match(re1);
    if (m) {
        return com.spikesource.tg4w.tg4wcommon.unEscapeCharacters(com.spikesource.tg4w.tg4wcommon.trimStr(m[1]));
    } else {
        alert("ERROR: '" + p + "' does not match regexp: '" + regex + "' not sure why!");
    }
}

com.spikesource.tg4w.Predicate.prototype.isName = function() {
    return (! this.isComplex() && (this.isOfType("NAME") || this.isOfType("name")));
}

com.spikesource.tg4w.Predicate.prototype.isComplex = function() {
    return this.breakdown.length > 1;
}

com.spikesource.tg4w.Predicate.prototype.getComplexPredicates = function() {
    var retList = new Array();
    for (var i = 0; i < this.breakdown.length; i++) {
        retList[i] = new com.spikesource.tg4w.Predicate(this.breakdown[i]);
    }
    return retList;
}

com.spikesource.tg4w.Predicate.prototype.getComplexPredicate = function(index) {
    if (this.isComplex()) {
        if (index < 0 && index > this.breakdown.length - 1) {
            com.spikesource.tg4w.recorder.error("out of bounds");
        } else {
            return new com.spikesource.tg4w.Predicate(this.breakdown[index]);
        }
    } else {
        com.spikesource.tg4w.recorder.error(this.str + " is not complex");
    }
    return null;
}

com.spikesource.tg4w.Predicate.prototype.strValue = function() {
    return this.str;
}


com.spikesource.tg4w.Predicate.prototype.breakDown = function (str) {
    var p = str;
    var collect = new Array();

    var re1 = new RegExp('^(@\\w+=".*")[\\s]?and\\s(@\\w+=".*")+$');
    var m = p.match(re1);
    while (m) {
        if (m.length == 3) {
            collect.push(m[m.length-1]);
            p = m[1];
        }
        m = p.match(re1);
    }

    collect.push(p);
    collect.reverse();

    return collect;
}

// To test the predicate.js, uncomment this part,
// and invoke testPredicate(), failures will be notified
// thro' alerts
/*
function PredicateLogger () {
}

PredicateLogger.prototype.isInteger = function(val) {
    return (parseInt(val) + 0 == parseInt(val));
}

PredicateLogger.prototype.unEscapeCharacters = function(msg) {
    return msg;
}

PredicateLogger.prototype.debug = function(msg) {
    dump("debug:" + msg);
}

PredicateLogger.prototype.error = function(msg) {
    alert("ERROR:" + msg);
}

var recorder = new PredicateLogger();
var com.spikesource.tg4w.tg4wcommon = recorder;
function testPredicate() {
    var ps = [
        // some of the old tests may have been recorded with no space
        // between " (double quote) and "and"
        // keeping it safe for backward compatibility
        '@NAME="comandxnametest"and @VALUE="complexvaluetest" and @TYPE="blah"'
        ,'@NAME="comandxnametest" and @VALUE="complexvaluetest"'
        ,'@NAME="comandxnametest"'
        ];

    var pass = 0;
    for (var psc = 0; psc < ps.length; psc ++) {
        var p = ps[psc];
        var pr = new Predicate(ps[psc]);
        switch (psc) {
            case 0:
                if (!pr.isComplex()) { alert("fail 0-1"); break; }
                if (pr.getComplexPredicates().length != 3) { alert("fail 0-2"); break; }
                if (! pr.getComplexPredicate(0).isName()) { alert("fail 0-3"); break; }
                if (pr.getComplexPredicate(0).getNameValue() != "comandxnametest") { alert("fail 0-4"); break; }
                if (! pr.getComplexPredicate(1).isValue()) { alert("fail 0-5"); break; }
                if (pr.getComplexPredicate(1).getValueValue() != "complexvaluetest") { alert("fail 0-6"); break; }
                if (pr.getComplexPredicate(1).isOfType("TYPE")) { alert("fail 0-7"); break; }
                if (! pr.getComplexPredicate(2).isType()) { alert("fail 0-8"); break; }
                if (pr.getComplexPredicate(2).getTypeValue() != "blah") { alert("fail 0-9"); break; }
                pass ++;
                break;
            case 1:
                if (!pr.isComplex()) { alert("fail 1-1"); break; }
                if (pr.getComplexPredicates().length != 2) { alert("fail 1-2"); break; }
                if (! pr.getComplexPredicate(0).isName()) { alert("fail 1-3"); break; }
                if (pr.getComplexPredicate(0).getNameValue() != "comandxnametest") { alert("fail 1-4"); break; }
                if (! pr.getComplexPredicate(1).isValue()) { alert("fail 1-5"); break; }
                if (pr.getComplexPredicate(1).getValueValue() != "complexvaluetest") { alert("fail 1-6"); break; }
                if (pr.getComplexPredicate(1).isOfType("TYPE")) { alert("fail 1-7"); break; }
                pass ++;
                break;
            case 2:
                if (pr.isComplex()) { alert("fail 2-1"); break; }
                if (! pr.isName()) { alert("fail 2-2"); break; }
                if (pr.getNameValue() != "comandxnametest") { alert("fail 2-3"); break; }
                pass ++;
                break;
            default:
                break;
        }
    }
    alert(pass + " of 3 tests passed");
}
*/
