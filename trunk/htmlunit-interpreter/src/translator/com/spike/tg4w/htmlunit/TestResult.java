/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See http://www.spikesource.com/license/oslicense.html)
 *
 * author: Vinay Srini (vsrini@spikesource.com)
 */
package com.spike.tg4w.htmlunit;

import com.spike.tg4w.common.file.Action;

public interface TestResult {
    final int LOG_CRAZY = 6;
    final int LOG_CONSOLE_DEBUG = 5;
    final int LOG_DEBUG = 4;
    final int LOG_INFO = 3;
    final int LOG_WARNING = 2;
    final int LOG_ERROR = 1;
    final int LOG_FATAL = 0;

    final String LOG_NAME[] = {"FATAL", "ERROR", "WARNING", "INFO", "DEBUG", "CONSOLE", "CRAZY"};

    public void testStart(String filename);
    public void testEnd(String filename);
    public void numOfActions(int num);

    public void stepStart(Action action, int num);
    public void stepEnd(int num);

    public void setDebugLevel(String debugLevel);

    public void finalizeResults();

    public void outfile(String name, String relpath);

    // logging functionality
    public void info(String msg);
    public void debug(String msg);
    public void warning(String msg);
    public void error(String msg);
    public void error(String msg, Exception e);
    public void fatal(String msg);
    public void fatal(String msg, Exception e);

    public boolean isEnabled(int loglevel);
}
