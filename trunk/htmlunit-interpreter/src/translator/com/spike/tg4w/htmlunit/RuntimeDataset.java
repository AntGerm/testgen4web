/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See http://www.spikesource.com/license/oslicense.html)
 *
 * author: Vinay Srini (vsrini@spikesource.com)
 */
package com.spike.tg4w.htmlunit;

import com.spike.tg4w.common.file.*;
import java.io.*;
import java.util.*;
import javax.xml.*;

public class RuntimeDataset implements java.io.Serializable {
    private Dataset datasetDetail;
    private int loopCount;
    private Object[] set = null;
    private String[] headers = null;

    public RuntimeDataset(Dataset detail, InterpreterContext context) throws InterpreterException {
        this.datasetDetail = detail;
        this.loopCount = 0;
        try {
            load(context);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public boolean hasVariable(String varname) {
        if (headers != null) {
            for (int i = 0; i < this.headers.length; i++) {
                if (headers[i].equals(varname)) {
                    return true;
                }
            }
        }
        return false;
    }

    public String getData(InterpreterContext context, String xpath) throws InterpreterException {
        if (this.hasMore()) {
            if (datasetDetail.isCSV()) {
                return (String) ((Map) set[this.loopCount]).get(xpath);
            } else {
                try {
                    // 1. Instantiate an XPathFactory.
                    javax.xml.xpath.XPathFactory factory = 
                        javax.xml.xpath.XPathFactory.newInstance();

                    // 2. Use the XPathFactory to create a new XPath object
                    javax.xml.xpath.XPath xpathObj = factory.newXPath();

                    // 3. Compile an XPath string into an XPathExpression
                    javax.xml.xpath.XPathExpression expression = xpathObj.compile(xpath);

                    // 4. Evaluate the XPath expression on an input document
                    String val = (String) expression.evaluate(this.set[this.loopCount], javax.xml.xpath.XPathConstants.STRING);
                    context.getLogger().debug("dataset: " + this.datasetDetail.getId() 
                            + ", loop:" + this.loopCount
                            + ", xpath:" + xpath
                            + ", value:" + val);

                    return val;
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }
        } else {
            throw new InterpreterException("loop overflow", context);
        }
    }

    private void load(InterpreterContext context) throws InterpreterException, IOException {
        // already init. return
        if (set != null) { return; }

        if (datasetDetail.isCSV()) {
            this.headers = datasetDetail.getXpath().split(",");
            BufferedReader reader = new BufferedReader(new FileReader(datasetDetail.getFile()));
            String line;
            List data = new LinkedList();
            while ((line = reader.readLine()) != null) {
                String[] vars = line.split(",");
                HashMap row = new HashMap();
                if (vars.length == this.headers.length) {
                    for (int fc = 0; fc < this.headers.length; fc ++) {
                        row.put(this.headers[fc], vars[fc]);
                    }
                    context.getLogger().debug("consumed line:" + line);
                } else {
                    context.getLogger().warning("WARNING: skipping line:" + line);
                }
                data.add(row);
            }
            this.set = data.toArray();
        } else if (datasetDetail.isXml()) {
            try {
                // 1. Instantiate an XPathFactory.
                javax.xml.xpath.XPathFactory factory = 
                    javax.xml.xpath.XPathFactory.newInstance();

                // 2. Use the XPathFactory to create a new XPath object
                javax.xml.xpath.XPath xpath = factory.newXPath();

                // 3. Compile an XPath string into an XPathExpression
                javax.xml.xpath.XPathExpression expression = xpath.compile(this.datasetDetail.getXpath());

                // 4. Evaluate the XPath expression on an input document
                org.w3c.dom.NodeList result = (org.w3c.dom.NodeList) 
                    expression.evaluate(
                            new org.xml.sax.InputSource(datasetDetail.getFile()),
                            javax.xml.xpath.XPathConstants.NODESET);

                this.set = new org.w3c.dom.Node[result.getLength()];
                for (int i = 0; i < this.set.length; i++) {
                    this.set[i] = result.item(i);
                }
                context.getLogger().debug("dataset: " + this.datasetDetail.getId() + " " + this.set.length + " elements");
            } catch (Exception e) {
                throw new InterpreterException(e, context);
            }
        } else {
            throw new InterpreterException("datatype of type: " + datasetDetail.getType() + " is not supported", context);
        }
    }

    public void incrementLoop() {
        this.loopCount ++;
    }

    public boolean hasMore() {
        return this.loopCount < set.length;
    }

    public void reset(InterpreterContext context) {
        this.loopCount = 0;
    }
}
