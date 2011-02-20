com.spikesource.tg4w.editStepRecorder = null;
com.spikesource.tg4w.wasDetached = false;

function onLoad() {
}

function openingYou(rec) {
    hideAll();
    com.spikesource.tg4w.editStepRecorder = rec;
    com.spikesource.tg4w.recorder = rec;
    rec.addEditStepEditorCallback(editStepEditorCallback);
    if (window.arguments[0].wasdetached) {
        com.spikesource.tg4w.wasDetached = true;
    }
}

function closingYou(recorder) {
    recorder.removeEditStepEditorCallback(editStepEditorCallback);
}

function editStepEditorCallback(recorder, fctn) {
    if (fctn == "edit") {
        editStepRender(recorder, arguments[2]);
    } else if (fctn == "new") {
        var stepIndex = createNewStep(recorder, arguments[2], recorder.editorCallback(recorder, "getSelectStart"), recorder.editorCallback(recorder, "getSelectEnd"));
        if (stepIndex && stepIndex >= 0) {
            recorder.editorCallback(recorder, "newStep", stepIndex);
        }
    } else if (fctn == "save") {
        editStepSave(recorder);
    } else if (fctn == "cancel") {
        editStepCancel(recorder);
    }
}

var hide_containers = [
    "edit_type_loop-dataset",
    "edit_type_loop-condition",
    "edit_type_condition",
    "edit_type_others",
    "edit_type_gotolabel",
    "edit_type_goto",
    "edit_type_sleep",
    "edit_type_setvar",
    "edit_type_execjs",
    "edit_container"
];

function hideAll() {
    for (var i = 0; i < hide_containers.length; i ++) {
        $(hide_containers[i]).style.display = "none";
    }
}

function showContainer(id) {
    $(id).style.display = "block";
    $("edit_container").style.display = "inline";
}

var currentEditingAction = null;
function editStepRender(recorder, actionNum) {
    var action = recorder.getActions()[actionNum];
    currentEditingAction = action;
    $("edit_step_label").value = action.label;
    hideAll();
    if (action.action.indexOf("loop-") == 0) {
        if (action.action.indexOf("loop-dataset-") == 0) {
            $("edit_container_step_type").value = "loop-dataset";
        } else {
            $("edit_container_step_type").value = "loop-condition";
        }
        if ($("edit_container_step_type").value == "loop-dataset") {
            var match2 = action.action.match(/^loop-dataset-(.*)-(.*)$/);
            showContainer("edit_type_loop-dataset");
            $("edit_type_loop-dataset_dataset").value = match2[1];
            $("edit_type_loop-dataset_varname").value = match2[2];
            tg4w_populateSelectWithValues("edit_type_loop-dataset_dataset", recorder.getDatasetNames());
        } else {
            var match2 = action.action.match(/^loop-condition-(.*)$/);
            showContainer("edit_type_loop-condition");
            $("edit_type_loop-condition_operator").value = match2[1];
            $("edit_type_loop-condition_lhs_expr").value = action.xpath;
            $("edit_type_loop-condition_rhs_expr").value = action.value;
        }
    } else if (action.action.indexOf("condition-") == 0) {
        var match = action.action.match(/^condition-(.*)$/);
        $("edit_container_step_type").value = "condition";
        showContainer("edit_type_condition");
        $("edit_type_condition_operator").value = match[1];
        $("edit_type_condition_lhs_expr").value = action.xpath;
        $("edit_type_condition_rhs_expr").value = action.value;
    } else if (action.action.indexOf("goto-label") == 0) {
        $("edit_container_step_type").value = "goto-label";
        var match = action.action.match(/^goto-label-(.*)$/);
        showContainer("edit_type_gotolabel");
        $("edit_container_step_gotolabel_label").value = action.value;
        $("edit_container_step_gotolabel_js").value = action.xpath;
    } else if (action.action.indexOf("goto") == 0) {
        $("edit_container_step_type").value = "goto";
        showContainer("edit_type_goto");
        $("edit_container_step_goto_url").value = action.value;
    } else if (action.action.indexOf("wait-for-ms") == 0) {
        $("edit_container_step_type").value = "sleep";
        $("edit_container_step_sleep_time").value = action.value;
        showContainer("edit_type_sleep");
    } else if (action.action.indexOf("setvar-") == 0) {
        $("edit_container_step_type").value = "setvar";
        showContainer("edit_type_setvar");
        var match = action.action.match(/^setvar-(.*)-(.*)$/);
        var varnames = getVarNames(recorder);
        $("edit_container_step_setvar_name").options.length = 0;
        var vc = 1;
        $("edit_container_step_setvar_name").options[0] = new Option("", "");
        for (name in varnames) {
            $("edit_container_step_setvar_name").options[vc] = new Option(name, name);
            vc ++;
        }
        $("edit_container_step_setvar_name").value = match[1];
        $("edit_container_step_setvar_type").value = match[2];
        $("edit_container_step_setvar_js").value = action.xpath;
    } else if (action.action.indexOf("exec-js") == 0) {
        $("edit_container_step_type").value = "exec-js";
        showContainer("edit_type_execjs");
        $("edit_container_step_exec_js").value = action.value;
    } else {
        showContainer("edit_type_others");
        $("edit_container_step_type").value = "others";
        $("edit_container_step_others_action").value = action.action;
        $("edit_container_step_others_xpath").value = action.xpath;
        $("edit_container_step_others_value").value = action.value;
        $("edit_container_step_others_pagerefreshed").value = action.pagerefreshed;
        $("edit_container_step_others_ajaxcount").value = action.ajaxCount;
    }
}

