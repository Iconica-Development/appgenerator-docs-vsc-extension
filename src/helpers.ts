import * as vscode from "vscode";

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