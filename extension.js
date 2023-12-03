// This is the entry point for your extension
const vscode = require('vscode');

function activate(context) {
    let activeEditor = vscode.window.activeTextEditor;

    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            // TODO: Implement your extension logic here
        }
    }, null, context.subscriptions);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate
}