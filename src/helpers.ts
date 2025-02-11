import * as vscode from "vscode";

export function retrieveTarget(document: vscode.TextDocument): string | null {
    const text = document.getText();
    const targetMatch = text.match(/target:\s*['"]?([^'"\n]+)['"]?/);

    if (!targetMatch) {
        return null;
    }

    return targetMatch[1];
}