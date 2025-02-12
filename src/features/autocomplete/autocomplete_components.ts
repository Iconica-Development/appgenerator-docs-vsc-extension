import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import { retrieveTarget, findNearestParentKey } from "../../helpers.js";

export const componentsAutocompletionProvider = vscode.languages.registerCompletionItemProvider("yaml", {
    async provideCompletionItems(document, position, token, context) {
        const target = retrieveTarget(document);

        if (!target) {
            return;
        }

        const lineText = document.lineAt(position).text;
        if (lineText.includes(":")) {
            return [];
        }

        const key = findNearestParentKey(document, position);
        if (!key || key !== "children") {
            return [];
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceFolder) {
            return [];
        }

        // read all the folders in the directory translation/target and add the folder names to the completion list
        const folderPath = path.join(workspaceFolder, "translation", target);
        const folderNames = fs.readdirSync(folderPath).filter(name => !name.includes("."));
        const completionItems = folderNames.map(folderName => {
            const completionItem = new vscode.CompletionItem(folderName, vscode.CompletionItemKind.Constructor);
            completionItem.detail = "Component";
            completionItem.insertText = `- ${folderName}:\n\t`;
            return completionItem;
        });

        return completionItems;
    }
});