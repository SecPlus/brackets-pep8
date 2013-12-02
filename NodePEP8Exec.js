/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global exports, require */

(function () {
    "use strict";
    var process = require('child_process'),
        domainManager = null;
    var childproc = null;

    function pep8(binary, file) {
        childproc = process.exec(binary + ' "' + file + '"', function (error, stdout, stderr) {
            var result = [],
                resultObj = {
                    "exitcode": childproc.exitCode,
                    "result": [],
                    "stdout": stdout,
                    "stderr": stderr
                },
                i;

            if (childproc.exitCode === 0) {
                /* Python OK */
                domainManager.emitEvent("pep8", "update", JSON.stringify(resultObj));
                return;
            }

            var lines = stdout.split("\n");

            for (i = 0; i < lines.length; i++) {
                var line = lines[i];

                if (line !== "") {
                    var pos = line.indexOf(":");
                    var filename = line.substring(0, pos);
                    var lpos = line.indexOf(":", pos + 1);
                    var lnumber = line.substring(pos + 1, lpos);
                    var cpos = line.indexOf(":", lpos + 1);
                    var cnumber = line.substring(lpos + 1, cpos);
                    var message = line.substring(line.lastIndexOf(":") + 1);

                    result.push({
                        "filename": "lala",
                        "line": lnumber,
                        "column": cnumber,
                        "message": message,
                        "original": line
                    });
                }
            }

            resultObj.result = result;
            var resultstr = JSON.stringify(resultObj);
            domainManager.emitEvent("pep8", "update", resultstr);
        });
    }

    function init(DomainManager) {
        domainManager = DomainManager;
        if (!domainManager.hasDomain("pep8")) {
            domainManager.registerDomain("pep8", {major: 0, minor: 1});
        }

        domainManager.registerCommand(
            "pep8", /* Domain name */
            "pep8", /* Command name */
            pep8,   /* Command handler function */
            false,  /* This command is synchronous */
            "Runs pep8 lint on a file",
            ["binary", "file"], /* parameters */
            []
        );

        domainManager.registerEvent(
            "pep8",
            "update",
            ["data"]
        );
    }

    exports.init = init;
}());