function tg4w_newVarname() {
    var name = prompt("Enter a new variable name:");
    if (name) {
        var len = $("edit_container_step_setvar_name").options.length;
        $("edit_container_step_setvar_name").options[len] = new Option(name, name);
        $("edit_container_step_setvar_name").value = name;
    }
}

function tg4w_populateSelectWithValues(id, values) {
    var elem = $(id);
    elem.options.length = 0;
    for (var i = 0; i < values.length; i ++) {
        elem.options[i] = new Option(values[i], values[i]);
    }
}

function editStepCancel() {
    hideAll();
}

function editStepSave(recorder) {
    if (!recorder) {
        recorder = window.arguments[0].recorder;
    }

    if (currentEditingAction != null) {
        var editingAction = $("edit_container_step_type").value;
        var action = currentEditingAction;
        action.label = $("edit_step_label").value;
        if (editingAction == "loop-dataset") {
            action.action = "loop-dataset-"
                + $("edit_type_loop-dataset_dataset").value + "-"
                + $("edit_type_loop-dataset_varname").value;
        } else if (editingAction == "loop-condition") {
            action.action = "loop-condition-" + $("edit_type_loop-condition_operator").value;
            action.xpath = $("edit_type_loop-condition_lhs_expr").value;
            action.value = $("edit_type_loop-condition_rhs_expr").value;
        } else if (editingAction == "condition") {
            action.action = "condition-" + $("edit_type_condition_operator").value;
            action.xpath = $("edit_type_condition_lhs_expr").value;
            action.value = $("edit_type_condition_rhs_expr").value;
        } else if (editingAction == "others") {
            action.xpath = $("edit_container_step_others_xpath").value;
            action.value = $("edit_container_step_others_value").value;
            action.pagerefreshed = $("edit_container_step_others_pagerefreshed").value;
        } else if (editingAction.indexOf("goto-label") == 0) {
            action.value = $("edit_container_step_gotolabel_label").value;
            action.xpath = $("edit_container_step_gotolabel_js").value;
        } else if (editingAction.indexOf("goto") == 0) {
            action.xpath = "*";
            action.value = $("edit_container_step_goto_url").value;
        } else if (editingAction.indexOf("sleep") == 0) {
            action.value = $("edit_container_step_sleep_time").value;
        } else if (editingAction.indexOf("setvar") == 0) {
            action.action = "setvar-" + $("edit_container_step_setvar_name").value + "-" + $("edit_container_step_setvar_type").value;
            action.xpath = $("edit_container_step_setvar_js").value;
        } else if (editingAction == "exec-js") {
            action.action = "exec-js";
            action.value = $("edit_container_step_exec_js").value;
        } else {
            alert("cannot recognize action type:" + editingAction);
        }
        recorder.editorCallback(recorder, "load");
    }
}

function getVarNames(recorder) {
    var names = {};
    var actions = recorder.getActions();
    for (var i = 0; i < actions.length; i ++) {
        var match = actions[i].isVariableAction();
        if (match) {
            names[match[1]] = ({name:match[1], type:match[2]});
        }
    }
    return names;
}

function createNewStep(recorder, createType, selectStart, selectEnd) {
    if (selectStart == undefined || selectEnd == undefined || selectStart == -1 || selectEnd == -1) {
        alert("select existing step(s) for insert position.");
        recorder.log("ss, se: " + selectStart + " " + selectEnd);
        return;
    }
    if (!createType) {
        createType = $("new-step").value;
    }

    var newa = new com.spikesource.tg4w.Action("", "", "", "", "");
    if (createType == "goto-href") {
        newa.action = "goto";
    } else if (createType == "goto-label") {
        newa.action = "goto-label";
    } else if (createType == "sleep") {
        newa.action = "wait-for-ms";
    } else if (createType == "exec-js") {
        newa.action = "exec-js";
    } else if (createType == "setvar") {
        newa.action = "setvar--num";
    } else if (createType == "loop-dataset") {
        createContainerAroundSelectedNodes(recorder, "loop-dataset", selectStart, selectEnd);
    } else if (createType == "loop-condition") {
        createContainerAroundSelectedNodes(recorder, "loop-condition", selectStart, selectEnd);
    } else if (createType == "condition-simple") {
        createContainerAroundSelectedNodes(recorder, "condition", selectStart, selectEnd);
    }

    if (newa.action != "") {
        recorder.getActions().splice(selectStart, 0, newa);
    }

    recorder.editorCallback(recorder, "load");
    return selectStart;
}

function createContainerAroundSelectedNodes(recorder, type, selectStart, selectEnd) {
    var typeAction = null;
    if (type == "loop-condition") {
        typeAction = "loop-condition-ge";
    } else if (type == "loop-dataset") {
        typeAction = "loop-dataset-dsname-varname";
    } else if (type == "condition") {
        typeAction = "condition-eq";
    } else {
        alert("unknown container type: " + type);
        return;
    }
    var actionStart = new com.spikesource.tg4w.Action(typeAction , "lhs", "rhs", "", "", "", 0);
    var actionEnd = new com.spikesource.tg4w.Action("end", "", "", "", "", "", 0);
    var actions = recorder.getActions();

    actions.splice(selectStart, 0, actionStart);
    actions.splice(selectEnd + 2, 0, actionEnd);
}

