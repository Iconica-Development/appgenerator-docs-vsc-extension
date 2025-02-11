import * as vscode from "vscode";

export const textChangeListener = vscode.workspace.onDidChangeTextDocument(event => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== "yaml") {
        return;
    }

    const position = editor.selection.active;
    const lineText = editor.document.lineAt(position).text;

    // Check if the line already contains a colon
    if (lineText.trim() !== "" && !lineText.includes(":")) {
        vscode.commands.executeCommand("editor.action.triggerSuggest");
    }
});