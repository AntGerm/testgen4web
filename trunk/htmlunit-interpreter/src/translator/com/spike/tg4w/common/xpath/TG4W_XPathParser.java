/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See http://www.spikesource.com/license/oslicense.html)
 *
 * author: Vinay Srini (vsrini@spikesource.com)
 */
package com.spike.tg4w.common.xpath;

import java.io.*;
import de.fzi.XPath.Parser.*;
import de.fzi.XPath.*;

public class TG4W_XPathParser {
    public static TG4W_XPath parseXPath(String path) throws TG4W_XPathParseError {
        Reader stream = new StringReader(path);
        XPathParser xpp = new XPathParser(stream);
        xpp.disable_tracing();
        try {
            Expr expr = xpp.XPath();
            String str = expr.toString();
            return new TG4W_XPath(str);
        } catch (ParseException e) {
            throw new TG4W_XPathParseError("Parser: " + e.getMessage());
        }
    }

    public static void main(String[] args) throws Exception {
        String pattern ="*/TABLE[2]/TBODY[1]/TR[2]/TD[5]/A[@CDATA =    \"Accounts\" and @B='ABC' and @C='\"a[bc\"    ']";
        TG4W_XPath xpath = TG4W_XPathParser.parseXPath(pattern);
        xpath.dump();
    }
}
