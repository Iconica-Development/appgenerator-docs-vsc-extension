import * as vscode from "vscode";
import { documentationHoverProvider } from "./features/documentation/documentation_hover";
import { createComponentProvider } from "./features/component_generation/generate_component";
import { schemaGeneratorProvider, updateSchemaOnTargetChange, updateSchemaOnComponentSchemaChange } from "./features/schema_generator/schema_generator";
import { componentSchemaGeneratorProvider, allComponentsSchemaGeneratorProivder } from "./features/schema_generator/component_schema_generator"; 

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(documentationHoverProvider);
	context.subscriptions.push(createComponentProvider(context));
	context.subscriptions.push(schemaGeneratorProvider(context));
	context.subscriptions.push(updateSchemaOnTargetChange(context));
	context.subscriptions.push(componentSchemaGeneratorProvider(context));
	context.subscriptions.push(allComponentsSchemaGeneratorProivder(context));
	context.subscriptions.push(updateSchemaOnComponentSchemaChange(context));
}

export function deactivate() { }
