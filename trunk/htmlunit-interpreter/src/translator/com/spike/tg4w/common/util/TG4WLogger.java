/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See http://www.spikesource.com/license/oslicense.html)
 *
 * author: Vinay Srini (vsrini@spikesource.com)
 */
package com.spike.tg4w.common.util;

public class TG4WLogger {
    private static final int INFO  = 4;
    private static final int DEBUG = 3;
    private static final int WARN  = 2;
    private static final int ERROR = 1;
    private static final int FATAL = 0;
    private static final String[] typeName = {"FATAL", "ERROR", "WARN", "DEBUG", "INFO"};

    private static TG4WLogger logger = new TG4WLogger();

    private TG4WLogger() {
        // read property file here
    }

    public static TG4WLogger getInstance() {
        return logger;
    }

    private boolean isEnabled(int type) {
        return true;
    }

    final java.text.SimpleDateFormat dateFormat = new java.text.SimpleDateFormat("HH:mm.ss.S");
    private String getTimeString() {
        return (dateFormat.format(new java.util.Date())).toString();
    }

    private void log(String msg, int type) {
        if (isEnabled(type)) {
            System.out.println(typeName[type] + " : " + getTimeString() + " : " + msg);
        }
    }

    public void debug(String msg) {
        log(msg, DEBUG);
    }

    public void info(String msg) {
        log(msg, INFO);
    }

    public void warning(String msg) {
        log(msg, WARN);
    }

    public void error(String msg) {
        log(msg, ERROR);
    }

    public void error(Exception e) {
        e.printStackTrace();
    }

    public void fatal(String msg) {
        log(msg, FATAL);
    }

    public void fatal(Exception e) {
        e.printStackTrace();
    }
}
