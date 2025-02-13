import * as vscode from 'vscode';
import { getExistingAttributesForParent, getSupportedTargets } from '../../helpers';

export function targetDiagnosis(document: vscode.TextDocument) {
    const text = document.getText();
    const diagnostics: vscode.Diagnostic[] = [];


    const documentStartsWithApp = text.startsWith("app:");

    if (!documentStartsWithApp) {
        const diagnostic = new vscode.Diagnostic(
            new vscode.Range(0, 0, 0, 0),
            `The document should start with "app"`,
            vscode.DiagnosticSeverity.Error
        );
        diagnostics.push(diagnostic);
    }

    const appLine = text.split("\n").findIndex(line => line.trim().startsWith("app:"));
    const attributes = getExistingAttributesForParent(document, appLine);

    if (!attributes.has("target")) {
        const diagnostic = new vscode.Diagnostic(
            new vscode.Range(appLine, 0, appLine, 0),
            `The "target" attribute is missing.`,
            vscode.DiagnosticSeverity.Error
        );

        diagnostics.push(diagnostic);
    } else {
        const targetLine = text.split("\n").findIndex(line => line.trim().startsWith("target:"));
        const targetValue = text.split("\n")[targetLine].trim().split(":")[1].trim();

        const targets = getSupportedTargets();

        if (targetValue === "" || !targets?.includes(targetValue.substring(1, targetValue.length - 1))) {
            const targetStartIndex = text.split("\n")[targetLine].indexOf("target");
            const targetEndIndex = targetStartIndex + "target".length;
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(targetLine, targetStartIndex, targetLine, targetEndIndex),
                `The "target" attribute value is missing. Supported targets are: ${targets?.join(", ")}`,
                vscode.DiagnosticSeverity.Error
            );

            diagnostics.push(diagnostic);
        }
    }
    return diagnostics;
}