/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See http://www.spikesource.com/license/oslicense.html)
 *
 * author: Vinay Srini (vsrini@spikesource.com)
 */
package com.spike.tg4w.common.util;

import java.util.*;
import java.io.*;

public class CommandLineParser {
    public static void main(String args[]) {
        CommandLineParser cmd = new CommandLineParser(args);
        String version = cmd.getValue("reportmeta");
        String[] moduleList = cmd.getValues("complist");
        System.out.println("version:'" + version + "'");
        System.out.println("list:'");
        for (int i = 0; i < moduleList.length; i++) {
            System.out.println(moduleList[i]);
        }
    }

    public CommandLineParser(String[] args) {
        this(args, false);
    }

    Map constants = new HashMap();
    public CommandLineParser(String[] args, boolean debug) {
        if (args != null && args.length > 0) {
            String key = null;
            for (int i = 0; i < args.length; i++) {
                String arg = args[i];
                if (arg.startsWith("--")) {
                    key = arg.substring(2);
                    if (debug) { System.out.println("Found key " + key); }
                    constants.put(key, new LinkedList());
                } else {
                    if (key == null) {
                        throw new RuntimeException("values cannot start without a key.");
                    } else {
                        List values = (List) constants.get(key);
                        if (debug) { System.out.println("  adding " + arg + " to key " + key); }
                        values.add(arg);
                    }
                }
            }
        }
    }
    public boolean hasKey(String key) {
        return constants.get(key) != null;
    }

    public String[] getValues(String key) {
        List list = (List) constants.get(key);
        if (list != null && list.size() > 0) {
            return (String[]) list.toArray(new String[0]);
        } else {
            return null;
        }
    }

    public long getLongValue(String key, long defaultValue) throws NumberFormatException {
        if (!hasKey(key)) {
            return defaultValue;
        } else {
            return Long.parseLong(getValue(key));
        }
    }

    public String getValue(String key, String defaultValue) {
        String[] strArr = getValues(key);
        if (strArr != null && strArr.length > 0) {
            return strArr[0];
        } else {
            return defaultValue;
        }
    }
    public String getValue(String key) {
        String[] strArr = getValues(key);
        if (strArr != null && strArr.length > 0) {
            return strArr[0];
        } else {
            return null;
        }
    }
}
