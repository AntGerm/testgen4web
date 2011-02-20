com.spikesource.tg4w.reportingUILoad = function() {
    var reloadListener = function(name) { this.name = name; }
    reloadListener.prototype = {
        didRebuild : function(builder) {
                if (this.name == "aggfilenamelist") {
                    document.getElementById("filename").textContent = "";
                    document.getElementById("id_report").textContent = "";
                    document.getElementById("id_test").textContent = "";
                    document.getElementById("id_report2").textContent = "";

                    var file = com.spikesource.tg4w.reportingUI.getParameter("file");
                    var reportId = com.spikesource.tg4w.reportingUI.getParameter("report");

                    if (file == null && reportId != null) {
                        file = com.spikesource.tg4w.reportingData.getFilename(reportId);
                    }

                    if (file == null) {
                        file = "_all_";
                    }

                    var list = document.getElementById(this.name);
                    if (file != null) {
                        if (list.itemCount > 0) {
                            for (var i = 0; i < list.itemCount; i ++) {
                                var label = list.getItemAtIndex(i).getAttribute("idreport");
                                if (label == file) {
                                    list.selectedIndex = i;
                                    break;
                                }
                            }
                        }
                    } else {
                        if (list.itemCount > 1) {
                            list.selectedIndex = 1;
                        }
                    }
                    com.spikesource.tg4w.reportingUI.fileChange();
                } else if (this.name == "reports-list" || this.name == "test-report") {
                    var name = this.name;
                    setTimeout(function() {
                        var list = document.getElementById(name);
                        var selectItem = null;

                        var reportId = com.spikesource.tg4w.reportingUI.getParameter("report");
                        if (name == "reports-list" && reportId != null) {
                            for (var i = 0; i < list.itemCount; i ++) {
                                var label = list.getItemAtIndex(i).getAttribute("reportid");
                                if (label == reportId) {
                                    selectItem = list.getItemAtIndex(i);
                                    break;
                                }
                            }
                        } else {
                            selectItem = list.getItemAtIndex(0);
                        }
                        
                        list.selectItem(selectItem);
                        list.ensureElementIsVisible(selectItem);
                    }, 500);
                }
            },
        willRebuild : function(builder) {}
    }

    document.getElementById("aggfilenamelistmenu").builder.addListener(new reloadListener("aggfilenamelist"));
    document.getElementById("reports-list").builder.addListener(new reloadListener("reports-list"));
    document.getElementById("test-report").builder.addListener(new reloadListener("test-report"));

    document.getElementById("aggfilenamelistmenu").builder.rebuild();
}

com.spikesource.tg4w.ReportingUI = function() {}
com.spikesource.tg4w.ReportingUI.prototype = {
    getParameter : function(name) {
        var searchStr = document.location.search;
        var value = null;
        if (searchStr != "") {
            searchStr = searchStr.substring(1); // remove ?
            var split = searchStr.split("&");
            for (var i = 0; i < split.length; i ++) {
                var keyValue = split[i].split("=");
                if (keyValue[0] == name) {
                    value = keyValue[1];
                    break;
                }
            }
        }
        return value;
    },

    fileChange : function() {
        filename = document.getElementById("aggfilenamelist").selectedItem.getAttribute('idreport');
        if (filename) {
            document.getElementById("filename").textContent = filename;
            document.getElementById("reports-list").builder.rebuild();
        }
    },
    reportChange : function(id) {
        if (id) {
            document.getElementById("id_report").textContent = id;
            document.getElementById("id_report2").textContent = id;
            document.getElementById("test-report").builder.rebuild();
            document.getElementById("actions-list").builder.rebuild();
        }
    },
    changeTest : function(id, aid) {
        if (id) {
            document.getElementById("id_test").textContent = id;
            document.getElementById("data-changes").builder.rebuild();

            var elements = document.getElementsByTagName("listitem");
            for (var i = 0; i < elements.length; i ++) {
                var attr = elements[i].getAttribute("aid");
                if (attr == "action" + aid) {
                    document.getElementById("actions-list").selectedItem = elements[i];
                    document.getElementById("actions-list").ensureElementIsVisible(elements[i]);
                    break;
                }
            }
        }
    },
    exportReportAsHtml : function() {
        //com.spikesource.tg4w.reportingData.exportReport(document.getElementById("id_report").textContent);
        alert("Not implemented. Help needed.");
    },
    exportDbAsHtml : function() {
        alert("Not implemented. Help needed.");
    },
    deleteReport : function() {
        if (confirm("Are you sure?")) {
            com.spikesource.tg4w.reportingData.deleteReport(document.getElementById("id_report").textContent);
            document.getElementById("reports-list").builder.rebuild();
        }
    },
    deleteAllReports : function() {
        var filename = document.getElementById("filename").textContent;
        if (confirm("Are you sure you want to delete all reports for " + filename + " ?")) {
            com.spikesource.tg4w.reportingData.deleteAllReports(filename);
            document.getElementById("aggfilenamelistmenu").builder.rebuild();
        }
    },
    purgeDatabase : function() {
        if (confirm("Are you sure you want to purge the entire database?")) {
            com.spikesource.tg4w.reportingData.purgeDatabase();
            document.getElementById("aggfilenamelistmenu").builder.rebuild();
        }
    }
}

com.spikesource.tg4w.reportingUI = new com.spikesource.tg4w.ReportingUI();
com.spikesource.tg4w.reportingData = new com.spikesource.tg4w.TestReport(null);
