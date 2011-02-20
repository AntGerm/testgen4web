/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See http://www.spikesource.com/license/oslicense.html)
 *
 * author: Vinay Srini (vsrini@spikesource.com)
 */
package com.spike.tg4w.htmlunit;

public class InterpreterConfig {
    public String debugDir = null;
    public TestResult logger = null;
    public boolean stopOnError = false;
    public String debugLevel = null;
    public String reportFile = "tg4w_htmlunit_report.xml";
    public boolean easyHttps = true;
    public boolean swingUiEnabled = false;
    public boolean enableCaching = false;
    // -1 is no think time
    public long thinkTime = -1;
    public String datasetMap = null;

    public String[] files2run = null;
    public String[] dirs2run = null;

    public void dump() {
        System.out.println("debugDir      :" + debugDir);
        System.out.println("stepOnError   :" + stopOnError);
        System.out.println("debugLevel    :" + debugLevel);
        System.out.println("reportFile    :" + reportFile);
        System.out.println("easyHttps     :" + easyHttps);
        System.out.println("swingUiEnabled:" + swingUiEnabled);
        System.out.println("enableCaching :" + enableCaching);
        System.out.println("thinkTime     :" + thinkTime);
        System.out.println("datasetMap    :" + datasetMap);
    }
}
