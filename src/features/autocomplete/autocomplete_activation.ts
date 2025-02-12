import * as vscode from "vscode";

let exemptionList = [
    "target",
];

export const textChangeListener = vscode.workspace.onDidChangeTextDocument(event => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== "yaml") {
        return;
    }

    const position = editor.selection.active;
    const lineText = editor.document.lineAt(position).text;

    if ((lineText.trim() !== "" && !lineText.includes(":")) || triggerForExemptedKey(lineText.trim())) {
        vscode.commands.executeCommand("editor.action.triggerSuggest");
    }
});

function triggerForExemptedKey(key: string) {
    const lastCharIsColon = key[key.length - 1] === ":";
    let keyWithoutColon = key;

    if (lastCharIsColon) {
        keyWithoutColon = key.substring(0, key.length - 1);
    }

    return exemptionList.includes(keyWithoutColon) && lastCharIsColon;
}