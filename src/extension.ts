import * as vscode from "vscode";
import { documentationHoverProvider } from "./features/documentation/documentation_hover";
import { varsAutocompletionProvider } from "./features/autocomplete/autocomplete_vars";
import { textChangeListener } from "./features/autocomplete/autocomplete_activation";
import { componentsAutocompletionProvider } from "./features/autocomplete/autocomplete_components";

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(documentationHoverProvider);
	context.subscriptions.push(varsAutocompletionProvider);
	context.subscriptions.push(textChangeListener);
	context.subscriptions.push(componentsAutocompletionProvider);
}

export function deactivate() { }
