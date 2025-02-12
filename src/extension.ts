import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { documentationHoverProvider } from "./features/documentation/documentation_hover";
import { varsAutocompletionProvider } from "./features/autocomplete/autocomplete_vars";
import { textChangeListener } from "./features/autocomplete/autocomplete_activation";
import { componentsAutocompletionProvider } from "./features/autocomplete/autocomplete_components";
import { createComponentProvider } from "./features/component_generation/generate_component";

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(documentationHoverProvider);
	context.subscriptions.push(varsAutocompletionProvider);
	context.subscriptions.push(textChangeListener);
	context.subscriptions.push(componentsAutocompletionProvider);
	context.subscriptions.push(createComponentProvider(context));
}

export function deactivate() { }
