var currentPlayingStep = -1;
var tg4wcommon = new com.spikesource.tg4w.Common();
var wasDetached = false;
var unloaded = false;

function onLoad() {
}

function init1(recorder) {
    com.spikesource.tg4w.recorder = window.arguments[0].recorder;

    com.spikesource.tg4w.recorder.addEditorCallback(editorCallback);
    if (window.arguments[0].wasdetached) {
        wasDetached = true;
    }
    if (wasDetached) {
        renderSteps(com.spikesource.tg4w.recorder);
    }
}

function openingYou(recorder) {
    init1(recorder);
    renderSteps(recorder);
}

function closingYou(recorder) {
    com.spikesource.tg4w.recorder.removeEditorCallback(editorCallback);
}

function editorCallback(recorder, fctn) {
    if (fctn == "load") {
        renderSteps(recorder);
    } else if (fctn == "ds-refresh") {
        renderDatasets(recorder);
    } else if (fctn == "up") {
        moveUp(recorder);
    } else if (fctn == "down") {
        moveDown(recorder);
    } else if (fctn == "cut") {
        cut(recorder);
    } else if (fctn == "paste") {
        paste(recorder);
    } else if (fctn == "scroll") {
        startSelect(com.spikesource.tg4w.recorder.getActions().length - 1);
        endSelect(com.spikesource.tg4w.recorder.getActions().length - 1);
        renderSteps(recorder);

        window.scrollTo(0, document.height);
    } else if (fctn == "reset") {
        selectedNodes = [];
        copiedNodes = null;
        renderSteps(recorder);
        currentPlayingStep = -1;
    } else if (fctn == "getSelectStart") {
        if (selectedNodes.length > 0) {
            return selectedNodes[0];
        } else {
            return -1;
        }
    } else if (fctn == "newStep") {
        com.spikesource.tg4w.recorder.log("new step " + arguments[2]);
        startSelect(arguments[2]);
        endSelect(arguments[2]);
        renderSteps(recorder);

        com.spikesource.tg4w.recorder.editStepEditorCallback(recorder, "edit", selectedNodes[0]);
        window.scrollTo(0, tg4wcommon.findPosY($("step_" + arguments[2])));
    } else if (fctn == "getSelectEnd") {
        if (selectedNodes.length > 0) {
            return selectedNodes[selectedNodes.length - 1];
        } else {
            return -1;
        }
    } else if (fctn == "step") {
        var playingNow = arguments[2];
        if (currentPlayingStep == playingNow) return;

        if (currentPlayingStep != -1) {
            var selDiv = $("step_" + currentPlayingStep + "_playing");
            selDiv.style.display = "none";
        }

        var selDiv = $("step_" + playingNow + "_playing");
        selDiv.style.display = "inline";
        window.scrollTo(0, tg4wcommon.findPosY(selDiv));
        currentPlayingStep = playingNow;
    }
}


function getActionType(str) {
    if (str.indexOf("loop") == 0 || str.indexOf("condition") == 0) {
        return "container";
    }

    return str;
}

