import { retrieveTarget } from "../../helpers.js";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export const documentationHoverProvider = vscode.languages.registerHoverProvider("yaml", {
    async provideHover(document, position, token) {
        const target = retrieveTarget(document);

        if (!target) {
            return;
        }

        const range = document.getWordRangeAtPosition(position, /\b[a-zA-Z_-]+(?=\s*:)/);
        if (!range) {
            return;
        }
        const word = document.getText(range);

        // Resolve the documentation path from the workspace root
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceFolder) {
            return;
        }

        const docsPath = path.join(workspaceFolder, "translation", target, word, `docs.md`);

        if (fs.existsSync(docsPath)) {
            const markdownContent = fs.readFileSync(docsPath, "utf-8");
            const markdown = new vscode.MarkdownString(markdownContent);
            markdown.isTrusted = true;
            return new vscode.Hover(markdown);
        } else {
            return new vscode.Hover("No documentation found");
        }
    },
});
