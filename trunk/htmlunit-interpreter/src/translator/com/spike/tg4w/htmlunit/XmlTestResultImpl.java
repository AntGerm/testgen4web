/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See http://www.spikesource.com/license/oslicense.html)
 *
 * author: Vinay Srini (vsrini@spikesource.com)
 */
package com.spike.tg4w.htmlunit;

import com.spike.tg4w.common.file.*;
import com.spike.tg4w.common.util.*;
import java.io.*;
import org.apache.commons.logging.*;

public class XmlTestResultImpl implements TestResult {
    private static Log logger = LogFactory.getLog("com.spike.tg4w.htmlunit");

    static class ShutDownHook extends Thread {
        XmlTestResultImpl logger;
        public ShutDownHook(XmlTestResultImpl logger) {
            this.logger = logger;
        }

        public void run() {
            try {
                if (!logger.resultsFinalized) {
                    this.logger.finalizeResults();
                }
            } catch (Exception e) {
                // supress any error. jvm is shutting down anyway!
                e.printStackTrace();
            }
        }
    }

    private String currentFile = null;
    private Action currentAction = null;
    private int currentActionNum = -1;
    FileWriter writer = null;
    String writeDir = null;
    boolean resultsFinalized = false;

    public XmlTestResultImpl(String filename, String encoding) throws IOException {
        this.writer = new FileWriter(filename);
        if (encoding == null) {
            encoding = "ISO-8859-1";
        }
        write("<?xml version='1.0' encoding='" + encoding + "'?>");
        write("<tests>");
        this.writeDir = (new File(filename)).getParent();
        
        Runtime.getRuntime().addShutdownHook(new ShutDownHook(this));
    }

    private void write(String msg) {
        try {
            writer.write(msg + "\n");
            writer.flush();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private void _finalizeTest() {
        write("</test>");
    }

    private void _finalizeStep() {
        write("        </logs>");
        write("    </step>");
    }

    private void _startTest() {
        write("<test name='" + currentFile + "' html-copy='" + outputFileAsHtml(this.currentFile) + "'>");
    }

    public void finalizeResults() {
        try {
            // safety sake
            stepEnd(currentActionNum);
            testEnd(currentFile);
            write("</tests>");
            writer.close();
            writer = null;
            this.resultsFinalized = true;
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    // just in case
    public void finalize() {
        if (writer != null) {
            finalizeResults();
        }
    }

    private void _stepStart() {
        write("    <step num='" + currentActionNum + "' line='" 
                + currentAction.lineNumber + "' col='" + currentAction.columnNumber + "'>");
        write("        <action><![CDATA[" + currentAction.toString("") + "]]></action>");
        write("        <logs>");
    }

    private void log(String msg, int type) {
        if (isEnabled(type)) {
            if (isEnabled(LOG_CONSOLE_DEBUG) || type == LOG_ERROR || type == LOG_WARNING) {
                System.out.println(LOG_NAME[type] + " : " + msg);
            }
            String indent = "    ";
            if (currentActionNum != -1) {
                indent = "            ";
            }
            write(indent + "<log type='" + LOG_NAME[type] + "'><![CDATA[" + msg + "]]></log>");
        }
    }

    private String outputFileAsHtml(String filename) {
        FileReader fr = null;
        try {
            fr = new FileReader(filename);
            BufferedReader reader = new BufferedReader(fr);
            String line;
            int lineNum = 0;
            String outfile = (new File(filename)).getName() + "_rec.html";
            Writer writer = new FileWriter(this.writeDir + File.separator + outfile);
            writer.write("<html><head><style>.highlight {background-color:lightblue; }</style> <script> function highlight() { var line = location.search.substring(6); if (line) document.getElementById(line).setAttribute(\"class\", \"highlight\"); } </script> </head><body onload='javascript:highlight();' style='font-size:90%;font-family:courier'><table cellpadding='0' cellspacing='0'>");
            while ((line = reader.readLine()) != null) {
                lineNum ++;
                line = line.replace(" ", "&nbsp;")
                    .replace("\t", "&nbsp;")
                    .replace(">", "&gt;")
                    .replace("<", "&lt;");
                writer.write("<tr><td id='" + lineNum + "'>");
                writer.write("<a name='" + lineNum + "'/> &nbsp;" + lineNum + "&nbsp;&nbsp;&nbsp;&nbsp;" + line + "<br/>\n");
                writer.write("</td></tr>");
            }
            writer.write("</table></body></html>");
            writer.close();
            fr.close();
            reader.close();
            return outfile;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            try {
                if (fr != null) { fr.close(); }
            } catch (IOException ex) {
                // ignore
            }
        }
    }

    public void testStart(String filename) {
        // safety
        testEnd(this.currentFile);
        this.currentFile = filename;
        _startTest();
    }

    public void testEnd(String filename) {
        stepEnd(-1);
        if (this.currentFile != null) {
            this.currentFile = null;
            _finalizeTest();
        }
    }

    public void numOfActions(int num) {
        if (this.currentFile != null) {
            write("    <action-count num='" + num + "'/>");
        }
    }

    public void stepStart(Action action, int num) {
        // safety
        stepEnd(num);
        try {
            this.currentAction = (Action) ObjectCloner.deepCopy(action);
        } catch (Exception e) {
            this.currentAction = action;
        }
        this.currentActionNum = num;
        _stepStart();
        info("Step start: " + num + " type=" + action.type);
    }

    public void stepEnd(int num) {
        if (this.currentAction != null) {
            this.currentAction = null;
            this.currentActionNum = -1;
            _finalizeStep();
        }
    }

    public void outfile(String name, String relpath) {
        String indent = "    ";
        if (currentActionNum != -1) {
            indent = "            ";
        }
        write(indent + "<file name='" + name + "' relpath='" + relpath + "'/>");
    }

    int debugLevel = LOG_DEBUG;
    public void setDebugLevel(String val) {
        if (val != null) {
            for (int i = 0; i < LOG_NAME.length; i++) {
                if (val.equals(LOG_NAME[i])) {
                    debugLevel = i;
                }
            }
        }
    }

    public boolean isEnabled(int type) {
        //System.out.println("is enabled: " + LOG_NAME[type] + " = " + (type <= debugLevel));
        return type <= debugLevel;
    }

    final java.text.SimpleDateFormat dateFormat = new java.text.SimpleDateFormat("HH:mm.ss.S");
    private String getTimeString() {
        return (dateFormat.format(new java.util.Date())).toString();
    }

    public void debug(String msg) {
        logger.debug(msg);
        log(msg, LOG_DEBUG);
    }

    public void info(String msg) {
        logger.info(msg);
        log(msg, LOG_INFO);
    }

    public void warning(String msg) {
        logger.warn(msg);
        log(msg, LOG_WARNING);
    }

    public void error(String msg) {
        logger.error(msg);
        msg = msg.replaceAll("\n", "<br/>");
        log(msg, LOG_ERROR);
    }

    public void error(String msg, Exception e) {
        logger.error(msg, e);
        log(msg + "\n" + stackTrace2String(e), LOG_ERROR);
    }

    public void fatal(String msg) {
        logger.fatal(msg);
        log(msg, LOG_FATAL);
    }

    public void fatal(String msg, Exception e) {
        logger.fatal(msg, e);
        log(e.getMessage(), LOG_FATAL);
        log(msg + "\n" + stackTrace2String(e), LOG_FATAL);
    }

    private String stackTrace2String(Exception exception) {
        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(stream);
        exception.printStackTrace(writer);
        try {
            return stream.toString();
        } finally {
            try { stream.close(); } catch (IOException e) {}
            writer.close();
        }
    }
}
