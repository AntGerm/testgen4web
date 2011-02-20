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
import java.lang.ref.WeakReference;
import com.gargoylesoftware.htmlunit.*;
import com.gargoylesoftware.htmlunit.html.*;
import com.gargoylesoftware.htmlunit.xml.*;

public class Tg4wWebWindowListener implements WebWindowListener {
    Map windowsOpened = new WeakHashMap();
    InterpreterContext context = null;
    int windowCount;
    boolean enableUI = false;
    HTMLView view = null;

    public Tg4wWebWindowListener (InterpreterContext context) {
        this.context = context;
        this.windowCount = 1;
        this.enableUI = context.isSwingUIEnabled();
    }

    public void destroy() {
        windowsOpened = null;
        context = null;
        if (enableUI && view != null) {
            //view.setVisible(false);
            //view = null;
        }
    }

    public synchronized void updateUIWindow(File file) {
        if (this.enableUI && file.exists()) {
            String fileurl = "file:///" + file.getAbsolutePath();
            if (view == null) {
                try {
                    view = new HTMLView();
                } catch (InternalError e) {
                    System.err.println("Error while initializing the HTMLView. disabling UI: [" + e.getMessage() + "]");
                    this.enableUI = false;
                    return;
                }
            }
            view.changeUrl(fileurl);
        }
    }

    //A web window has been closed.
    public void webWindowClosed(WebWindowEvent event) {
        WebWindow newWin = event.getWebWindow();
        String name = newWin.getName();
    }

    //A web window has been opened
    public void webWindowOpened(WebWindowEvent event) {
        WebWindow newWin = event.getWebWindow();
        String name = newWin.getName();
        if (newWin.getName() == null || ! newWin.getName().equals(HtmlUnitInterpreter.MAIN_WINDOW_NAME)) {
            name = "tg4wnamed" + this.windowCount;
            this.windowCount ++;
        }

        this.windowsOpened.put(name, new WeakReference(newWin));
    }

    public WebWindow getMainWindow() {
        return getWindowByName(HtmlUnitInterpreter.MAIN_WINDOW_NAME);
    }

    public WebWindow getWindowByName(String name) {
        if (name == null || name.equals(".")) {
            return getMainWindow();
        }
        WeakReference refWin = (WeakReference) this.windowsOpened.get(name);
        if (refWin != null) {
            return (WebWindow) refWin.get();
        } else {
            return null;
        }
    }

    //The contents of a web window has been changed
    public void webWindowContentChanged(WebWindowEvent event) {
        try {
            if (this.context.getDebugDir() != null) {
                String contentType = "html";
                if (event.getNewPage() instanceof TextPage) contentType = "txt";
                else if (event.getNewPage() instanceof XmlPage) contentType = "xml";
                else if (event.getNewPage() instanceof JavaScriptPage) contentType = "xml";
                else if (event.getNewPage() instanceof UnexpectedPage) contentType = "unknown.txt";

                String content = event.getNewPage().getWebResponse().getContentAsString();
                String name = event.getWebWindow().getName();
                if (name != null && name.equals(HtmlUnitInterpreter.MAIN_WINDOW_NAME)) {
                    name = "index";
                }
                if (content != null && content.length() > 0) {
                    writeToFile(content, name, contentType);
                } else {
                    this.context.getLogger().info("Not writing file '" + name + "'. Zero size.");
                }
            }
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }

    int pageCount = 0;
    int prevActionNumber = 0;
    private void writeToFile(String content, String name, String type) {
        if (prevActionNumber == this.context.currentActionCount) {
            pageCount ++;
        } else {
            pageCount = 1;
            prevActionNumber = this.context.currentActionCount;
        }

        String outDir = (new File(this.context.currentFile)).getName() + "_files";

        String relPath =  outDir + File.separator 
            + "step-" + this.context.currentActionCount + File.separator
            + name + this.pageCount + "." + type;
        String file = this.context.getDebugDir() + File.separator + relPath;
        try {
            File filep = new File(file);
            File dirp = new File(filep.getParent());
            if (! dirp.exists()) {
                dirp.mkdirs();
            }
            FileWriter writer = new FileWriter(filep);
            writer.write(content);
            writer.close();
            this.context.getLogger().outfile(name, relPath);
            /*
            System.out.println("Wrote file: " + filep.getAbsolutePath());
            System.out.println("Wrote file: " + filep.getPath());
            updateUIWindow(filep);
            */
        } catch (IOException e) {
            this.context.getLogger().warning("Exception writing to file: "
                    + file + ", reason:" + e.getMessage());
        }
    }
}
