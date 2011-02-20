/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See http://www.spikesource.com/license/oslicense.html)
 *
 * author: Vinay Srini (vsrini@spikesource.com)
 */
package com.spike.tg4w.common.xpath;

import java.util.*;

public class TG4W_XPath implements java.io.Serializable {

    private boolean stringIsNumber(String str) {
        try {
            Float.parseFloat(str);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    String rawString = null;
    TG4W_XPathPart[] parts = null;

    public TG4W_XPathPart[] getParts() {
        return this.parts;
    }

    public String getRawString() {
        return this.rawString;
    }

    public TG4W_XPath(String str) throws TG4W_XPathParseError {
        this.rawString = str;
        String children[] = str.split("child::");
        List parts = new LinkedList();
        for (int i = 0; i < children.length; i++) {
            String child = children[i].trim();
            if (child.endsWith("/")) {
                child = child.substring(0, child.length() - 1);
            } else if ("".equals(child)) {
                continue;
            }
            parts.add(new TG4W_XPathPart(child));
        }

        this.parts = (TG4W_XPathPart[]) parts.toArray(new TG4W_XPathPart[parts.size()]);
    }

    public void dump() {
        for (int i = 0; i < this.parts.length; i++) {
            this.parts[i].dump();
        }
    }
}
