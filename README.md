#Brackets-PEP8 (Deprecated)

**This extension uses a deprecated API of brackets 1.0. It does not work anymore in recent brackets versions, and the author don't use brackets as an editor anymore to fix that. Feel free to fork and fix the current problems or stop using it.**

This extension add pep8 style guide check for python projects.

##Install from URL

1. Open the the Extension Manager from the File menu
2. Copy paste the URL of the github repo or zip file


##Install from file system

1. Download this extension using the ZIP button above and unzip it.
2. Copy it in Brackets' `/extensions/user` folder by selecting `Help > Show Extension Folder` in the menu.
3. Reload Brackets.

##Instructions

== Dependencies ==

* pep8 (sudo pip install pep8 --upgrade)

After installed, simple use Ctrl+Shift+P or View->PEP8 Lint on your python code.
If it doesn't works, find the path of pep8 on your system (`which pep8` on must linux systems) and edit the file
`~/.config/Brackets/extensions/user/brackets-pep8/defaultPreferences.js` and set
pep8Path accordingly.

;)
