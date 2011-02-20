/**
 * Lets TestGen4Web operate quitely - no generated log files
 * @author fcohen@pushtotest.com
 */

package com.spike.tg4w.htmlunit;

import com.spike.tg4w.htmlunit.TestResult;
import com.spike.tg4w.common.file.Action;
import java.io.IOException;

public class QuietTestResultImpl implements TestResult
{
    private boolean debug = false;

    public QuietTestResultImpl(String filename, String encoding) throws IOException
    {
        if ( debug ) { System.out.println("QuietTestResult: filename=" + filename ); }
    }

    public void setDebug( boolean flag )
    {
        this.debug = flag;
    }

    public void testStart(String filename)
    {
        if ( debug ) { System.out.println("QuietTestResult: testStart=" + filename ); }
    }

    public void testEnd(String filename)
    {
        if ( debug ) { System.out.println("QuietTestResult: testEnd=" + filename ); }
    }

    public void numOfActions(int num)
    {
        if ( debug ) { System.out.println("QuietTestResult: numOfActions=" + num ); }
    }

    public void stepStart(Action action, int num)
    {
        if ( debug ) { System.out.println("QuietTestResult: stepStart Action=" + num ); }
    }

    public void stepEnd(int num)
    {
        if ( debug ) { System.out.println("QuietTestResult: stepEnd=" + num ); }
    }

    public void setDebugLevel(String debugLevel)
    {
        if ( debug ) { System.out.println("QuietTestResult: setDebugLevel=" + debugLevel ); }
    }

    public void finalizeResults()
    {
        if ( debug ) { System.out.println("QuietTestResult: finalizeResults=" ); }
    }

    public void outfile(String name, String relpath)
    {
        if ( debug ) { System.out.println("QuietTestResult: outfile=" + name ); }
    }

    // logging functionality
    public void info(String msg)
    {
        if ( debug ) { System.out.println("QuietTestResult: info=" + msg ); }
    }

    public void debug(String msg)
    {
        if ( debug ) { System.out.println("QuietTestResult: debug=" + msg ); }
    }

    public void warning(String msg)
    {
        if ( debug ) { System.out.println("QuietTestResult: warning=" + msg ); }
    }

    public void error(String msg)
    {
        if ( debug ) { System.out.println("QuietTestResult: error=" + msg ); }
    }

    public void error(String msg, Exception e)
    {
        if ( debug ) { System.out.println("QuietTestResult: error=" + msg ); }
    }

    public void fatal(String msg)
    {
        if ( debug ) { System.out.println("QuietTestResult: fatal=" + msg ); }
    }

    public void fatal(String msg, Exception e)
    {
        if ( debug ) { System.out.println("QuietTestResult with E: fatal=" + msg + ", e=" + e ); }
    }

    public boolean isEnabled(int loglevel)
    {
        return false;
    }
}