function deleteAllChildren(node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

var selectedNodes = [];
var copiedNodes = null;

function cut(recorder) {
    if (selectedNodes.length > 0) {
        var start = selectedNodes[0];
        var end = selectedNodes[selectedNodes.length - 1]
        copiedNodes = com.spikesource.tg4w.recorder.getActions().splice(start, (end - start + 1))
        selectedNodes = [];
        renderSteps(recorder);
    }
}

function paste(recorder) {
    if (copiedNodes) {
        var to = selectedNodes[selectedNodes.length - 1];
        for (var i = 0; i < copiedNodes.length; i ++) {
            com.spikesource.tg4w.recorder.getActions().splice(to + i, 0, copiedNodes[i]);
            selectedNodes.push(to + i);
        }
        copiedNodes = null;
        renderSteps(recorder);
    }
}

function moveUp(recorder) {
    if (selectedNodes.length > 0) {
        var start = selectedNodes[0];
        var end = selectedNodes[selectedNodes.length - 1]
        var to = start - 1;
        if (to >= 0) {
            selectedNodes = [];
            _moveMultipleActions(recorder, start, end, to);
            renderSteps(recorder);
        }
    }
}

function moveDown(recorder) {
    if (selectedNodes.length > 0) {
        var start = selectedNodes[0];
        var end = selectedNodes[selectedNodes.length - 1]
        var to = end + 2;
        if (to <= com.spikesource.tg4w.recorder.getActions().length) {
            selectedNodes = [];
            _moveMultipleActions(recorder, start, end, to);
            renderSteps(recorder);
        }
    }
}
function _moveMultipleActions(recorder, start, end, to) {
    var removed = com.spikesource.tg4w.recorder.getActions().splice(start, (end - start + 1))
    if (to > start) {
        to = to - (end - start + 1);
    }
    for (var i = 0; i < removed.length; i ++) {
        com.spikesource.tg4w.recorder.getActions().splice(to + i, 0, removed[i]);
        selectedNodes.push(to + i);
    }
}

function deselectAll() {
    for (var i = 0; i < selectedNodes.length; i ++) {
        var selDiv = $("step_" + selectedNodes[i]);
        selDiv.setAttribute("class", selDiv.getAttribute("class").replace(/ selected/g, ""));
    }
    selectedNodes = [];
}

function isContainer(stepNum) {
    return $("step_" + stepNum).getAttribute("class").indexOf("container") != -1;
}

function isContainerEnd(stepNum) {
    return $("step_" + stepNum).getAttribute("class").indexOf("end") != -1;
}

function clearSelection() {
    try {
        s = window.getSelection(); 
        range = s.getRangeAt(0);
        s.removeRange(range);
    } catch (e) {
    }
}

function endSelect(stepNum) {
    if (selectedNodes.length > 0) {
        var lastStepNum = selectedNodes[selectedNodes.length - 1];
        if (stepNum == lastStepNum && isContainer(lastStepNum)) {
            var child = $("step_" + lastStepNum).firstChild;
            while (child) {
                if (child.nodeType == 1 && child.getAttribute("class").indexOf("step") != -1) {
                    selectedNodes.push(parseInt(child.getAttribute("id").split("_")[1]));
                }
                child = child.nextSibling;
            }
        } else if (stepNum > lastStepNum) {
            var child = $("step_" + lastStepNum).nextSibling;
            if (isContainerEnd($("step_" + lastStepNum).getAttribute("id").split("_")[1])) {
                child = $("step_" + lastStepNum).parentNode.nextSibling;
            }
            while (child) {
                if (child.getAttribute("id").split("_")[1] == stepNum) {
                    break;
                } else {
                    child = child.nextSibling;
                }
            }
            if (child) {
                for (i = lastStepNum + 1; i <= stepNum; i ++) {
                    selectedNodes.push(parseInt(i));
                }
            } else {
                startSelect(stepNum);
            }
        } else if (stepNum < lastStepNum) {
            startSelect(stepNum);
            endSelect(lastStepNum);
        }
    }

    setTimeout("clearSelection();", 500);
}


function highlightAllSelected() {
    for (var i = 0; i < selectedNodes.length; i ++) {
        var selDiv = $("step_" + selectedNodes[i]);
        selDiv.setAttribute("class", selDiv.getAttribute("class").replace(/ selected/g, "") + " selected");
    }
}

function startSelect(stepNum) {
    deselectAll();
    selectedNodes.push(parseInt(stepNum));
}

function keyPressed(div, event) {
    alert(event.target.localName);
    alert(event.target.selectionStart); 
}

function onClick(div, event) {
    var id = div.getAttribute("id").split("_")[1];
    if (event.shiftKey) {
        endSelect(id);
    } else {
        startSelect(id);
        endSelect(id);
    }
    highlightAllSelected();
    showEditBox();
    event.stopPropagation();
}

function onDblClick(div, event) {
    focusStepEdit();
    showEditBox();
    event.stopPropagation();
}

function showEditBox() {
    if (selectedNodes.length > 0 && (isContainer(selectedNodes[0]) || selectedNodes.length == 1)) {
        recorder = window.arguments[0].recorder;
        com.spikesource.tg4w.recorder.editStepEditorCallback(recorder, "edit", selectedNodes[0]);
    }
}

function isEditBoxShowing() {
    recorder = window.arguments[0].recorder;
    return com.spikesource.tg4w.recorder.getDocument().getElementById("edit-right-tabs").selectedIndex == 0;
}

function focusStepEdit() {
    recorder = window.arguments[0].recorder;
    com.spikesource.tg4w.recorder.getDocument().getElementById("edit-right-tabs").selectedIndex = 0;
}

function _editDataset(name) {
    recorder = window.arguments[0].recorder;
    editDatasetFunctions.editDataset(recorder, name);
}

function renderDatasets(recorder) {
    deleteAllChildren($("datasets"));
    var datasetNames = com.spikesource.tg4w.recorder.getDatasetNames();
    for(var i = 0; i < datasetNames.length; i ++) {
        var ds = document.createElement("span");
        ds.setAttribute("id", "ds_" + i);
        ds.setAttribute("class", "dataset");
        ds.setAttribute("onclick", "_editDataset('" + datasetNames[i] + "')");
        ds.innerHTML = datasetNames[i];
        $("datasets").appendChild(ds);
    }

    if (!datasetNames || datasetNames.length == 0) {
        var step = document.createElement("div");
        step.setAttribute("class", "nosteps");
        step.innerHTML = "None";
        $("datasets").appendChild(step);
    }
}

function renderSteps(recorder) {
    deleteAllChildren($("steps"));
    var actions = com.spikesource.tg4w.recorder.getActions();

    var parentNode = $("steps");
    for(var i = 0; i < actions.length; i ++) {
        var action = actions[i];
        var step = document.createElement("div");
        var actionType = getActionType(action.action);

        step.setAttribute("id", "step_" + i);
        step.setAttribute("class", "step " + actionType);
        step.setAttribute("onclick", "onClick(this, event)");
        step.setAttribute("ondblclick", "onDblClick(this, event)");
        step.setAttribute("onkeypress", "keyPressed(this, event)");

        var prefix = "";
        if (action.label != "") {
            prefix = "<span class='label'>" + action.label + "</span> ";
        }

        var suffix = "<span id='step_" + i + "_playing' class='playing'>&gt;&gt;&nbsp;</span>"

        step.innerHTML = suffix + prefix + action.getReadableString();

        parentNode.appendChild(step);
        if (actionType == "container") {
            parentNode = step;
        }
        if (actionType == "end") {
            parentNode = parentNode.parentNode;
        }
    }

    if (actions.length == 0) {
        var step = document.createElement("div");
        step.setAttribute("class", "nosteps");
        step.innerHTML = "None";
        parentNode.appendChild(step);
    }

    highlightAllSelected();
    renderDatasets(recorder);

    // something might have changed
    com.spikesource.tg4w.recorder.showStatusCallback(recorder, "reset");
}
