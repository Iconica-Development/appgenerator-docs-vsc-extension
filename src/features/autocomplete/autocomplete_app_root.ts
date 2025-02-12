import * as vscode from "vscode";
import { getSupportedTargets } from "../../helpers.js";

import { findNearestParentKey, getExistingAttributes } from "../../helpers.js";

export const appRootAutocompletionProvider = vscode.languages.registerCompletionItemProvider("yaml", {
    async provideCompletionItems(document, position, token, context) {
        let completionItems: vscode.CompletionItem[] = [];

        const lineText = document.lineAt(position).text;
        if (lineText.includes(":")) {
            autoCompleteTarget(document, position, completionItems);
            return completionItems;
        }

        autoCompleteApp(document, completionItems);
        autoCompleteAppAttributes(document, position, completionItems);

        return completionItems;
    }
});

function autoCompleteApp(document: vscode.TextDocument, completionItems: vscode.CompletionItem[]) {
    if (document.getText().trim() === "") {
        const completionItem = new vscode.CompletionItem("app:", vscode.CompletionItemKind.Constructor);
        completionItem.detail = "Root key";
        completionItems.push(completionItem);
    }
}

function autoCompleteAppAttributes(document: vscode.TextDocument, position: vscode.Position, completionItems: vscode.CompletionItem[]) {
    const parent = findNearestParentKey(document, position);
    if (parent === "app") {
        const appAttributes = ["target", "title", "font", "children"];

        const existingVariables = Array.from(getExistingAttributes(document, position));

        appAttributes.forEach(variable => {
            if (!existingVariables.includes(variable)) {
                const completionItem = new vscode.CompletionItem(`${variable}:`, vscode.CompletionItemKind.Variable);
                completionItem.detail = "App variable";
                completionItems.push(completionItem);
            }
        });

    }
}

function autoCompleteTarget(document: vscode.TextDocument, position: vscode.Position, completionItems: vscode.CompletionItem[]) {
    const parent = findNearestParentKey(document, position);
    if (parent !== "app") {
        return;
    }

    const lineText = document.lineAt(position).text;
    if (!lineText.includes("target:")) {
        return;
    }

    const targets = getSupportedTargets();

    if (!targets) {
        return;
    }

    targets.forEach(target => {
        const completionItem = new vscode.CompletionItem(target, vscode.CompletionItemKind.Value);

        
        completionItem.detail = "platform target";
        if (lineText.endsWith(":")) {
            completionItem.insertText = ` "${target}"`;
        } else {
            completionItem.insertText = `"${target}"`;
        }
        completionItems.push(completionItem);
    });



}