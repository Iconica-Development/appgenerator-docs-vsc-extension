import * as vscode from "vscode";
import { documentationHoverProvider } from "./features/documentation/documentation_hover";
import { createComponentProvider } from "./features/component_generation/generate_component";
import { schemaGeneratorProvider, updateSchemaOnTargetChange } from "./features/schema_generator/schema_generator";

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(documentationHoverProvider);
	context.subscriptions.push(createComponentProvider(context));
	context.subscriptions.push(schemaGeneratorProvider(context));
	context.subscriptions.push(updateSchemaOnTargetChange(context));
}

export function deactivate() { }
