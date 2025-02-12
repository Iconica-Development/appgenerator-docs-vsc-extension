import * as vscode from 'vscode';
import { getExistingAttributesForParent, getSupportedTargets } from '../../helpers';

export function attributeDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection) {
    const diagnostics: vscode.Diagnostic[] = [];

    checkIfObjectHasChildren(document, diagnostics);

    collection.set(document.uri, diagnostics);
}

function checkIfObjectHasChildren(document: vscode.TextDocument, diagnostics: vscode.Diagnostic[]) {
    const text = document.getText();
    const regex = /^\s*-?\s*?[a-z]+:\s*$/gm;
    let match;
    let foundKeyLines: vscode.TextLine[] = [];

    while ((match = regex.exec(text)) !== null) {
        const line = document.lineAt(document.positionAt(match.index).line);
        foundKeyLines.push(line);
    }

    for (const line of foundKeyLines) {
        const key = line.text.trim().split(":")[0];
        const attributes = Array.from(getExistingAttributesForParent(document, line.lineNumber));

        var keyStartIndex = line.text.indexOf(key);
        var keyEndIndex = keyStartIndex + key.length;

        const range = new vscode.Range(line.lineNumber, keyStartIndex, line.lineNumber, keyEndIndex);

        if (attributes.length === 0) {
            const diagnostic = new vscode.Diagnostic(
                range,
                `This key doesn't have attributes or a value`,
                vscode.DiagnosticSeverity.Warning
            );

            diagnostics.push(diagnostic);
        }
    }
}
