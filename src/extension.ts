import * as vscode from "vscode";
import { documentationHoverProvider } from "./features/documentation/documentation_hover";
import { varsAutocompletionProvider } from "./features/autocomplete/autocomplete_vars";
import { textChangeListener } from "./features/autocomplete/autocomplete_activation";
import { componentsAutocompletionProvider } from "./features/autocomplete/autocomplete_components";
import { createComponentProvider } from "./features/component_generation/generate_component";
import { appRootAutocompletionProvider } from "./features/autocomplete/autocomplete_app_root";
import { targetDiagnosis } from "./features/diagnostics/target_diagnosis";

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(documentationHoverProvider);
	context.subscriptions.push(varsAutocompletionProvider);
	context.subscriptions.push(textChangeListener);
	context.subscriptions.push(componentsAutocompletionProvider);
	context.subscriptions.push(createComponentProvider(context));
	context.subscriptions.push(appRootAutocompletionProvider);

	const diagnosticCollection = vscode.languages.createDiagnosticCollection("hydroplatform");

	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument(doc => targetDiagnosis(doc, diagnosticCollection)),
		vscode.workspace.onDidChangeTextDocument(event => targetDiagnosis(event.document, diagnosticCollection))
	);

	context.subscriptions.push(diagnosticCollection);
}

export function deactivate() { }
