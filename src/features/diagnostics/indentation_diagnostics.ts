import * as vscode from 'vscode';

export function indentationDiagnostics(document: vscode.TextDocument) {
    const diagnostics: vscode.Diagnostic[] = [];

    checkAppRootIndentation(document, diagnostics);


    return diagnostics;
}

function checkAppRootIndentation(document: vscode.TextDocument, diagnostics: vscode.Diagnostic[]) {
    const text = document.getText();
    const regex = /^[^\s]/gm;
    let match;
    let foundLines: vscode.TextLine[] = [];

    while ((match = regex.exec(text)) !== null) {
        const line = document.lineAt(document.positionAt(match.index).line);
        foundLines.push(line);
    }

    if (foundLines.length > 1) {
        foundLines.forEach((line) => {
            const index = foundLines.findIndex((l) => l === line);

            if (line.text.includes("app") && index === 0) {
                return;
            }
            const warning = line.text.includes("app")
                ? `App should be the first line in the yaml`
                : `Only "app" should be the root key`;
            const diagnostic = new vscode.Diagnostic(
                line.range,
                warning,
                vscode.DiagnosticSeverity.Error
            );
            diagnostics.push(diagnostic);
        });
    } else if (foundLines.length === 1) {
        if (!foundLines[0].text.includes("app")) {
            const diagnostic = new vscode.Diagnostic(
                foundLines[0].range,
                `Only "app" should be the root key`,
                vscode.DiagnosticSeverity.Error
            );
            diagnostics.push(diagnostic);
        }
    }
}
