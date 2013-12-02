/*global brackets, define */

define(function (require, exports, module) {
    "use strict";

    // Default preferences are different for platforms
    var defaultPreferences = {
        "panelEnabled":                     true,
        // these are set by platform
        "pep8IsInSystemPath":               null,
        "pep8Path":                         null,
        "msyspep8Path":                     null
    };

    defaultPreferences.pep8IsInSystemPath = false;
    defaultPreferences.pep8Path           = "/usr/local/bin/pep8";

    module.exports = defaultPreferences;
});
