/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, Mustache */

/** Python pep8 Extension
    Enables the pep8 lint to python documents
    Based on brackets-todo extension
    Author: Tiago Natel de Moura
*/
define(function (require, exports, module) {
    'use strict';

    var CommandManager      = brackets.getModule("command/CommandManager"),
        Menus               = brackets.getModule("command/Menus"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        FileUtils           = brackets.getModule("file/FileUtils"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        NativeApp           = brackets.getModule("utils/NativeApp"),
        Commands            = brackets.getModule("command/Commands"),
        Dialogs             = brackets.getModule("widgets/Dialogs"),
        AppInit             = brackets.getModule("utils/AppInit"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        NodeConnection      = brackets.getModule("utils/NodeConnection"),
        Resizer             = brackets.getModule('utils/Resizer'),
        PanelManager        = brackets.getModule("view/PanelManager"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        DefaultPreferences  = require("./defaultPreferences");

    var moduledir           = FileUtils.getNativeModuleDirectoryPath(module),
        nodeConnection;

    var COMMAND_ID          = "python-pep8.run";
    var MENU_NAME           = "PEP8 Lint";

    // Mustache templates.
    var pep8PanelTemplate   = require('text!html/panel.html'),
        pep8ResultsTemplate = require('text!html/results.html'),
        pep8RowTemplate     = require('text!html/row.html'),
        $pep8Panel,
        $pep8Icon           = $('<a href="#" title="Todo" id="brackets-pep8-icon"></a>');

    // Load stylesheet.
    ExtensionUtils.loadStyleSheet(module, 'pep8.css');

    // Initialize PreferenceStorage.
    var preferences = PreferencesManager.getPreferenceStorage(module, DefaultPreferences);

    function getPEP8Binary() {
        if (preferences.getValue("pep8IsInSystemPath")) {
            return "pep8";
        } else {
            return preferences.getValue("pep8Path");
        }
    }

    function _pep8(document) {
        var currentDoc = document;
        var currentFile = currentDoc.file.fullPath;

        nodeConnection.domains.pep8.pep8(getPEP8Binary(),
                                         currentFile)
            .fail(function (err) {
                console.log("[brackets-pep8] error running file: " + currentFile + " message: " + err.toString());
                var dlg = Dialogs.showModalDialog(
                    Dialogs.DIALOG_ID_ERROR,
                    "PEP8 Error",
                    "Error when executing pep8 lint: " + err.toString()
                );
            }).done(function (ret) {
                /* nothing for now */
            });
    }

    function showPEP8() {
        Resizer.show($pep8Panel);
        $pep8Icon.addClass("active");
    }

    function hidePEP8() {
        Resizer.hide($pep8Panel);
        $pep8Icon.removeClass("active");
    }

    function checkPython(document) {
        return document.language.getId() === "python";
    }

    function denyPEP8Message() {
        var dlg = Dialogs.showModalDialog(
            Dialogs.DIALOG_ID_ERROR,
            "PEP8 Error",
            "PEP8 Lint is only for python code"
        );
    }

    function enablePEP8(enable) {
        CommandManager.get(COMMAND_ID).setChecked(enable);

        if (enable) {
            showPEP8();
        } else {
            hidePEP8();
            return;
        }

        return _pep8(DocumentManager.getCurrentDocument());
    }

    function pep8() {
        if (checkPython(DocumentManager.getCurrentDocument())) {
            return enablePEP8(CommandManager.get(COMMAND_ID).getChecked() !== true);
        } else {
            denyPEP8Message();
        }
    }

    function chain() {
        var functions = Array.prototype.slice.call(arguments, 0);
        if (functions.length > 0) {
            var firstFunction = functions.shift();
            var firstPromise = firstFunction.call();
            firstPromise.done(function () {
                chain.apply(null, functions);
            });
        }
    }

    AppInit.appReady(function () {
        nodeConnection = new NodeConnection();
        function connect() {
            var connectionPromise = nodeConnection.connect(true);
            connectionPromise.fail(function () {
                console.error("[brackets-pep8] failed to connect to node");
            });

            return connectionPromise;
        }

        function loadNodePEP8Exec() {
            var path = ExtensionUtils.getModulePath(module, "NodePEP8Exec");
            var loadPromise = nodeConnection.loadDomains([path], true);
            loadPromise.fail(function () {
                console.log("[brackets-pep8] failed to load pep8 domain");
            });
            return loadPromise;
        }

        var pep8HTML = Mustache.render(pep8PanelTemplate, {pep8: "/usr/local/bin/pep8"}),
            pep8Panel = PanelManager.createBottomPanel('tiago4orion.bracketsPEP8.panel', $(pep8HTML), 100);

        // Cache todo panel.
        $pep8Panel = $('#brackets-pep8');

        $pep8Panel.on('click', '.comment', function (e) {
            var $this = $(this);
            // Set cursor position at start of todo.
            EditorManager.getCurrentFullEditor().setCursorPos($this.data('line') - 1, $this.data('char'));
            // Set focus on editor.
            EditorManager.focusEditor();
        }).on('click', '.close', function () {
            enablePEP8(false);
        });

        var $documentManager = $(DocumentManager);

        $documentManager.on('documentSaved', function (event, document) {
            if (CommandManager.get(COMMAND_ID).getChecked() === true &&
                    document.language.getId() === "python") {
                _pep8(document);
            }
        }).on('currentDocumentChange', function (event) {
            var doc = DocumentManager.getCurrentDocument();
            if (CommandManager.get(COMMAND_ID).getChecked() === true) {
                if (doc.language.getId() === "python") {
                    enablePEP8(true);
                } else {
                    hidePEP8();
                }
            }
        });

        function rowTemplate(resultObj) {
            var resultsHTML = Mustache.render(pep8RowTemplate, {
                resultObj: resultObj
            });

            return resultsHTML;
        }

        $(nodeConnection).on("pep8.update", function (evt, jsondata) {
            var resultObj = JSON.parse(jsondata),
                results = resultObj.result,
                dlg;

            if (resultObj.exitcode === 0 ||
                    results.length === 0) {
                $pep8Panel.find('.table-container').empty();
                return;
            }
            
            var resultsHTML = Mustache.render(pep8ResultsTemplate, {
                results: rowTemplate(resultObj)
            });

            resultsHTML = $(resultsHTML);

            $('.file.collapsed', resultsHTML).nextUntil('.file').hide();

            // Empty container element and apply results template.
            $pep8Panel.find('.table-container').empty().append(resultsHTML);

            Resizer.show($pep8Panel);
        });
        
        $(nodeConnection).on("pep8.error", function (evt, jsondata) {
            var dlg = Dialogs.showModalDialog(
                    Dialogs.DIALOG_ID_ERROR,
                    "PEP8 Error",
                    "pep8 not found. Run sudo pip install pep8"
                );
        });

        chain(connect, loadNodePEP8Exec);
    });

    CommandManager.register(MENU_NAME, COMMAND_ID, pep8);

    var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
    menu.addMenuDivider();
    menu.addMenuItem(COMMAND_ID, [{'key': 'Ctrl-Shift-P'}]);

});
