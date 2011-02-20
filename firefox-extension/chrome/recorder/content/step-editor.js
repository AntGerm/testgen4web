function Tg4wStepEditor() {
    this.clbkFunction = function(action) {
        return true;
    };
}

Tg4wStepEditor.prototype.registerCallback = function (clbkFunction) {
    this.clbkFunction = clbkFunction;
}

Tg4wStepEditor.prototype.editStep = function (action) {
    this.clbkFunction("refresh");
}

Tg4wStepEditor.prototype.sendCommand = function (cmd) {
    this.clbkFunction(cmd);
}
