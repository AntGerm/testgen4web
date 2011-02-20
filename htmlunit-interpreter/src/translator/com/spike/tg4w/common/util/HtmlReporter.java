/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See http://www.spikesource.com/license/oslicense.html)
 *
 * author: Vinay Srini (vsrini@spikesource.com)
 */
package com.spike.tg4w.common.util;

import javax.xml.transform.Source;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.stream.StreamSource;
import javax.xml.transform.stream.StreamResult;
import java.io.*;
import java.util.*;

public class HtmlReporter {

    private static final String SUMMARY_XSL = "summary.xsl";
    private static final String SUMMARY_TXT_XSL = "text-report.xsl";
    private static final String LIST_XSL    = "list.xsl";
    private static final String RESULT_XSL  = "result.xsl";
    

    public static void main(String args[]) throws Exception {
        CommandLineParser cmdLine = new CommandLineParser(args);
        String outputDir = cmdLine.getValue("report-dir");
        String xslDir = cmdLine.getValue("xsl-dir");
        String force = cmdLine.getValue("force-generate");
        boolean forceGen = false;
        if (force != null && force.equals("true")) {
            forceGen = true;
        }
        HtmlReporter reporter = new HtmlReporter();
        reporter.transform(xslDir,
                outputDir + File.separator + "tg4w_htmlunit_report.xml",
                outputDir, forceGen);
    }

    public void transform(String xslDir, String reportFile,
            String outputDir, boolean force) throws Exception {
        System.out.print("Generating Left-Navigation..");
        Map params = new HashMap();
        params.put("format", "html");
        Map outputProps = new HashMap();
        outputProps.put("method", "html");
        xsltproc(reportFile,
                xslDir + File.separator + LIST_XSL,
                params, outputProps,
                (outputDir + File.separator + "testfiles.html"), force);


        System.out.print("Generating Summary Html..");
        String now = (new java.util.Date()).toString();
        params = new HashMap();
        params.put("curtime", now);
        outputProps = new HashMap();
        outputProps.put("method", "html");
        xsltproc(reportFile,
                xslDir + File.separator + SUMMARY_XSL,
                params, outputProps,
                (outputDir + File.separator + "summary.html"), force);

        System.out.print("Generating Summary Text..");
        params = new HashMap();
        outputProps = new HashMap();
        outputProps.put("method", "text");
        xsltproc(reportFile,
                xslDir + File.separator + SUMMARY_TXT_XSL,
                params, outputProps,
                (outputDir + File.separator + "summary.txt"), force);


        System.out.print("Generating filelist..");
        params = new HashMap();
        params.put("format", "list");
        outputProps = new HashMap();
        outputProps.put("method", "text");
        xsltproc(reportFile,
                xslDir + File.separator + LIST_XSL,
                params, outputProps,
                (outputDir + File.separator + "testfiles"), force);

        FileReader reader = new FileReader(outputDir + File.separator + "testfiles");
        BufferedReader bufRead = new BufferedReader(reader);
        String line = bufRead.readLine();
        reader.close();

        String[] files = line.split(" ");
        for (int i = 0; i < files.length; i++) {
            String file = files[i];
            if (! "".equals(file)) {
                /*
                <xslt in="${output.dir}/tg4w_htmlunit_report.xml"
                    out="${output.dir}/${short.filename}.html"
                    style="src/xsl/result.xsl" force="${force.re-report}">
                    <param name="filename" expression="${test}"/>
                    <outputproperty name="omit-xml-declaration" value="yes"/>
                </xslt>
                */
                String shortName = (new File(file)).getName();
                String outputFile = outputDir + File.separator + shortName + ".html";

                System.out.print("Generating Report for test: " + shortName + "..");

                params = new HashMap();
                params.put("filename", file);
                outputProps = new HashMap();
                outputProps.put("method", "html");
                xsltproc(reportFile,
                        xslDir + File.separator + RESULT_XSL,
                        params, outputProps,
                        (outputFile), force);
            }
        }
        closeAllStreams();
    }

    private void closeAllStreams() {
        Iterator writerIter = writerMap.values().iterator();
        while (writerIter.hasNext()) {
            Writer writer = (Writer) writerIter.next();
            try {
                writer.close();
            } catch (Exception e) {
                System.out.println("WARNING: " + e.getMessage());
            }
        }
    }

    Map writerMap = new HashMap();
    private StreamResult createFileStreamResult(String filename) throws Exception {
        FileWriter writer = new FileWriter(filename);
        writerMap.put(filename, writer);
        return new StreamResult(writer);
    }

    public void xsltproc(
            String xmlFilename,
            String xsltFilename,
            Map params, Map outputProps,
            String outputFilename, boolean force) throws Exception {


        File xmlFile = new File(xmlFilename);
        File xsltFile = new File(xsltFilename);

        long lastModified = xmlFile.lastModified();
        if (xsltFile.lastModified() > lastModified) {
            lastModified = xsltFile.lastModified();
        }

        File outputFile = new File(outputFilename);
        if (!force && outputFile.exists() && outputFile.lastModified() > lastModified) {
            System.out.println(" #Skipped");
            return;
        }

        StreamResult output = createFileStreamResult(outputFilename);

        // JAXP reads data using the Source interface
        Source xmlSource = new StreamSource(xmlFile);
        Source xsltSource = new StreamSource(xsltFile);

        // the factory pattern supports different XSLT processors
        TransformerFactory transFact =
                TransformerFactory.newInstance();
        Transformer trans = transFact.newTransformer(xsltSource);

        Iterator paramIter = params.keySet().iterator();
        while (paramIter.hasNext()) {
            String key = (String) paramIter.next();
            trans.setParameter(key, params.get(key));
        }

        paramIter = outputProps.keySet().iterator();
        while (paramIter.hasNext()) {
            String key = (String) paramIter.next();
            trans.setOutputProperty(key, (String) outputProps.get(key));
        }

        trans.transform(xmlSource, output);

        System.out.println("Done");
    }
}
