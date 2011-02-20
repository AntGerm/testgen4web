/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See http://www.spikesource.com/license/oslicense.html)
 *
 * author: Vinay Srini (vsrini@spikesource.com)
 */
package com.spike.tg4w.htmlunit;

import com.spike.tg4w.common.util.ObjectCloner;

public class InterpreterException extends Exception {
    InterpreterContext context;

    public InterpreterException(String msg, InterpreterContext context) {
        super(msg);
        this.setContext(context);
    }

    public InterpreterException(String msg, Exception cause, InterpreterContext context) {
        super(msg, cause);
        this.setContext(context);
    }

    public InterpreterException(Exception cause, InterpreterContext context) {
        super(cause);
        this.setContext(context);
    }

    private void setContext(InterpreterContext context) {
        try {
            this.context = (InterpreterContext) ObjectCloner.deepCopy(context);
        } catch (Exception e) {
            this.context = context;
            e.printStackTrace();
        }
    }

    public InterpreterContext getContext() {
        return this.context;
    }
}
