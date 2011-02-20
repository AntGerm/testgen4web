/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See http://www.spikesource.com/license/oslicense.html)
 *
 * author: Vinay Srini (vsrini@spikesource.com)
 */
package com.spike.tg4w.htmlunit;

import org.apache.velocity.app.VelocityEngine;
import org.apache.velocity.app.Velocity;
import org.apache.velocity.runtime.RuntimeConstants;
import org.apache.velocity.Template;
import org.apache.velocity.VelocityContext;

import java.util.*;
import java.io.*;
import java.nio.channels.*;

import com.spike.tg4w.common.util.*;
import com.spike.tg4w.common.file.*;
import com.spike.tg4w.common.xpath.*;

public class StandaloneTestGenerator {
    public static void main(String args[]) throws Exception {
        CommandLineParser parser = new CommandLineParser(args);
        String files2run = parser.getValue("input-files");

        org.apache.log4j.Category log = org.apache.log4j.Category.getInstance("velocity");
        VelocityEngine ve = new VelocityEngine();
        ve.setProperty( RuntimeConstants.RUNTIME_LOG_LOGSYSTEM_CLASS,
                "org.apache.velocity.runtime.log.SimpleLog4JLogSystem" );
        ve.setProperty("runtime.log.logsystem.log4j.category", "velocity");
        ve.init();

        StandaloneTestGenerator generator = new StandaloneTestGenerator();
        generator.destDir = parser.getValue("gen-dir");;
        generator.packageName = parser.getValue("package-name", generator.packageName);
        generator.destFilePrefix = parser.getValue("test-prefix", generator.destFilePrefix);

        generator.packageDir = generator.packageName.replace(".", File.separator);

        if (files2run != null) {
            String[] files2runArr = files2run.split(",");
            List instancenames = new LinkedList();
            for (int i = 0; i < files2runArr.length; i ++) {
                String filename = files2runArr[i].trim();
                System.out.println("");
                System.out.println("Parsing file: " + filename);
                instancenames.add(generator.generateTest(filename));
            }

            generator.generateMasterFile(instancenames);
        }
    }

    String destDir = "gen-output";
    String destFilePrefix = "test";
    String metaDir = File.separator + "config";
    String packageName = "gen.tests.htmlunit";
    String packageDir = "gen" + File.separator + "tests" + File.separator + "htmlunit";
    String fridgeName = "frozenfiles";
    int uniqueIdentifier = 1;

    private void copyFile(File in, File out) throws Exception {
        FileChannel sourceChannel = new FileInputStream(in).getChannel();
        FileChannel destinationChannel = new FileOutputStream(out).getChannel();
        sourceChannel.transferTo(0, sourceChannel.size(), destinationChannel);
        sourceChannel.close();
        destinationChannel.close();
    }

    private File freezeFile(String filename) throws Exception {
        File unfrozenFile = new File(filename);
        File fridge = new File(destDir + File.separator + fridgeName);
        File frozenFile = new File(fridge.getAbsolutePath() 
                + File.separator 
                + this.destFilePrefix + (uniqueIdentifier++) + "_" + unfrozenFile.getName());

        System.out.println("    freezing : " + frozenFile.getName());
        copyFile(unfrozenFile, frozenFile);

        return frozenFile;
    }

    public void generateMasterFile(List instancenames) throws Exception {
        Template velTemplate = Velocity.getTemplate(metaDir + File.separator + "standalonerunner.vm");
        System.out.println("Generating master runner");
        File outputfile = new File(destDir + File.separator + "src" + File.separator + this.packageDir + File.separator + "MasterRunner.java");
        if (! outputfile.getParentFile().isDirectory()) {
            outputfile.getParentFile().mkdirs();
        }
        Writer writer = new FileWriter(outputfile);
        VelocityContext context = new VelocityContext();
        context.put("instancenames", instancenames);
        context.put("packageName", this.packageName);
        velTemplate.merge(context, writer );
        writer.close();

        System.out.println("Generating build.xml");
        velTemplate = Velocity.getTemplate(metaDir + File.separator + "build.xml.vm");
        writer = new FileWriter(destDir + File.separator + "build.xml");
        context = new VelocityContext();
        context.put("packageName", this.packageName);
        context.put("instancenames", instancenames);
        velTemplate.merge(context, writer );
        writer.close();

    }

    public String generateTest(String filename) throws Exception {
        File testFile = freezeFile(filename);
        Actions actionParser = new Actions(testFile.getAbsolutePath());
        Action[] actions = actionParser.getActions();

        Template velTemplate = Velocity.getTemplate(metaDir + File.separator + "standalonetemplate.vm");

        String javaname = convert2javaname(testFile.getName());
        System.out.println("    javaname : " + javaname);
        File outputfile = new File(destDir + File.separator + "src" + File.separator + this.packageDir + File.separator + javaname + ".java");
        if (! outputfile.getParentFile().isDirectory()) {
            outputfile.getParentFile().mkdirs();
        }
        Writer writer = new FileWriter(outputfile);
        VelocityContext context = new VelocityContext();
        context.put("actions", actions);
        context.put("javaName", javaname);
        context.put("packageName", this.packageName);
        context.put("frozenFilename", fridgeName + File.separator + testFile.getName());
        context.put("callback", this);
        velTemplate.merge(context, writer );
        writer.close();

        appendDatasetMapping(testFile, destDir + File.separator + "dataset-mapping.prop", actionParser.getDatasets());

        return javaname;
    }

    private void appendDatasetMapping(File filename, String destFile, Dataset[] ds) throws IOException {
        String lineSep = System.getProperty("line.separator");
        if (ds != null && ds.length > 0) {
            FileWriter writer = new FileWriter(destFile, true);
            writer.write("-endswith:" + filename.getName() + lineSep);
            for (int i = 0; i < ds.length; i++) {
                writer.write(ds[i].getId() + " = " + ds[i].getFile() + lineSep);
            }
            writer.write(lineSep);
            writer.close();
        }
    }

    public void warning(String msg) {
        System.out.println("    WARNING: " + msg);
    }

    private String convert2javaname(String name) {
        File file = new File(name);
        name = file.getName();
        name = name.substring(0, name.lastIndexOf("."));
        name = name.replace(".", "_");
        name = name.replace("-", "_");
        return name;
    }
}
