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
import com.spike.tg4w.common.xpath.*;

import com.gargoylesoftware.htmlunit.*;
import com.gargoylesoftware.htmlunit.html.*;

import java.util.Hashtable;
import java.util.Stack;

public class InterpreterContext implements java.io.Serializable {
    public String currentFile = null;
    public Action currentAction = null;
    public int currentActionCount = -1;
    public TG4W_XPath xpath = null;
    public TG4W_XPathPart xpathPart = null;

    private Action[] actions;
    private Hashtable runtimeVariables = new Hashtable();
    private Hashtable datasets = new Hashtable();

    private Stack containerStack = new Stack();

    transient private WebClient browser = null;
    transient private Tg4wWebWindowListener currentWindowListener = null;
    transient private InterpreterConfig config = null;
    transient private DatasetMapper datasetMapper = null;

    public void destroy() {
        this.currentWindowListener.destroy();
        this.browser = null;
    }

    public InterpreterContext(InterpreterConfig config) throws InterpreterException {
        this.config = config;
        //WebClient browser = new WebClient(BrowserVersion.MOZILLA_1_0);
        this.browser = new WebClient();
        if (this.config.debugLevel.equals(TestResult.LOG_NAME[TestResult.LOG_CRAZY])) {
            this.browser.setHTMLParserListener(HTMLParserListener.LOG_REPORTER);
        }

        if (this.config.enableCaching) {
            System.out.println("Enabling Caching for js files");
            this.browser.setWebConnection(new CachingHttpWebConnection(this.browser, ".+\\.js"));
        }

        this.browser.setThrowExceptionOnScriptError(false);
        this.browser.setAlertHandler(new AlertHandler() {
            public void handleAlert(Page page, String message) {
                logger.warning("Alert message: " + message);
            }
        });

        this.browser.setConfirmHandler(new ConfirmHandler() {
            public boolean handleConfirm(Page page, String message) {
                logger.warning("TODO: Confirming message: " + message);
                return true;
            }
        });

        this.browser.setRefreshHandler(new RefreshHandler() {
            public void handleRefresh(Page page, java.net.URL url, int requestedWait) throws java.io.IOException {
                logger.warning("Page refresh request! Ignoring!: " + url);
            }
        });
        this.browser.setRedirectEnabled(true);


        // initialize window listener, old one needs to be kicked out
        this.currentWindowListener = new Tg4wWebWindowListener(this);

        this.browser.addWebWindowListener(this.currentWindowListener);

        this.browser.openWindow(WebClient.URL_ABOUT_BLANK, HtmlUnitInterpreter.MAIN_WINDOW_NAME);
        //this.browser.openWindow(this.browser.URL_ABOUT_BLANK, HtmlUnitInterpreter.MAIN_WINDOW_NAME);
        this.browser.setCurrentWindow(this.currentWindowListener.getMainWindow());
        // PASS: goto worked

    }

    public void pushContainer(Action action) {
        this.containerStack.push(action);
    }

    public Action popContainer() {
        if (!this.containerStack.empty()) {
            return (Action) this.containerStack.pop();
        } else {
            return null;
        }
    }

    public Action findEnd4Container(Action container) {
        if (container.isContainer()) {
            int stackDepth = 0;
            for (int i = container.actionIndex + 1; i < this.actions.length; i ++) {
                Action a = actions[i];
                if (a.isEndContainer()) {
                    if (stackDepth == 0) { return a; }
                    else { stackDepth --; }
                } else if (a.isContainer()) {
                    stackDepth ++;
                }
            }
        }
        return null;
    }

    public boolean isSwingUIEnabled() {
        return this.config.swingUiEnabled;
    }


    public Tg4wWebWindowListener getWindowListener() {
        return this.currentWindowListener;
    }

    public WebClient getBrowser() {
        return this.browser;
    }

    public void setDatasets(Dataset[] datasets) throws InterpreterException {
        if (datasets != null) {
            logger.info("setDatasets: Total datasets:" + datasets.length);
        } else {
            logger.info("setDatasets: No datasets");
        }

        for (int i = 0; i < datasets.length; i++) {
            Dataset dataset = datasets[i];
            fixDataset(dataset);
            logger.info("setDatasets: initializing dataset: " + datasets[i].getId()
                    + " with file " + dataset.getFile());
            this.datasets.put(dataset.getId(), new RuntimeDataset(dataset, this));
        }
    }

    private void fixDataset(Dataset ds) throws InterpreterException{
        if (this.datasetMapper == null) {
            try {
                this.datasetMapper = new DatasetMapper(this.config.datasetMap, this);
            } catch (java.io.IOException e) {
                throw new InterpreterException(e, this);
            }
        }

        String filename = this.datasetMapper.getFile(this.currentFile, ds.getId());
        if (filename != null) {
            if (new java.io.File(filename).exists()) {
                ds.setFile(filename);
                logger.info("dataset '" + ds.getId() + " is assigned a new file: " + ds.getFile());
            } else {
                logger.info("cannot find file specified in dataset map: " + filename);
            }
        }
    }

