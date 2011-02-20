/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See http://www.spikesource.com/license/oslicense.html)
 *
 * author: Vinay Srini (vsrini@spikesource.com)
 */
package com.spike.tg4w.common.file;

public class Dataset implements java.io.Serializable {
    private String file;
    private String xpath;
    private String type;
    private String id;
    
    /**
     * Get filename.
     *
     * @return filename as String.
     */
    public String getFile() {
        return file;
    }
    
    /**
     * Set filename.
     *
     * @param filename the value to set.
     */
    public void setFile(String filename) {
        this.file = filename;
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
        this.xpath = xpath;
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
        this.type = type;
    }
    
    /**
     * Get id.
     *
     * @return id as String.
     */
    public String getId() {
        return id;
    }
    
    /**
     * Set id.
     *
     * @param id the value to set.
     */
    public void setId(String id) {
        this.id = id;
    }

    public boolean isCSV() {
        return this.type.equalsIgnoreCase("csv");
    }

    public boolean isXml() {
        return this.type.equalsIgnoreCase("xml");
    }
}
