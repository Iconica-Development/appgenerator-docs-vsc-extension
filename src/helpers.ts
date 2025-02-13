import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function retrieveTarget(document: vscode.TextDocument): string | null {
    const text = document.getText();
    const targetMatch = text.match(/target:\s*['"]?([^'"\n]+)['"]?/);

    if (!targetMatch) {
        return null;
    }

    return targetMatch[1];
}

export function findNearestParentKey(document: vscode.TextDocument, position: vscode.Position): string | null {
    let currentIndent = document.lineAt(position).firstNonWhitespaceCharacterIndex;

    for (let line = position.line - 1; line >= 0; line--) {
        const lineText = document.lineAt(line).text.trim();
        const indent = document.lineAt(line).firstNonWhitespaceCharacterIndex;

        // Ignore lines that are indented deeper (nested items)
        if (indent >= currentIndent) {
            continue;
        }

        // Check for list items (- key:)
        const listMatch = lineText.match(/^-?\s*([a-zA-Z_-]+):\s*$/);
        if (listMatch) {
            return listMatch[1]; // Return the key (e.g., "button")
        }

        // Check for regular keys (not in lists)
        const match = lineText.match(/^([a-zA-Z_-]+):\s*$/);
        if (match) {
            return match[1];
        }

        currentIndent = indent;
    }

    return null;
}

export function capitalizeFirstChar(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function getExistingAttributes(document: vscode.TextDocument, position: vscode.Position): Set<string> {
    const existingAttributes = new Set<string>();
    const currentIndent = document.lineAt(position).firstNonWhitespaceCharacterIndex;

    // Scan lines in both directions (before and after cursor)
    scanLines(document, position, currentIndent, existingAttributes, -1); // Scan backward
    scanLines(document, position, currentIndent, existingAttributes, 1);  // Scan forward

    return existingAttributes;
}

export function getExistingAttributesForParent(document: vscode.TextDocument, parentLine: number): Set<string> {
    const existingAttributes = new Set<string>();
    const currentIndent = document.lineAt(parentLine).firstNonWhitespaceCharacterIndex;

    // scan lines after the parent line
    scanLines(document, new vscode.Position(parentLine, 0), currentIndent, existingAttributes, 1);

    return existingAttributes;
}

function scanLines(document: vscode.TextDocument, position: vscode.Position, currentIndent: number, existingAttributes: Set<string>, direction: number) {
    const totalLines = document.lineCount;
    let line = position.line + (direction === 1 ? 1 : 0);

    while (line >= 0 && line < totalLines) {
        const lineText = document.lineAt(line).text.trim();
        const indent = document.lineAt(line).firstNonWhitespaceCharacterIndex;

        // Stop if we hit another parent key or a list item (- key:)
        if (indent < currentIndent && (lineText.match(/^-?\s*([a-zA-Z_-]+):\s*$/) || lineText.match(/^([a-zA-Z_-]+):\s*$/))) {
            break;
        }

        // Match attributes (key: value)
        const match = lineText.match(/^([a-zA-Z0-9_-]+):\s*/);
        if (match) {
            existingAttributes.add(match[1]);
        }

        line += direction;
    }
}

export function getSupportedTargets() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
        return;
    }

    const translationFolder = path.join(workspaceFolder, "translation");
    if (!fs.existsSync(translationFolder)) {
        return;
    }

    return fs.readdirSync(translationFolder).filter(name => !name.includes("."));
}

export function getComponentDocumentation(component: string, target: string) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
        return;
    }

    const docsPath = path.join(workspaceFolder, "translation", target, component, `docs.md`);

    if (fs.existsSync(docsPath)) {
        const markdownContent = fs.readFileSync(docsPath, "utf-8");
        const markdown = new vscode.MarkdownString(markdownContent);
        markdown.isTrusted = true;
        return markdown;
    } else {
        return new vscode.MarkdownString("No documentation found");
    }
}