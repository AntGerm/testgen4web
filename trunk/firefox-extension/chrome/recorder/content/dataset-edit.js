com.spikesource.tg4w.DatasetEditFunctions = function() {
}

com.spikesource.tg4w.DatasetEditFunctions.prototype.editDataset = function (recorder, name) {
    this.prepareDatasetsTab(recorder, name);
    document.getElementById("edit-right-tabs").selectedIndex = 1;
    this.tg4w_datasetSelected(recorder, name);
}

com.spikesource.tg4w.DatasetEditFunctions.prototype.prepareDatasetsTab = function (recorder, selectName) {
    var recorder = com.spikesource.tg4w.recorder;
    var names = recorder.getDatasetNames();
    var list = document.getElementById("dataset-list");
    while (list.firstChild) {
        list.removeChild(list.firstChild);
    }
    names.splice(0, 0, "-- new --");
    var selectIndex = 0;
    for (var i = 0; i < names.length; i ++) {
        var menuitem = document.createElement("menuitem");
        menuitem.setAttribute("label", names[i]);
        if (i == 0) {
            menuitem.setAttribute("value", "");
        } else {
            menuitem.setAttribute("value", names[i]);
            if (selectName && selectName == names[i]) {
                selectIndex = i;
            }
        }
        list.appendChild(menuitem);
    }

    var listContainer = document.getElementById("dataset-list-container");
    listContainer.selectedIndex = selectIndex;
}

com.spikesource.tg4w.DatasetEditFunctions.prototype.tg4w_datasetSaveCommand = function (recorder) {
    var id = document.getElementById("dataset-edit-id").value;
    var xpath = document.getElementById("dataset-edit-xpath").value;
    var filename = document.getElementById("dataset-edit-file").value;
    var type = document.getElementById("dataset-edit-type").selectedItem.label;
    var iterable = document.getElementById("dataset-edit-iterable").selectedItem.value;

    if (id == "" || id == null
        || xpath == "" || xpath == null
        || filename == "" || filename == null) {
        alert("Error: All values are required.");
        return;
    }
    var ds = recorder.getDataset(id);
    if (ds) {
        ds.xpath = xpath;
        ds.filename = filename;
        ds.type = type;
        // reset
        ds.init = false;
        ds.iterable = iterable;
    } else {
        recorder.newDataset(id, xpath, filename, type, iterable);
    }
    document.getElementById("dataset-edit-id").removeAttribute("disabled");
    // clear
    this.tg4w_datasetCancelCommand();
    this.prepareDatasetsTab(recorder);
    recorder.editorCallback(recorder, "ds-refresh");
}

com.spikesource.tg4w.DatasetEditFunctions.prototype.tg4w_datasetDeleteCommand = function (recorder) {
    var id = document.getElementById("dataset-edit-id").value;
    recorder.deleteDataset(id);
    this.tg4w_datasetCancelCommand();
    this.prepareDatasetsTab(recorder);
}

com.spikesource.tg4w.DatasetEditFunctions.prototype.tg4w_datasetCancelCommand = function () {
    document.getElementById("dataset-edit-id").value = "";
    document.getElementById("dataset-edit-xpath").value = "";
    document.getElementById("dataset-edit-file").value = "";
    document.getElementById("dataset-edit-type").value = "csv";
    document.getElementById("dataset-edit-iterable").value = "true";
    document.getElementById("dataset-edit-id").removeAttribute("disabled");
}

com.spikesource.tg4w.DatasetEditFunctions.prototype.tg4w_selectFile = function (elem_id) {
    const nsIFilePicker = Components.interfaces.nsIFilePicker;

    var fp = Components.classes["@mozilla.org/filepicker;1"]
        .createInstance(nsIFilePicker);
    fp.init(window, "Select file to load", nsIFilePicker.modeOpen);
    fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);

    var rv = fp.show();
    if (rv == nsIFilePicker.returnOK) {
        document.getElementById(elem_id).value = fp.file.path;
    }
}

com.spikesource.tg4w.DatasetEditFunctions.prototype.tg4w_datasetSelected = function (recorder, id) {
    document.getElementById("dataset-edit-id").value = id;
    var ds = recorder.getDataset(id);
    if (ds) {
        document.getElementById("dataset-edit-xpath").value = ds.xpath;
        document.getElementById("dataset-edit-file").value = ds.filename;

        var selectedIndex = -1;
        if (ds.type == "xml") selectedIndex = 0; else selectedIndex = 1;
        document.getElementById("dataset-edit-type").selectedIndex = selectedIndex;

        if (ds.iterable == "true") selectedIndex = 0; else selectedIndex = 1;
        document.getElementById("dataset-edit-iterable").selectedIndex = selectedIndex;

        document.getElementById("dataset-edit-id").setAttribute("disabled", "true");
    } else {
        document.getElementById("dataset-edit-xpath").value = "";
        document.getElementById("dataset-edit-file").value = "";
        document.getElementById("dataset-edit-id").removeAttribute("disabled");
    }
}

com.spikesource.tg4w.datasetEditFunctions = new com.spikesource.tg4w.DatasetEditFunctions();
