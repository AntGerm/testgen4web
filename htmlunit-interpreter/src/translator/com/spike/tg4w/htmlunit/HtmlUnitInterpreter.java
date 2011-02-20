/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See http://www.spikesource.com/license/oslicense.html)
 *
 * author: Vinay Srini (vsrini@spikesource.com)
 */
package com.spike.tg4w.htmlunit;

import com.spike.tg4w.common.util.*;
import com.spike.tg4w.common.file.*;
import com.spike.tg4w.common.xpath.*;
import java.io.*;
import java.util.*;
import javax.net.ssl.*;

import com.gargoylesoftware.htmlunit.*;
import com.gargoylesoftware.htmlunit.html.*;
import com.gargoylesoftware.htmlunit.xml.*;
import com.gargoylesoftware.htmlunit.javascript.JavaScriptEngine;

import org.apache.commons.httpclient.protocol.Protocol;
import org.apache.commons.httpclient.contrib.ssl.EasySSLProtocolSocketFactory;

public class HtmlUnitInterpreter {
    public static final String MAIN_WINDOW_NAME = "__tg4w_window__";

    List testFiles = new LinkedList();
    InterpreterConfig config = null;
    TestResult logger = null;

    public HtmlUnitInterpreter(InterpreterConfig config) {
        this.config = config;
        if (this.config.logger == null) {
            try {
                String filename = this.config.reportFile;
                if (! (new File(filename)).isAbsolute() && this.config.debugDir != null) {
                    filename = this.config.debugDir + File.separator + filename;
                }
                this.config.logger = new XmlTestResultImpl(filename, null);
                this.config.logger.setDebugLevel(this.config.debugLevel);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
        this.logger = this.config.logger;
    }

    public TestResult getTestResult() {
        return this.logger;
    }

    public void addTestFile(String path) {
        File file = new File(path);
        if (file.exists()) {
            testFiles.add(file);
        } else {
            this.logger.warning("File does not exist. Skipping " + path);
        }
    }

    public void runAll() throws InterpreterException {
        try {
            for (int testCount = 0; testCount < testFiles.size(); testCount++) {
                File testFile = (File) testFiles.get(testCount);
                this.logger.testStart(testFile.getAbsolutePath());
                try {
                    System.out.println("Test #" + (testCount + 1) + "/" + testFiles.size() + " : " + testFile);
                    this.runTest(testFile);
                } catch (InterpreterException e) {
                    logger.fatal("error running: " + testFile.getAbsolutePath(), e);
                    e.printStackTrace();
                    if (e.getContext() != null) {
                        ByteArrayOutputStream stream = new ByteArrayOutputStream();
                        PrintStream pstream = new PrintStream(stream);
                        e.getContext().dump(pstream);
                        String contextDump = stream.toString();
                        logger.fatal(contextDump);
                    } else {
                        logger.error("*** ERROR Context is NULL ***");
                    }
                    if (this.config.stopOnError) {
                        logger.info("Stopping tests");
                        throw e;
                    } else {
                        logger.warning(testFile.getAbsolutePath() + " could not be run, Ignoring the error.");
                    }
                } finally {
                    this.logger.testEnd(testFile.getAbsolutePath());
                }
            }
        } finally {
            this.logger.finalizeResults();
        }
    }

    private String searchAndReplaceVariables(InterpreterContext context, String str) throws InterpreterException {
        if (str != null) {
            int index = str.indexOf("${");
            while (index != -1) {
                int closeBraceIndex = str.indexOf("}", index);
                String varname = str.substring(index + 2, closeBraceIndex);
                String value = varname;

                int dotIndex = varname.indexOf(".");
                if (dotIndex != -1) {
                    String dsname  = varname.substring(0, dotIndex);
                    String xpath   = varname.substring(dotIndex + 1);
                    value = context.getDataFromDataset(dsname, xpath);
                } else {
                    value = String.valueOf(context.getVariableValue(varname));
                }

                str = str.substring(0, index) + value + str.substring(closeBraceIndex + 1);
                // reindex
                index = str.indexOf("${");
            }
        }
        return str;
    }

    protected Action fixAction(InterpreterContext context, Action action) throws InterpreterException {
        Action newAction = null;
        try {
            newAction = (Action) ObjectCloner.deepCopy(action);
        } catch (Exception e) {
            throw new InterpreterException("error while cloning action", context);
        }
        newAction.setXpath(searchAndReplaceVariables(context, newAction.getXpath()), false);
        newAction.setValue(searchAndReplaceVariables(context, newAction.getValue()), false);
        return newAction;
    }

    public void runTest(File testFile) throws InterpreterException {
        // Initialize the context
        InterpreterContext context = new InterpreterContext(this.config);
        try {
            context.setDebugDir(this.config.debugDir);
            context.setLogger(this.logger);
            context.clear();
            context.currentFile = testFile.getAbsolutePath();

            if (this.config.easyHttps) {
                logger.info("Enabling EasySSL");
                Protocol easyhttps = new Protocol("https", new EasySSLProtocolSocketFactory(), 443);
                Protocol.registerProtocol("https", easyhttps);
            }

            Action[] actions = null;
            try {
                actions = context.loadFile(testFile.getAbsolutePath());
            } catch (Exception e) {
                throw new InterpreterException("Error parsing file: " + testFile.getAbsolutePath(), e, context);
            }

            int newac = -1;
            for (int ac = 0; ac < actions.length; ac++) {
                Action action = fixAction(context, actions[ac]);
                logger.stepStart(action, ac);
                logger.info("isContainer:" + action.isContainer());
                try {
                    // set action in context
                    context.currentAction = action;
                    context.currentActionCount = ac;

                    if (action.type.equals("goto")) {
                        handleAction_goto_url(context, action);
                    } else if ("click".equals(action.type)) {
                        if (this.config.thinkTime != -1) {
                            logger.info("Thinking for " + this.config.thinkTime + " ms");
                            try { Thread.sleep(this.config.thinkTime); } catch (Exception e) {}
                        }
                        handleAction_click(context, action);
                    } else if ("verify-title".equals(action.type)) {
                        handleAction_verify_title(context, action);
                    } else if ("assert-text-exists".equals(action.type)) {
                        handleAction_assert_text_exists(context, action);
                    } else if ("assert-text-does-not-exist".equals(action.type)) {
                        handleAction_assert_text_not_exists(context, action);
                    } else if ("fill".equals(action.type)) {
                        handleAction_fill(context, action);
                    } else if ("select".equals(action.type)) {
                        handleAction_select(context, action);
                    } else if ("check".equals(action.type)) {
                        handleAction_check(context, action);
                    } else if ("alert".equals(action.type)) {
                        logger.warning("TODO: Expecting alert around here: '" + action.value + "'");
                    } else if ("confirm".equals(action.type)) {
                        logger.info("TODO: Expecting confirm around here: '" + action.xpath + "'. Should click ok? : " + action.value);
                    } else if ("wait-for-ms".equals(action.type)) {
                        int wait4ms = Integer.parseInt(action.value);
                        logger.debug("wait start: " + new java.util.Date() + ", will wait for: " + wait4ms + " ms");
                        try { Thread.sleep(wait4ms); } catch (InterruptedException e) {}
                        logger.debug("wait end: " + new java.util.Date());
                    } else if (action.isGotoAction()) {
                        newac = handleAction_goto(context, action);
                    } else if (action.isVariableAction()) {
                        handleAction_setvar(context, action);
                    } else if (action.isContainer()) {
                        boolean evaluationResult = evaluateContainer(context, action);
                        System.out.println("evaluationResult:" + evaluationResult);
                        if (!evaluationResult) {
                            // if not true, jump end + 1
                            newac = context.findEnd4Container(action).actionIndex + 1;
                        } else {
                            // push container, evaluate next
                            context.pushContainer(action);
                        }
                    } else if (action.isEndContainer()) {
                        Action container = context.popContainer();
                        if (container.isCondition() != null) {
                            // nothing to do, just a "if", move on
                        } else {
                            Action.DatasetLoop dsl = container.isDatasetLoop();
                            // loop - increment if it is a dataset loop
                            if (dsl != null) {
                                RuntimeDataset ds = context.getDataset(dsl.dsname);
                                ds.incrementLoop();
                            }
                            // and jump to container, which will evaluate
                            newac = container.actionIndex;
                        }
                    } else {
                        String errMsg = "action not supported: " + action.type;
                        throw new InterpreterException(errMsg, context);
                    }
                } finally {
                    try {
                        logger.info("Final browser url: " + getCurrentUrl(context));
                    } catch (Exception e) {
                        // i don't want to handle any null pointers or such, just ignore it!
                        logger.info("Final browser url: unknown. reason: " + e.getMessage());
                    }
                    logger.stepEnd(ac);

                    if (newac != -1) {
                        logger.info("Jumping to action: " + newac);
                        ac = newac - 1;
                        newac = -1;
                    }
                }
            }

            logger.info("all actions done!");
        } finally {
            context.destroy();
        }
    }

    private String getCurrentUrl(InterpreterContext context) {
        WebWindow currentWindow = context.getWindowListener().getMainWindow();
        return currentWindow.getEnclosedPage().getWebResponse().getUrl().toString();
    }

    protected void handleAction_goto_url(InterpreterContext context, Action action) throws InterpreterException {
        try {
            this.logger.info("changing url to page: " + action.value);
            context.getBrowser().getPage(new java.net.URL(action.value));
        } catch (java.io.IOException e) {
            throw new InterpreterException("error while fetching url: " + action.value, e, context);
        }
    }

    protected boolean handleAction_verify_title(InterpreterContext context, Action action) throws InterpreterException {
        if (action.value != null) {
            WebWindow currentWindow = context.getWindowListener().getMainWindow();
            if (currentWindow != null) {
                HtmlPage currentPage = ((HtmlPage) currentWindow.getEnclosedPage());
                if (currentPage != null) {
                    String title = currentPage.getTitleText();
                    if (title == null || ! title.equals(action.value)) {
                        // FAILURE: title does not match
                        this.logger.error("title does not match: expected: '" + action.value + "', got: '" + title + "'");
                        return false;
                    } else {
                        this.logger.info("title match: expected: '" + action.value + "'");
                        return true;
                    }
                } else {
                    throw new InterpreterException("page is null", context);
                }
            } else {
                throw new InterpreterException("current window is null", context);
            }
        } else {
            logger.warning("value for verify-title is null.");
            return false;
        }
    }

    protected void handleAction_setvar(InterpreterContext context, Action action) throws InterpreterException {
        Action.VariableDetails var = action.getVariableDetails();
        String jsString = context.getJsEvalPrefix() + action.xpath;

        HtmlPage page = findFrame(context, action.frameSequence, action.window);
        Object scriptValue = context.getBrowser().getJavaScriptEngine().execute(
                page, jsString, "custom_script", 1);

        Object varValue = null;
        if (scriptValue != null) {
            if (var.type.equals("bool")) {
                varValue = new Boolean(String.valueOf(scriptValue));
            } else if (var.type.equals("num")) {
                varValue = new Double(String.valueOf(scriptValue));
            } else {
                varValue = scriptValue.toString();
            }
        }
        context.addVariable(var, varValue);
    }

    protected int handleAction_goto(InterpreterContext context, Action action) throws InterpreterException {
        boolean evaluationResult = evaluateGotoAction(context, action);
        if (evaluationResult) {
            logger.debug("Evaluated to true");
            String jump2label = action.getGotoDetails().label;
            int newIndex = findIndexOfActionWithLabel(context.getActions(), jump2label);
            if (newIndex != -1) {
                logger.info("jumping to index " + newIndex 
                        + " action=" + context.getActions()[newIndex].getType());
                return newIndex;
            } else {
                throw new RuntimeException("cannot jump to label '" + jump2label 
                        + "'. No action with that label.");
            }
        } else {
            logger.debug("goto action evaluated to false. move on.");
            return -1;
        }
    }


    protected boolean handleAction_assert_text_not_exists(InterpreterContext context, Action action) throws InterpreterException {
        boolean foundText = findText(context, action.frameSequence, action.window, action.xpath, action.value);
        if (foundText) {
            this.logger.error("assert-text-does-not-exist: Found text: '" + action.value + "'");
        } else {
            this.logger.info("assert-text-does-not-exist: Did not find text: '" + action.value + "'"); 
        }
        return (! foundText);
    }

    protected void handleAction_click(InterpreterContext context, Action action) throws InterpreterException {
        HtmlElement elementFound = findElement(context, action.frameSequence, action.window, action.xpath);
        if (elementFound == null) {
            throw new InterpreterException("element not found " + action.xpath, context);
        }
        if (elementFound instanceof ClickableElement) {
            try {
                logger.info("Clicking on element: " + action.xpath);
                if (elementFound instanceof HtmlAnchor) {
                    logger.info("  clicking on <a> href:[" + ((HtmlAnchor) elementFound).getHrefAttribute());
                } else if (elementFound instanceof HtmlButton) {
                    logger.info("  clicking on button name:[" + ((HtmlButton) elementFound).getNameAttribute());
                }
                ((ClickableElement) elementFound).click();
            } catch (IOException e) {
                // clicks throw IOException!
                throw new InterpreterException("error while click", e, context);
            }
        } else {
            String errMsg = "cannot click on element: " + elementFound.getClass().getName();
            throw new InterpreterException(errMsg, context);
        }
    }


    protected boolean handleAction_assert_text_exists(InterpreterContext context, Action action) throws InterpreterException {
        boolean foundText = findText(context, action.frameSequence, action.window, action.xpath, action.value);
        if (foundText) {
            this.logger.info("assert-text-exists: Found text: '" + action.value + "'"); 
        } else {
            this.logger.error("assert-text-exists: Could not find text: '" + action.value + "'.");
        }
        return foundText;
    }

    protected void handleAction_check(InterpreterContext context, Action action) throws InterpreterException {
        HtmlElement elementFound = findElement(context, action.frameSequence, action.window, action.xpath);
        if (elementFound == null) {
            throw new InterpreterException("element not found " + action.xpath, context);
        }
        if (elementFound instanceof HtmlCheckBoxInput) {
            ((HtmlCheckBoxInput) elementFound).setChecked((new Boolean(action.value)).booleanValue());
        } else {
            throw new InterpreterException("cannot check/uncheck: " + elementFound.getClass().getName(), context);
        }
    }

    protected void handleAction_fill(InterpreterContext context, Action action) throws InterpreterException {
        HtmlElement elementFound = findElement(context, action.frameSequence, action.window, action.xpath);
        if (elementFound == null) {
            throw new InterpreterException("element not found " + action.xpath, context);
        }
        if (elementFound instanceof HtmlInput) {
            ((HtmlInput) elementFound).setValueAttribute(action.value);
        } else if (elementFound instanceof HtmlTextArea) {
            ((HtmlTextArea) elementFound).setText(action.value);
        } else {
            throw new InterpreterException("cannot fill: " + elementFound.getClass().getName(), context);
        }
    }

    protected void handleAction_select(InterpreterContext context, Action action) throws InterpreterException {
        HtmlElement elementFound = findElement(context, action.frameSequence, action.window, action.xpath);
        if (elementFound == null) {
            throw new InterpreterException("element not found " + action.xpath, context);
        }
        if (elementFound instanceof HtmlSelect) {
            HtmlSelect select = (HtmlSelect) elementFound;
            if (! select.isMultipleSelectEnabled()) {
                HtmlOption option = null;
                try {
                    option = select.getOptionByValue(action.value);
                } catch (com.gargoylesoftware.htmlunit.ElementNotFoundException e) {
                    logger.warning("cannot find value: [" + action.value + "] in the select: [" + action.xpath + "]. Will try search text values");
                }
                if (option != null) {
                    select.setSelectedAttribute(option, true);
                } else {
                    List options = select.getOptions();
                    boolean found = false;
                    if (options != null) {
                        for (int i = 0; i < options.size(); i++) {
                            option = (HtmlOption) options.get(i);
                            logger.debug("comparing value in select: [" + option.asText() + "] to expected value: [" + action.value + "]");
                            if (option.asText() != null && option.asText().equals(action.value)) {
                                select.setSelectedAttribute(option, true);
                                found = true;
                            }
                        }
                    } else {
                        logger.warning("no options in the select: " + action.xpath);
                    }
                    if (!found) {
                        throw new InterpreterException("cannot find '" + action.value 
                                + "' as one of the values for select", context);
                    }
                }
            } else {
                // reset all options
                List options = select.getOptions();
                for (int i = 0; i < options.size(); i++) {
                    logger.debug("deselecting value: " + ((HtmlOption) options.get(i)).getValueAttribute());
                    ((HtmlOption) options.get(i)).setSelected(false);
                }
                String[] values = action.value.split(",");
                for (int i = 0; i < values.length; i++) {
                    try {
                        values[i] = java.net.URLDecoder.decode(values[i], "utf-8");
                    } catch (UnsupportedEncodingException e) {
                        throw new InterpreterException(e, context);
                    }
                    HtmlOption option = select.getOptionByValue(values[i]);
                    if (option != null) {
                        logger.debug("selecting value: " + option.getValueAttribute());
                        option.setSelected(true);
                    } else {
                        throw new InterpreterException("cannot find '" + values[i]
                                + "' as one of the values for select", context);
                    }
                }
            }
        } else {
            throw new InterpreterException("cannot select values for : " + elementFound.getClass().getName(), context);
        }
    }

    private int findIndexOfActionWithLabel(Action[] actions, String label) {
        for (int i = 0; actions != null && i < actions.length; i++) {
            if (actions[i].getLabel().equals(label)) {
                return i;
            }
        }
        return -1;
    }

    protected boolean evaluateContainer(InterpreterContext context, Action action) {
        Object scriptValue = null;
        HtmlPage currentPage = findFrame(context, action.frameSequence, action.window);
        JavaScriptEngine scriptEngine = context.getBrowser().getJavaScriptEngine();
        String jsPrefix = context.getJsEvalPrefix();

        Action.Condition condition = action.isConditionLoop();
        if (condition == null) {
            condition = action.isCondition();
        }

        Action.DatasetLoop dsl = action.isDatasetLoop();

        if (condition != null) {
            Object lhsValue = scriptEngine.execute(currentPage, jsPrefix + ";" + action.xpath, "custom_script", 1);
            Object rhsValue = scriptEngine.execute(currentPage, jsPrefix + ";" + action.value, "custom_script", 1);
            System.out.println("lhs=" + lhsValue);
            System.out.println("rhs=" + rhsValue);
            if (lhsValue == null && rhsValue == null) {
                return true;
            } else if (lhsValue == null || rhsValue == null) {
                return false;
            } else {
                boolean bothNumbers = true;
                try {
                    Float.parseFloat(String.valueOf(lhsValue));
                    Float.parseFloat(String.valueOf(rhsValue));
                } catch (NumberFormatException e) {
                    bothNumbers = false;
                }

                String evalStr = null;
                
                if (bothNumbers) {
                    evalStr = String.valueOf(lhsValue) + " " 
                        + convertOperatorString(condition.operator)
                        + " " + String.valueOf(rhsValue);
                } else {
                    evalStr = "'" + String.valueOf(lhsValue) + "' " 
                        + convertOperatorString(condition.operator)
                        + " '" + String.valueOf(rhsValue) + "'";
                }

                System.out.println("evalScript [" + evalStr + "]");
                scriptValue = scriptEngine.execute(currentPage, evalStr, "custom_script", 1);
                System.out.println("scriptValue:" + scriptValue);

                boolean retValue = new Boolean(scriptValue + "").booleanValue();
                return retValue;
            }
        } else if (dsl != null) {
            RuntimeDataset ds = context.getDataset(dsl.dsname);
            return ds.hasMore();
        } else {
            throw new RuntimeException("cannot evaluate this container!");
        }
    }

    private String convertOperatorString(String op) {
        if (op.equals("eq")) {
            return "==";
        } else if (op.equals("gt")) {
            return ">";
        } else if (op.equals("lt")) {
            return "<";
        } else if (op.equals("ge")) {
            return ">=";
        } else if (op.equals("le")) {
            return "<=";
        } else if (op.equals("ne")) {
            return "!=";
        } else {
            throw new RuntimeException("operator not recognized!" + op);
        }
    }

    /*
    private boolean evaluateGotoAction_2(InterpreterContext context, Action action) {
        Object scriptValue = context.getBrowser().getScriptEngine().execute(
                findFrame(context, action.frameSequence, action.window), action.xpath, "custom_script");

        String output = scriptValue + "";

        Action.GotoDetails gd = action.getGotoDetails();

        if (gd.operateOn.equals("bool") || gd.operateOn.equals("str")) {
            if (gd.operator.equals("eq")) {
                return output.equals(action.value);
            } else if (gd.operator.equals("ne")) {
                return ! output.equals(action.value);
            } else {
                throw new RuntimeException("operator '" + gd.operator + " is not supported for " + gd.operateOn);
            }
        } else {
        }
    }

    private boolean evaluateGotoAction_1(InterpreterContext context, Action action) {
        Object scriptValue = context.getBrowser().getScriptEngine().execute(
                findFrame(context, action.frameSequence, action.window), action.xpath, "custom_script");

        String output = scriptValue + "";

        Action.GotoDetails gd = action.getGotoDetails();

        if (gd.operateOn.equals("bool") || gd.operateOn.equals("str")) {
            if (gd.operator.equals("eq")) {
                return output.equals(action.value);
            } else if (gd.operator.equals("ne")) {
                return ! output.equals(action.value);
            } else {
                throw new RuntimeException("operator '" + gd.operator + " is not supported for " + gd.operateOn);
            }
        } else {
        }
    }

    private boolean evaluateGotoAction_3(InterpreterContext context, Action action) {
        Object scriptValue = context.getBrowser().getScriptEngine().execute(
                findFrame(context, action.frameSequence, action.window), action.xpath, "custom_script");

        String output = scriptValue + "";

        Action.GotoDetails gd = action.getGotoDetails();

        if (gd.operateOn.equals("bool") || gd.operateOn.equals("str")) {
            if (gd.operator.equals("eq")) {
                return output.equals(action.value);
            } else if (gd.operator.equals("ne")) {
                return ! output.equals(action.value);
            } else {
                throw new RuntimeException("operator '" + gd.operator + " is not supported for " + gd.operateOn);
            }
        } else {
        }
    }
    */

    private boolean evaluateGotoAction(InterpreterContext context, Action action) {
        Object scriptValue = context.getBrowser().getJavaScriptEngine().execute(
                findFrame(context, action.frameSequence, action.window), action.xpath, "custom_script", 1);

        String output = scriptValue + "";

        Action.GotoDetails gd = action.getGotoDetails();

        if (gd.operateOn.equals("bool") || gd.operateOn.equals("str")) {
            if (gd.operator.equals("eq")) {
                return output.equals(action.value);
            } else if (gd.operator.equals("ne")) {
                return ! output.equals(action.value);
            } else {
                throw new RuntimeException("operator '" + gd.operator + " is not supported for " + gd.operateOn);
            }
        } else if (gd.operateOn.equals("num")) {
            float outputF = Float.parseFloat(output);
            float compareTo = Float.parseFloat(action.value);

            if (gd.operator.equals("eq")) {
                return outputF == compareTo;
            } else if (gd.operator.equals("ne")) {
                return outputF != compareTo;
            } else if (gd.operator.equals("gt")) {
                return outputF > compareTo;
            } else if (gd.operator.equals("ge")) {
                return outputF >= compareTo;
            } else if (gd.operator.equals("lt")) {
                return outputF < compareTo;
            } else if (gd.operator.equals("le")) {
                return outputF <= compareTo;
            } else {
                throw new RuntimeException("operator '" + gd.operator + " is not supported for num.");
            }
        } else if (gd.operateOn.equals("loop_on_dataset")) {
            RuntimeDataset ds = context.getDataset(gd.operator);
            ds.incrementLoop();
            return ds.hasMore();
        } else {
            throw new RuntimeException("operation on '" + gd.operateOn + " is not supported.");
        }
    }

    private boolean findText(InterpreterContext context, String frameSequence,
            String winref, String xpathStr, String txt) throws InterpreterException {
        HtmlPage currentPage = findFrame(context, frameSequence, winref);
        if (currentPage != null) {
            String pageTxt = currentPage.asText();
            if (pageTxt.indexOf(txt) != -1) {
                return true;
            } else {
                return false;
            }
        } else {
            throw new InterpreterException("current page is null", context);
        }
    }

    private HtmlPage findFrame(InterpreterContext context, String frameSequence, String winref) {
        HtmlPage currentPage = null;
        WebWindow currentWindow;

        currentWindow = context.getWindowListener().getWindowByName(winref);

        if (currentWindow != null) {
            currentPage = ((HtmlPage) currentWindow.getEnclosedPage());
            if (! "".equals(frameSequence)) {
                logger.debug("looking for frame-sequence: " + frameSequence);
                String[] frames = frameSequence.split(",");
                for (int i = frames.length - 1; i >= 0; i--) {
                    String frame = frames[i];
                    this.logger.debug("Looking for frame: " + frame 
                            + ", current page name: " + currentPage.getEnclosingWindow().getName());
                    FrameWindow fws[] = (FrameWindow[]) currentPage.getFrames().toArray(new FrameWindow[0]);
                    for (int j = 0; j < fws.length; j++) {
                        logger.debug("have frame: " + fws[j].getName());
                    }
                    FrameWindow fw = currentPage.getFrameByName(frame);
                    if (fw != null) {
                        currentPage = (HtmlPage) fw.getEnclosedPage();
                        this.logger.debug("found frame: " + frame);
                    } else {
                        logger.fatal((i+1) + " frame '" + frame 
                                + "' not found. Framesequence was " + frameSequence);
                        return null;
                    }
                }
            }
        } else {
            logger.fatal("cannot find window by name: '" + winref + "'");
        }
        return currentPage;
    }

    private HtmlElement findElement(InterpreterContext context,
            String frameSequence, String winref, String xpathStr) {
        HtmlPage currentPage = findFrame(context, frameSequence, winref);
        if (currentPage != null) {
            HtmlElement elementFound = findElement(context, currentPage, xpathStr);
            if (elementFound == null) {
                // wait for a couple of seconds?
                try { Thread.sleep(2000); } catch (Exception e) { }
                elementFound = findElement(context, currentPage, xpathStr);
                if (elementFound != null) {
                    return elementFound;
                } else {
                    logger.fatal("element not found " + xpathStr);
                    return null;
                }
            } else {
                return elementFound;
            }
        } else {
            logger.fatal("current page is null");
        }
        return null;
    }

    private HtmlElement findElement(InterpreterContext context, HtmlPage page, String xpathStr) {
        TG4W_XPath xpath = null;
        try {
            xpath = TG4W_XPathParser.parseXPath(xpathStr);
            context.xpath = xpath;
        } catch (TG4W_XPathParseError e) {
            logger.fatal("could not parse xpath: " + xpathStr);
        }
        TG4W_XPathPart parts[] = xpath.getParts();
        boolean findRecursive = false;
        HtmlElement elementFound = page.getDocumentElement();
        for (int xpathPartCount = 0; xpathPartCount < parts.length; xpathPartCount++) {
            TG4W_XPathPart part = parts[xpathPartCount];
            context.xpathPart = part;
            String elementName = part.getElementName();
            if (elementName.equals("*")) {
                findRecursive = true;
            } else {
                TG4W_XPathPredicate predicates[] = part.getPredicates();
                if (predicates.length == 1 && predicates[0].isId()) {
                    try {
                        elementFound = elementFound.getHtmlElementById(predicates[0].getValue());
                    } catch (ElementNotFoundException e) {
                        logger.warning("ElementNotFoundException thrown: " + e.getMessage());
                        elementFound = null;
                    }
                    if (elementFound == null) {
                        logger.fatal("Element with ID not found: " + predicates[0].getValue());
                        return null;
                    }
                } else {
                    if (true) {
                        logger.info("finding generic element name '" + elementName + "'");
                        List list = elementFound.getHtmlElementsByTagName(elementName.toLowerCase());
                        if (list == null || list.size() == 0) {
                            logger.fatal("element " + elementName + " not found!");
                            return null;
                        } else {
                            if (predicates.length == 1 && predicates[0].isNumber()) {
                                List topLevelList = this.filterOnlyTopLevel(list, elementFound, elementName.toLowerCase());
                                // negate 1 because xpath predicates always start from 1
                                int indexReq = (int) Float.parseFloat(predicates[0].getValue()) - 1;
                                if (indexReq < topLevelList.size()) {
                                    elementFound = (HtmlElement) topLevelList.get(indexReq);
                                } else {
                                    logger.fatal("Requesting index: " + (indexReq + 1) 
                                            + " list has only " + topLevelList.size() + " elements");
                                    return null;
                                }
                            } else {
                                for (int el = 0; el < list.size(); el++) {
                                    HtmlElement e2check = (HtmlElement) list.get(el);
                                    boolean success = true;
                                    for (int pc = 0; success && pc < predicates.length; pc++) {
                                        String name = predicates[pc].getAttrName();
                                        String val = predicates[pc].getValue();
                                        String eAttrVal = "";
                                        if (name.equals("CDATA")) {
                                            eAttrVal = HtmlUnitWorkArounds.elementAsText(e2check);
                                        } else {
                                            if (e2check.isAttributeDefined(name)) {
                                                eAttrVal = e2check.getAttributeValue(name);
                                            } else {
                                                // if there is no such attribute, this is ruled out
                                                success = false;
                                            }
                                        }
                                        logger.debug("Comparing: '" + eAttrVal + "' and expected: '" + val + "'");
                                        if (! eAttrVal.equals(val)) {
                                            success = false;
                                        }
                                    }
                                    if (success) {
                                        elementFound = e2check;
                                        break;
                                    } else if (el == list.size() - 1) {
                                        logger.fatal("element " + elementName + " not found!. Ran out of elements!");
                                        return null;
                                    } else {
                                        // move on to the next
                                    }
                                }
                            }
                        }
                    }
                }
                findRecursive = false;
            }
        }
        return elementFound;
    }

    private List filterOnlyTopLevel(List list, HtmlElement parentNode, String tagName) {
        List newList = new LinkedList();
        String parentXpath = getXpath(parentNode);
        for (int i = 0; i < list.size(); i++) {
            HtmlElement e = (HtmlElement) list.get(i);
            String xpath = getXpath(e);
            xpath = xpath.substring(parentXpath.length());
            if (xpath.split("/" + tagName.toLowerCase()).length == 2) {
                newList.add(e);
                logger.debug("Adding: " + xpath);
            } else {
                logger.debug("Discarding: " + xpath);
            }
        }
        return newList;
    }

    private String getXpath(DomNode e) {
        String path = e.getNodeName();
        DomNode parent = e.getParentNode();
        if (parent != null) {
            Iterator children = parent.getChildIterator();
            int counter = 0;
            while (children.hasNext()) {
                DomNode child = (DomNode) children.next();
                if (child.equals(e)) {
                    break;
                } else {
                    counter ++;
                }
            }
            path = getXpath(parent) + "/" + path + "[" + counter + "]";
        }
        return path;
    }

    public static void main(String args[]) throws InterpreterException, NumberFormatException, IOException {
        InterpreterConfig config = generateConfigFromCmdLineArgs(args, false);
        config.dump();
        HtmlUnitInterpreter interpreter = new HtmlUnitInterpreter(config);

        if (config.files2run == null && config.dirs2run == null) {
            System.out.println("--input-files or --input-dirs is a required paramter");
            System.exit(1);
        }

        if (config.files2run != null) {
            for (int i = 0; i < config.files2run.length; i++) {
                interpreter.addTestFile(config.files2run[i].trim());
            }
        }
        try {
            interpreter.runAll();
        } catch (InterpreterException e) {
            System.out.println("------------- ERROR ---------------- ");
            System.out.println(e.getMessage());
            System.out.println("------------------------------------ ");
        }

        //System.exit(0);
    }

    public static InterpreterConfig generateConfigFromCmdLineArgs(String[] args, boolean defaultLogger) throws IOException {
        CommandLineParser parser = new CommandLineParser(args);
        String files2run = parser.getValue("input-files");
        String dirs2run = parser.getValue("input-dirs");
        String recurse = parser.getValue("recurse");
        String pattern = parser.getValue("pattern");
        String debugDir = parser.getValue("debug-dir");
        String debugLevel = parser.getValue("debug-level", "DEBUG");
        String datasetMap = parser.getValue("dataset-map", null);
        boolean noEasyHttps = parser.hasKey("no-easy-https");
        boolean enableUI = parser.hasKey("enable-ui");
        boolean enableCaching = parser.hasKey("enable-caching");
        long thinkTime = parser.getLongValue("think-time", -1);
        debugLevel = debugLevel.toUpperCase();

        if (debugLevel.equals(TestResult.LOG_NAME[TestResult.LOG_CRAZY])) {
            System.setProperty("org.apache.commons.logging.Log", "org.apache.commons.logging.impl.SimpleLog");
            System.setProperty("org.apache.commons.logging.simplelog.showdatetime", "true");
            System.setProperty("org.apache.commons.logging.simplelog.log.httpclient.wire.header", "debug");
            System.setProperty("org.apache.commons.logging.simplelog.log.org.apache.commons.httpclient", "debug");
            System.getProperties().put("org.apache.commons.logging.simplelog.defaultlog", "trace");
        }

        InterpreterConfig config = new InterpreterConfig();
        config.debugDir         = debugDir;
        config.debugLevel       = debugLevel;
        config.swingUiEnabled   = enableUI;
        config.easyHttps        = ! noEasyHttps;
        config.enableCaching    = enableCaching;
        config.thinkTime        = thinkTime;
        config.datasetMap       = datasetMap;

        if (files2run != null) {
            config.files2run = files2run.split(",");
        }
        if (dirs2run != null) {
            config.dirs2run = dirs2run.split(",");
        }

        if (defaultLogger) {
            String filename = config.reportFile;
            if (! (new File(filename)).isAbsolute() && config.debugDir != null) {
                filename = config.debugDir + File.separator + filename;
            }
            config.logger = new XmlTestResultImpl(filename, null);
            config.logger.setDebugLevel(config.debugLevel);
        }
        return config;
    }

}
