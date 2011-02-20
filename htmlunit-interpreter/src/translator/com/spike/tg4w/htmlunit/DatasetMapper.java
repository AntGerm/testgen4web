/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See http://www.spikesource.com/license/oslicense.html)
 *
 * author: Vinay Srini (vsrini@spikesource.com)
 */
package com.spike.tg4w.htmlunit;

import java.io.*;
import java.util.*;
import java.util.regex.*;

public class DatasetMapper {
    List mappings = new LinkedList();
    InterpreterContext context;

    final Pattern header = Pattern.compile("^-([a-zA-Z-]+):(.*)$");
    final Pattern propertyPattern = Pattern.compile("^([a-zA-Z0-9-._]*)\\s*=\\s*(.*)$");

    public DatasetMapper(String file, InterpreterContext context) throws IOException {
        this.context = context;

        if (file != null && (new File(file)).exists()) {
            BufferedReader reader = new BufferedReader(new FileReader(file));
            String line;
            DatasetMatch lastBucket = null;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (!line.equals("") && !line.startsWith("#")) {
                    Matcher match = header.matcher(line);
                    if (match.matches()) {
                        lastBucket = createConsumer(match.group(1));
                        lastBucket.setPattern(match.group(2));
                        mappings.add(lastBucket);
                    } else {
                        match = propertyPattern.matcher(line);
                        if (match.matches()) {
                            lastBucket.setProperty(match.group(1), match.group(2));
                        } else {
                            this.context.getLogger().warning("dataset mapper: ignoring line '" + line + "'");
                        }
                    }
                }
            }
        }
    }

    public String getFile(String filename, String dsname) {
        for (int i = 0; i < mappings.size(); i++) {
            DatasetMatch matcher = (DatasetMatch) mappings.get(i);
            if (matcher.match(filename)) {
                String val = matcher.getFile(dsname);
                if (val != null && new File(val).exists()) {
                    return val;
                }
            }
        }
        return null;
    }

    public DatasetMatch createConsumer(String type) {
        if (type.equals("endswith")) {
            return new DatasetMatch() {
                public boolean match(String name) {
                    return name.endsWith(this.pattern);
                }
            };
        } else if (type.equals("contains")) {
            return new DatasetMatch() {
                public boolean match(String name) {
                    return name.indexOf(this.pattern) != -1;
                }
            };
        } else if (type.equals("is")) {
            return new DatasetMatch() {
                public boolean match(String name) {
                    return name.equals(this.pattern);
                }
            };
        } else if (type.equals("matches")) {
            return new DatasetMatch() {
                public boolean match(String name) {
                    return Pattern.compile(this.pattern).matcher(name).matches();
                }
            };
        } else {
            throw new RuntimeException("dataset map type: " + type + " not supported");
        }
    }

    abstract class DatasetMatch {
        String pattern; Map keyValues = new HashMap();
        public void setPattern(String pattern) {
            this.pattern = pattern;
        }
        public void setProperty(String key, String value) {
            this.keyValues.put(key, value);
        }
        public String getFile(String dsname) {
            return (String) this.keyValues.get(dsname);
        }
        public abstract boolean match(String name);
    }
}
