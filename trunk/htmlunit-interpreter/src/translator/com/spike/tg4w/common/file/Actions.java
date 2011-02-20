/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See http://www.spikesource.com/license/oslicense.html)
 *
 * author: Vinay Srini (vsrini@spikesource.com)
 */
package com.spike.tg4w.common.file;

import javax.xml.parsers.*;
import org.xml.sax.*;
import org.xml.sax.helpers.*;
import java.io.*;
import java.util.*;
import java.lang.reflect.*;
import java.beans.*;

public class Actions extends DefaultHandler {
    Locator currentLocation = null;

    public Actions (String fileName) throws Exception {
        SAXParser parser = SAXParserFactory.newInstance().newSAXParser();
        //System.out.println(parser.getClass().getName());
        parser.parse(new File(fileName), this);
    }

    public void setDocumentLocator(Locator locator) {
        this.currentLocation = locator;
    }

    Stack stack = new Stack();
    List actions = new LinkedList();
    List datasets = new LinkedList();

    int actionIndex = 0;

    String version = "<=0.34.4";
    public void startElement(String uri, String localName, String qName, Attributes attributes) {
       if (qName.equals("tg4w")) {
            this.version = attributes.getValue("version");
            stack.push(this);
        } else if (qName.equals("actions")) {
            stack.push(this);
        } else if (qName.equals("action")) {
            stack.push(new Action(actionIndex++));
            if (this.currentLocation != null) {
                ((Action) stack.peek())
                    .setXmlDocumentLocation(
                            this.currentLocation.getLineNumber(),
                            this.currentLocation.getColumnNumber()
                            );
            }
        } else if (qName.equals("datasets")) {
            stack.push(this);
        } else if (qName.equals("dataset")) {
            stack.push(new Dataset());
        } else {
            stack.push(qName);
        }

        // check for attributes
        if (attributes.getLength() > 0 && (stack.peek() instanceof Action || stack.peek() instanceof Dataset)) {
            for (int i = 0; i < attributes.getLength(); i++) {
                try {
                    setAttribute(stack.peek(), attributes.getQName(i), attributes.getValue(i));
                } catch (Exception e) {
                    throw new RuntimeException("Error while setting attr:'" + attributes.getQName(i) 
                            + "', value:'" + attributes.getValue(i) + "'");
                }
            }
        }
    }

    public String getVersion() {
        return this.version;
    }

    public Dataset[] getDatasets() {
        return (Dataset[]) datasets.toArray(new Dataset[0]);
    }

    public Action[] getActions() {
        return (Action[]) actions.toArray(new Action[0]);
    }

    public void ignorableWhitespace(char[] ch, int start, int length) {
    }

    public void characters(char[] ch, int start, int length) {
        String characters = new String(ch, start, length).trim();
        if (stack.peek() instanceof String) {
            String type = (String) stack.pop();
            try {
                setAttribute(stack.peek(), type, characters);
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                stack.push(type);
            }
        }
    }

    private String removeDashes(String val) {
        StringBuffer buffer = new StringBuffer();
        int index = val.indexOf("-");
        String firstChar = "";
        while (index != -1) {
            buffer.append(firstChar + val.substring(0, index));
            firstChar = val.substring(index + 1, index + 2);
            firstChar = firstChar.toUpperCase();
            val = val.substring(index + 2);
            index = val.indexOf("-");
        }

        buffer.append(firstChar);
        buffer.append(val);

        return buffer.toString();
    }

    private void setAttribute(Object obj, String attr, String value) throws Exception {
        attr = removeDashes(attr);
        BeanInfo info = Introspector.getBeanInfo(obj.getClass());
        PropertyDescriptor[] pds = info.getPropertyDescriptors();
        for (int i = 0; i < pds.length; i++) {
            if (pds[i].getName().equals(attr)) {
                Method readMethod = pds[i].getReadMethod();
                if (readMethod == null) {
                    throw new RuntimeException("no write method for : "
                            + obj.getClass().getName() + ":" + attr);
                } else {
                    Class returnType = readMethod.getReturnType();
                    Object[] objarr = { value };
                    Method writeMethod = pds[i].getWriteMethod();
                    if (writeMethod == null) {
                        throw new RuntimeException("no write method for : "
                                + obj.getClass().getName() + ":" + attr);
                    } else {
                        writeMethod.invoke(obj, objarr);
                    }
                }
            }
        }
    }

    public void endElement(String uri, String localName, String qName) {
        Object obj = stack.pop();
        if (obj instanceof Action) {
            actions.add(obj);
            //((Action) obj).dump();
        } else if (obj instanceof Dataset) {
            datasets.add(obj);
        }
    }
}
