/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See http://www.spikesource.com/license/oslicense.html)
 *
 * author: Vinay Srini (vsrini@spikesource.com)
 */
package com.spike.tg4w.common.file;

import com.spike.tg4w.common.util.*;
import java.util.regex.*;

public class Action implements java.io.Serializable {
    private static final Pattern gotoP = Pattern.compile("^goto-([a-zA-Z-_0-9]+)-([a-zA-Z_0-9]+)-([a-zA-Z_0-9]+)$");
    private static final Pattern varP = Pattern.compile("^setvar-([a-zA-Z-_0-9]+)-([a-zA-Z_0-9]+)$");

    public String type = "";
    public String xpath = "";
    public String value = "";
    public String pageRefreshed = "";
    public String frameSequence = "";
    public String label = "";
    public String window = ".";
    public int lineNumber = -1;
    public int columnNumber = -1;

    public int actionIndex = -1;

    public Action(int actionIndex) {
        this.actionIndex = actionIndex;
    }

    public int getActionIndex() {
        return this.actionIndex;
    }

    public void dump() {
        TG4WLogger logger = TG4WLogger.getInstance();
        logger.info(this.toString(""));
    }

    public boolean isGotoAction() {
        Matcher m = gotoP.matcher(this.type);
        return m.matches();
    }

    public boolean isContainer() {
        return this.isLoopContainer() || this.isConditionContainer();
    }

    public boolean isLoopContainer() {
        return this.type.indexOf("loop-") == 0;
    }

    public boolean isConditionContainer() {
        return this.type.indexOf("condition-") == 0;
    }

    private static final Pattern conditionLoopP = Pattern.compile("^loop-condition-([a-zA-Z-_0-9]+)$");
    public Action.Condition isConditionLoop() {
        Matcher m = conditionLoopP.matcher(this.type);
        if (m.matches()) {
            Condition cond = new Condition();
            cond.operator = m.group(1);
            return cond;
        } else {
            return null;
        }
    }

    private static final Pattern conditionP = Pattern.compile("^condition-([a-zA-Z-_0-9]+)$");
    public Action.Condition isCondition() {
        Matcher m = conditionP.matcher(this.type);
        if (m.matches()) {
            Condition cond = new Condition();
            cond.operator = m.group(1);
            return cond;
        } else {
            return null;
        }
    }

    public class Condition implements java.io.Serializable {
        public String operator;
    }

    private static final Pattern datasetLoopP = Pattern.compile("^loop-dataset-([a-zA-Z-_0-9]+)-([a-zA-Z-_0-9]+)$");
    public Action.DatasetLoop isDatasetLoop() {
        Matcher m = datasetLoopP.matcher(this.type);
        if (m.matches()) {
            DatasetLoop dl = new DatasetLoop();
            dl.dsname = m.group(1);
            dl.loopVar = m.group(2);
            return dl;
        } else {
            return null;
        }
    }

    public class DatasetLoop implements java.io.Serializable {
        public String dsname;
        public String loopVar;
    }
    public boolean isEndContainer() {
        return this.type.equals("end");
    }

    public boolean isVariableAction() {
        Matcher m = varP.matcher(this.type);
        return m.matches();
    }

    public Action.VariableDetails getVariableDetails() {
        if (isVariableAction()) {
            Matcher m = varP.matcher(this.type);
            m.matches();
            VariableDetails vD = new VariableDetails();
            vD.varname = m.group(1);
            vD.type = m.group(2);
            return vD;
        } else {
            throw new RuntimeException("action: " + this.type + " is not of type 'setvar'");
        }
    }

    public Action.GotoDetails getGotoDetails() {
        if (isGotoAction()) {
            Matcher m = gotoP.matcher(this.type);
            m.matches();
            GotoDetails gD = new GotoDetails();
            gD.label = m.group(1);
            gD.operateOn = m.group(2);
            gD.operator = m.group(3);
            return gD;
        } else {
            throw new RuntimeException("action: " + this.type + " is not of type 'goto'");
        }
    }

    public class GotoDetails implements java.io.Serializable {
        public String label;
        public String operator;
        public String operateOn;

        public String getLabel() {
            return this.label;
        }
    }

    public class VariableDetails implements java.io.Serializable {
        public String varname;
        public String type;
    }

    public String toString(String indent) {
        StringBuffer buffer = new StringBuffer();
        buffer.append(       indent + "action      =" + type);
        buffer.append("\n" + indent + "label       =" + label);
        buffer.append("\n" + indent + "xpath       =" + xpath);
        buffer.append("\n" + indent + "value       =" + value);
        buffer.append("\n" + indent + "pageRefresh =" + pageRefreshed);
        return buffer.toString();
    }

    public void setXmlDocumentLocation(int line, int column) {
        this.lineNumber = line;
        this.columnNumber = column;
    }

    
    /**
     * Get xpath.
     *
     * @return xpath as String.
     */
    public String getXpath() {
        return xpath;
    }
    
    /**
     * Set xpath.
     *
     * @param xpath the value to set.
     */
    public void setXpath(String xpath) {
        this.xpath += xpath;
    }
    
    /**
     * Get value.
     *
     * @return value as String.
     */
    public String getValue() {
        return value;
    }
    
    /**
     * Set value.
     *
     * @param value the value to set.
     */
    public void setValue(String value) {
        this.value += value;
    }

    public void setValue(String value, boolean append) {
        if (append) {
            setValue(value);
        } else {
            this.value = value;
        }
    }

    public void setXpath(String value, boolean append) {
        if (append) {
            setXpath(value);
        } else {
            this.xpath = value;
        }
    }
   
    /**
     * Get pageRefreshed.
     *
     * @return pageRefreshed as String.
     */
    public String getPageRefreshed() {
        return pageRefreshed;
    }
    
    /**
     * Set pageRefreshed.
     *
     * @param pageRefreshed the value to set.
     */
    public void setPageRefreshed(String pageRefreshed) {
        this.pageRefreshed += pageRefreshed;
    }
    
    /**
     * Get type.
     *
     * @return type as String.
     */
    public String getType() {
        return type;
    }
    
    /**
     * Set type.
     *
     * @param type the value to set.
     */
    public void setType(String type) {
        this.type += type;
    }

    public void setFrame(String sequence) {
        if (sequence != null && ! sequence.trim().equals("undefined")) {
            sequence = sequence.trim();
            this.frameSequence = sequence;
        }
    }

    public String getFrame() {
        return this.frameSequence;
    }

    public void setLabel(String val) {
        this.label = val;
    }

    public String getLabel() {
        return this.label;
    }
    
    /**
     * Get window.
     *
     * @return window as String.
     */
    public String getWindow() {
        return window;
    }
    
    /**
     * Set window.
     *
     * @param window the value to set.
     */
    public void setWindow(String window) {
        this.window = window;
    }
}
