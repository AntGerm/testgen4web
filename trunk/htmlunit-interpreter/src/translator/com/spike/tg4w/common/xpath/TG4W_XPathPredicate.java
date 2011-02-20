/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See http://www.spikesource.com/license/oslicense.html)
 *
 * author: Vinay Srini (vsrini@spikesource.com)
 */
package com.spike.tg4w.common.xpath;

import java.util.*;

public class TG4W_XPathPredicate implements java.io.Serializable {
    String attr, value, rawString;
    boolean isNumber;

    public TG4W_XPathPredicate(String attr) {
        this.rawString = attr;
        try {
            int number = (int) Float.parseFloat(attr);
            this.isNumber=true;
            this.value = number + "";
            this.attr = "";
        }
        catch (NumberFormatException e) {
            this.isNumber = false;
            int indexOfEquals = attr.indexOf(" = ");
            this.attr = attr.substring(0, indexOfEquals);
            this.value = attr.substring(indexOfEquals + 5, attr.length() - 2);
        }
    }

    public boolean isNumber() {
        return this.isNumber;
    }

    public boolean isId() {
        return isAttr("id");
    }

    public boolean isName() {
        return isAttr("name");
    }


    private boolean isAttr(String attrName) {
        return this.attr.equalsIgnoreCase(attrName);
    }

    public boolean isType() {
        return isAttr("type");
    }

    public boolean isValue() {
        return isAttr("value");
    }

    public String getAttrName() {
        return this.attr;
    }

    public String getValue() {
        return this.value;
    }

    public void dump() {
        if (this.isNumber) {
            System.out.println("   Index (" + this.value + ")");
        } else {
            System.out.println("   attr  (" + this.attr + ")");
            System.out.println("   value (" + this.value + ")");
        }
    }
}
