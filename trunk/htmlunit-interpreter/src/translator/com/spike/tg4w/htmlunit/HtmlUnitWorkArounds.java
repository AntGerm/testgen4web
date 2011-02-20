/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See http://www.spikesource.com/license/oslicense.html)
 *
 * author: Vinay Srini (vsrini@spikesource.com)
 */
package com.spike.tg4w.htmlunit;

import com.gargoylesoftware.htmlunit.*;
import com.gargoylesoftware.htmlunit.html.*;
import java.util.*;

public class HtmlUnitWorkArounds {
    public static String elementAsText(HtmlElement element) {
        final StringBuffer buffer = new StringBuffer();
        final Iterator childIterator = element.getChildIterator();

        if(!childIterator.hasNext()) {
            return "";
        }

        while(childIterator.hasNext()) {
            final DomNode node = (DomNode)childIterator.next();
            if (node instanceof DomText) {
                buffer.append(((DomText)node).getData().trim());
            } else {
                buffer.append(" " + node.asText().trim());
            }
        }

        String text = buffer.toString().replace((char)160,' ');
        text = HtmlUnitWorkArounds.reduceWhitespace(text);
        return text;
    }

    public static String reduceWhitespace( final String text ) {
        final StringBuffer buffer = new StringBuffer( text.length() );
        final int length = text.length();
        boolean whitespace = false;
        for( int i = 0; i < length; ++i) {
            final char ch = text.charAt(i);
            if (whitespace) {
                if (!Character.isWhitespace(ch)) {
                    buffer.append(ch);
                    whitespace = false;
                }
            }
            else {
                if( Character.isWhitespace(ch) ) {
                    whitespace = true;
                    buffer.append(' ');
                }
                else {
                    buffer.append(ch);
                }
            }
        }
        return buffer.toString().trim();
    }
}
