import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import { retrieveTarget, findNearestParentKey, getExistingAttributes } from "../../helpers.js";

export const varsAutocompletionProvider = vscode.languages.registerCompletionItemProvider("yaml", {
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
        if (!key) {
            return [];
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceFolder) {
            return [];
        }

        const filePaths = findFilesForObject(path.join(workspaceFolder, "translation", target, key));

        if (filePaths.length === 0) {
            return [];
        }

        let matches: string[] = [];

        for (const filePath of filePaths) {
            if (!fs.existsSync(filePath)) {
                continue;
            }
            const fileContent = fs.readFileSync(filePath, "utf-8");

            // Extract variables inside [[var]]
            const varMatches = fileContent.match(/\[\[([a-zA-Z0-9_-]+)\]\]/g);
            if (!varMatches) {
                continue;
            }

            matches = matches.concat(varMatches);
        }

        if (matches.length === 0) {
            return [];
        }

        const uniqueVars = new Set(matches.map(match => match.replace(/\[\[|\]\]/g, "")));

        // Extract existing attributes in the current block
        const existingAttributes = getExistingAttributes(document, position);

        const completionItems = Array.from(uniqueVars)
            .filter(varName => !existingAttributes.has(varName)) // Filter out existing attributes
            .map(varName => {
                const item = new vscode.CompletionItem(`${varName}:`, vscode.CompletionItemKind.Variable);
                item.documentation = new vscode.MarkdownString(`Variable from the ${key} object`);
                return item;
            });

        return completionItems;
    }
},
    ...Array.from("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
);



function findFilesForObject(dirPath: string): string[] {
    const files = fs.readdirSync(dirPath);
    const matchingFiles = [];

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        if (path.extname(file) !== ".md") {
            matchingFiles.push(filePath);
        }
    }

    return matchingFiles;
}
