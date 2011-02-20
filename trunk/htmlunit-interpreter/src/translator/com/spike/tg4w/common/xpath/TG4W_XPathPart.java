/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See http://www.spikesource.com/license/oslicense.html)
 *
 * author: Vinay Srini (vsrini@spikesource.com)
 */
package com.spike.tg4w.common.xpath;

import java.util.*;

public class TG4W_XPathPart implements java.io.Serializable {

    String rawString;
    String localName;
    TG4W_XPathPredicate[] predicates;

    public TG4W_XPathPredicate[] getPredicates() {
        return this.predicates;
    }

    public String getElementName() {
        return this.localName;
    }

    public String getRawString() {
        return this.rawString;
    }

    public TG4W_XPathPart(String path) throws TG4W_XPathParseError {
        this.rawString = path;
        List predicates = new LinkedList();

        // if it has a [, it might have some attributes
        if (path.indexOf("[") != -1) {
            this.localName = path.substring(0, path.indexOf("["));
            String attrPart = path.substring(path.indexOf("[") + 1, path.length() - 1);
            String attrs[] = attrPart.split("attribute::");

            if (attrs.length == 1 && attrPart.length() > 0) {
                predicates.add(new TG4W_XPathPredicate(attrPart));
            } else if (attrs.length > 1) {
                for (int j = 0; j < attrs.length; j++) {
                    String attr = attrs[j].trim();
                    if (! "".equals(attr)) {
                        if (attr.endsWith(" AND")) {
                            attr = attr.substring(0, attr.length() - 4);
                        }
                        predicates.add(new TG4W_XPathPredicate(attr));
                    }
                }
            } else {
                throw new TG4W_XPathParseError("Part:" + path + ", expected something between []");
            }
        } else {
            this.localName = path;
        }

        this.predicates = (TG4W_XPathPredicate[]) predicates.toArray(new TG4W_XPathPredicate[predicates.size()]);
    }

    public void dump() {
        System.out.println("Part: (" + this.localName + ")");
        for (int i = 0; i < this.predicates.length; i++) {
            this.predicates[i].dump();
        }
    }
}
