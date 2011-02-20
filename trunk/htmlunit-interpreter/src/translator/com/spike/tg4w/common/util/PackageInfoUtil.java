/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See http://www.spikesource.com/license/oslicense.html)
 *
 * author: Vinay Srini (vsrini@spikesource.com)
 */
package com.spike.tg4w.common.util;

public class PackageInfoUtil {
    public static void main(String args[]) throws Exception {
        if (args.length >= 2) {
            String className = args[0];
            String infoNeeded = args[1];
            String message = "";
            Class clazz = null;

            try {
                clazz = Class.forName(className);
            } catch (Exception e) {
                System.out.println("class not found: '" + className + "'");
                return;
            }

            if ("ImplementationVersion".equals(infoNeeded)) {
                final Package aPackage = clazz.getPackage();
                if(aPackage != null) {
                    System.out.print(aPackage.getImplementationVersion());
                    return;
                } else {
                    System.out.println("package for class '" + className + "' not found!");
                    return;
                }
            } else {
                throw new Exception(infoNeeded + " not supported");
            }
        } else {
            throw new Exception("Usage: PackageInfo class-name info-required");
        }
    }
}
