com.spikesource.tg4w.TestReport = function(recorder) {
    var file = Components.classes["@mozilla.org/file/directory_service;1"]
        .getService(Components.interfaces.nsIProperties)
        .get("ProfD", Components.interfaces.nsIFile);
    file.append("tg4w_test_reports.sqlite");

    var storageService = Components.classes["@mozilla.org/storage/service;1"]
        .getService(Components.interfaces.mozIStorageService);

    this.recorder = recorder;
    this.reporting = false;
    this.reportId = -1;
    this.dbConn = storageService.openDatabase(file); // Will also create the file if it does not exist

    this.initTables();

    this.insertTest = this.dbConn.createStatement(
            "insert into test (id_action, result, reason) values (:id_action, :result, :reason)");
    this.updateTest = this.dbConn.createStatement(
            "update test set result = :result, reason = :reason WHERE id = :id");

    this.selectTest = this.dbConn.createStatement(
            "select id from test where id_action = :id_action order by id desc limit 1");

    this.insertReport = this.dbConn.createStatement(
            "insert into report (filename) values (:filename)");

    this.updateReport = this.dbConn.createStatement(
            "update report set result = :result, updated_date = :updated WHERE id = :id_report");

    this.insertAction = this.dbConn.createStatement(
            "insert into actions (id_report, action, xpath, value, windowref) values (:id_report, :action, :xpath, :value, :windowref)");

    this.insertDataChange = this.dbConn.createStatement(
            "insert into data_change (id_test, type, name, value) values (:id_test, :type, :name, :value)");

    this.deleteReportStmt = this.dbConn.createStatement("delete from report where id = :id_report");
    this.deleteAllReportStmt = this.dbConn.createStatement("delete from report where filename = :filename");

    this.selectReportNamesAggregate = this.dbConn.createStatement("select filename, count(*) as count from report group by filename");
    this.selectReports = this.dbConn.createStatement("select * from report order by id desc");
    this.selectReportById = this.dbConn.createStatement("select * from report where id = :id");
    this.selectActionsForReport = this.dbConn.createStatement("select * from actions where id_report = :id_report");
    this.selectTestsForAction = this.dbConn.createStatement("select * from action_test where id_action = :id_action");

    this.lastInsert = this.dbConn.createStatement("select last_insert_rowid() as id");

    this.table_schema = {
        "report" : [ "id", "filename", "created_date", "updated_date", "result" ],
        "actions" : ["id", "id_report", "action", "xpath", "value", "windowref"],
        "test" : [ "id", "id_action", "result", "reason" ],
        "data_change" : [ "id", "id_test", "type", "name", "value" ],
        "action_test" : ["id_test", "id_report", "id_action", "action", "result", "reason"]
    };

    var callback = function(r, fcntl, name, value) {
        if (name) {
            try {
                if (fcntl == "var-update") {
                    r.reporting.updateDataChange(r.getCurrentAction(), name, "var", r.getVariableVal(name, true));
                } else if (fcntl == "ds-update") {
                    var ds = r.tg4wdh.getDataset(name);
                    var str = "iteration " + (ds.loopCount + 1) + " / " + ds.length();
                    var action = r.getCurrentAction();
                    if (action) {
                        r.reporting.updateDataChange(action, name, "ds", str);
                    }
                } else if (fcntl == "ds-fetch" || fcntl == "var-fetch") {
                    r.reporting.updateDataChange(r.getCurrentAction(), name, fcntl, value);
                }
            } catch (e) {
                alert("update run status error:" + e);
            }
        }
    };

    if (this.recorder != null) {
        this.recorder.addRunStatusCallback(callback);
    }
    //throw "dont load";
}

com.spikesource.tg4w.TestReport.prototype.exportReport = function(reportId) {
    /*
    this.selectReportById.reset();
    this.selectReportById.params.id = reportId;
    this.selectReportById.executeStep();
    var obj = this.row2obj(this.selectReportById.row, this.table_schema["report"]);

    this.selectActionsForReport.reset();
    this.selectActionsForReport.params.id_report = reportId;
    var actions = [];
    while (this.selectActionsForReport.executeStep()) {
        var action = this.row2obj(this.selectActionsForReport.row, this.table_schema["actions"]);
        actions.push(action);
    }

    for (var i = 0; i < actions.length; i ++) {
    }
    */
}

com.spikesource.tg4w.TestReport.prototype.row2obj = function(row, names) {
    var obj = {};
    for (var i = 0; i < names.length; i ++) {
        var name = names[i];
        obj[name] = row[name];
    }
    return obj;
}

com.spikesource.tg4w.TestReport.prototype.deleteReport = function(id) {
    this.deleteReportStmt.reset();
    this.deleteReportStmt.params.id_report = id;
    this.deleteReportStmt.step();
}

com.spikesource.tg4w.TestReport.prototype.purgeDatabase = function(filename) {
    var list = this.getReportList();
    for (var i = 0; i < list.length; i ++) {
        this.deleteReport(list[i].id);
    }
}

com.spikesource.tg4w.TestReport.prototype.deleteAllReports = function(filename) {
    this.deleteAllReportStmt.reset();
    this.deleteAllReportStmt.params.filename = filename;
    this.deleteAllReportStmt.step();
}