    public Action[] loadFile(String testFile) throws Exception {
        this.currentFile = testFile;
        logger.info("parsing file:" + testFile);
        Actions actionParser = new Actions(testFile);
        logger.debug("Found " + actionParser.getActions().length + " actions.");
        logger.numOfActions(actionParser.getActions().length);
        actions = actionParser.getActions();

        this.setActions(actions);
        this.setDatasets(actionParser.getDatasets());
        return actions;
    }

    public void setActions(Action[] actions) {
        this.actions = actions;
    }

    public Action[] getActions() {
        return this.actions;
    }

    public void clear() {
        currentFile = null;
        currentAction = null;
        currentActionCount = -1;
        TG4W_XPath xpath = null;
        TG4W_XPathPart xpathPart = null;
        this.containerStack.clear();
    }

    private String debugDir = null;
    public String getDebugDir() {
        return this.debugDir;
    }

    public void setDebugDir(String val) {
        this.debugDir = val;
    }

    transient TestResult logger = null;
    public void setLogger(TestResult logger) {
        this.logger = logger;
    }

    public TestResult getLogger() {
        return this.logger;
    }

    public void addVariable(Action.VariableDetails vd, Object value) {
        this.runtimeVariables.put(vd.varname, new RuntimeVariable(vd, value));
        if (value != null) {
            getLogger().info("setting variable:" + vd.varname + " = " + String.valueOf(value));
        } else {
            getLogger().info("setting variable:" + vd.varname + " = null");
        }
    }

    public RuntimeDataset getDataset(String dsname) {
        RuntimeDataset ds = (RuntimeDataset) this.datasets.get(dsname);
        if (ds != null) {
            return ds;
        } else {
            throw new RuntimeException("no such dataset: " + dsname);
        }
    }

    public String getDataFromDataset(String dsname, String xpath) throws InterpreterException {
        RuntimeDataset ds = null;
        if (dsname == null) {
            // try find the variable in any of the datasets
            RuntimeDataset[] sets = (RuntimeDataset[]) this.datasets.values().toArray(new RuntimeDataset[0]);
            for (int i = 0; i < sets.length; i++) {
                if (sets[i].hasVariable(xpath)) {
                    ds = sets[i];
                    break;
                }
            }
        } else {
            ds = (RuntimeDataset) this.datasets.get(dsname);
        }

        if (dsname == null && ds == null) {
            getLogger().warning("Could not find variable:" + xpath + " in any of the datasets");
            return null;
        } else {
            if (ds != null) {
                return ds.getData(this, xpath);
            } else {
                throw new RuntimeException("no such dataset: " + dsname);
            }
        }
    }

    public Object getVariableValue(String varname) throws InterpreterException {
        RuntimeVariable var = (RuntimeVariable) this.runtimeVariables.get(varname);
        if (var != null) {
            return var.value;
        } else {
            String val = getDataFromDataset(null, varname);
            if (val != null) {
                return val;
            } else {
                throw new RuntimeException("no such variable:" + varname);
            }
        }
    }

    public String[] getVariableNames() {
        return (String[]) this.runtimeVariables.keySet().toArray(new String[0]);
    }

    public String getJsEvalPrefix() {
        String[] varnames = getVariableNames();
        StringBuffer buff = new StringBuffer();
        for (int i = 0; i < varnames.length; i++) {
            buff.append("var " + varnames[i] + " = " + getVariableAssignString(varnames[i]) + ";\n");
        }
        return buff.toString();
    }

    private String getVariableAssignString(String varname) {
        RuntimeVariable var = (RuntimeVariable) this.runtimeVariables.get(varname);
        if (var != null) {
            if (var.value != null) {
                if (var.value instanceof Boolean) {
                    return ((Boolean) var.value).toString();
                } else if (var.value instanceof Double) {
                    return ((Double) var.value).toString();
                } else {
                    return "\"" + var.value + "\"";
                }
            } else {
                return null;
            }
        } else {
            throw new RuntimeException("no such variable:" + varname);
        }
    }

    class RuntimeVariable implements java.io.Serializable {
        Action.VariableDetails vd;
        Object value;

        public RuntimeVariable(Action.VariableDetails vd, Object value) {
            this.vd = vd;
            this.value = value;
        }
    }

    public void dump(java.io.PrintStream out) {
        if (out == null) {
            out = System.out;
        }
        String EC = "ERROR CONTEXT: ";
        if (logger != null) {
            logger.info("File: " + currentFile);
        }
        out.println("Action Num : " + currentActionCount);
        if (currentAction != null) {
            out.println("Action     :\n" + currentAction.toString("            "));
        } else {
            out.println("Action     : NULL");
        }
        if (xpath != null) {
            out.println("Xpath      : " + xpath.getRawString());
        } else {
            out.println("XPath      : NULL");
        }
        if (xpathPart != null) {
            out.println("XpathPart  :" + xpathPart.getRawString());
        } else {
            out.println("XPathPart  : NULL");
        }
        out.println("*********************************************");
    }
}