com.spikesource.tg4w.TestReport.prototype.updateDataChange = function(action, name, type, value) {
    if (this.reporting) {
        var testId = -1;

        this.selectTest.reset();
        this.selectTest.params.id_action = action.reportActionId;
        while (this.selectTest.executeStep()) {
            testId = this.selectTest.row.id;
            break;
        }

        if (testId != -1) {
            this.insertDataChange.reset();
            this.insertDataChange.params.id_test = testId;
            this.insertDataChange.params.name = name;
            this.insertDataChange.params.type = type;
            this.insertDataChange.params.value = value;

            this.insertDataChange.executeStep();
        }
    }
}

com.spikesource.tg4w.TestReport.prototype.getReportList = function() {
    this.selectReports.reset();
    var list = [];
    var columns = [];
    while (this.selectReports.executeStep()) {
        if (columns.length == 0) {
            for (var i = 0; i < this.selectReports.columnCount; i ++) {
                columns.push(this.selectReports.getColumnName(i));
            }
        }
        list.push(this.scrapeData(this.selectReports.row, columns));
    }
    return list;
}

com.spikesource.tg4w.TestReport.prototype.scrapeData = function(row, columns) {
    var data = {};
    for (var i = 0; i < columns.length; i ++) {
        data[columns[i]] = row[columns[i]];
    }
    return data;
}

com.spikesource.tg4w.TestReport.prototype.getFilename = function(reportId) {
    this.selectReportById.reset();
    this.selectReportById.params.id = reportId;
    this.selectReportById.executeStep();
    return this.selectReportById.row.filename;
}

com.spikesource.tg4w.TestReport.prototype.getLastInsertedId = function() {
    this.lastInsert.reset();
    while (this.lastInsert.executeStep()) {
        return this.lastInsert.row.id;
    }
}

com.spikesource.tg4w.TestReport.prototype.startTest = function() {
    if (this.recorder.loadedFileName != null) {
        this.reporting = true;
    } else {
        this.reporting = false;
        return;
    }

    this.insertReport.reset();
    this.insertReport.params.filename = this.recorder.loadedFileName; 
    this.insertReport.executeStep();

    var reportId = this.getLastInsertedId();
    this.reportId = reportId;

    for (var i = 0; i < this.recorder.getActions().length; i ++) {
        var action = this.recorder.getActions()[i];
        this.insertAction.reset();

        this.insertAction.params.id_report = reportId;
        this.insertAction.params.action = action.action;
        this.insertAction.params.xpath = action.xpath;
        this.insertAction.params.value = action.value;
        this.insertAction.params.windowref = action.winref;
        this.insertAction.executeStep();

        var actionId = this.getLastInsertedId();
        action.reportActionId = actionId;
    }
}

com.spikesource.tg4w.TestReport.prototype.startAction = function(action) {
    try {
        if (this.reporting) {
            this.insertTest.reset();

            this.insertTest.params.id_action = action.reportActionId;
            this.insertTest.params.result = "pending";
            this.insertTest.params.reason = "";
            var inserted = this.insertTest.executeStep();
        }
    } catch (e) {
        alert("startAction:" + e);
    }
}

com.spikesource.tg4w.TestReport.prototype.endAction = function(action, result, reason) {
    try {
        if (this.reporting) {
            var testId = -1;

            this.selectTest.reset();
            this.selectTest.params.id_action = action.reportActionId;
            while (this.selectTest.executeStep()) {
                testId = this.selectTest.row.id;
                break;
            }

            if (testId != -1) {
                this.updateTest.reset();

                this.updateTest.params.id = testId;
                this.updateTest.params.result = result;
                this.updateTest.params.reason = reason;
                var updated = this.updateTest.executeStep();
            }
        }
    } catch (e) {
        alert("endAction:" + e);
    }
}

com.spikesource.tg4w.TestReport.prototype.endTest = function(result) {
    if (this.reporting) {
        this.updateReport.reset();

        this.updateReport.params.id_report = this.reportId;
        this.updateReport.params.result = result;
        this.updateReport.params.updated = new Date();
        this.updateReport.executeStep();
    }
}

com.spikesource.tg4w.TestReport.prototype.initTables = function() {
    var sql = [
        '"actions" ("id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "id_report" INTEGER NOT NULL , "action" VARCHAR NOT NULL , "xpath" VARCHAR, "value" VARCHAR, "windowref" VARCHAR);',
        '"data_change" ("id" INTEGER PRIMARY KEY NOT NULL ,"id_test" INTEGER NOT NULL ,"type" VARCHAR NOT NULL ,"name" VARCHAR NOT NULL ,"value" VARCHAR);',
        '"report" ("id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "filename" VARCHAR, "created_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "result" VARCHAR DEFAULT pending);',
        '"test" ("id" INTEGER PRIMARY KEY NOT NULL ,"id_action" INTEGER NOT NULL ,"result" VARCHAR NOT NULL ,"reason" TEXT);'
    ];
    var views = [
        "action_test as select test.id as id_test, actions.id_report as id_report, actions.id as id_action, actions.action as action, test.result as result, test.reason as reason from actions, test where actions.id = test.id_action;"
    ];
    for (var i = 0; i < sql.length; i ++) {
        this.dbConn.executeSimpleSQL("CREATE TABLE if not exists " + sql[i]);
    }
    for (var i = 0; i < views.length; i ++) {
        this.dbConn.executeSimpleSQL("CREATE VIEW if not exists " + views[i]);
    }
}
