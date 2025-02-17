import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { getSupportedTargets, getTargetFromYaml } from "../../helpers";

export function updateSchemaOnTargetChange(context: vscode.ExtensionContext) {
    const watcher = vscode.workspace.createFileSystemWatcher("**/*.hydro.{yaml,yml}");

    watcher.onDidChange((uri) => {
        handleSchemaRegeneration(context, uri);
    });

    return watcher;
}


export function schemaGeneratorProvider(context: vscode.ExtensionContext) {
    return vscode.commands.registerCommand("yamlSchema.generateSchema", async () => {
        handleSchemaGeneration(context, true);
    });
}

async function handleSchemaRegeneration(context: vscode.ExtensionContext, uri: vscode.Uri) {
    try {
        const document = await vscode.workspace.openTextDocument(uri);
        const yamlContent = document.getText();
        
        const allowedTargets = getSupportedTargets();
        if (!allowedTargets) {
            return;
        }
        
        const target = getTargetFromYaml(yamlContent);
        const storagePath = path.join(context.globalStorageUri.fsPath, "last_target.json");

        const lastTarget = getLastTarget(context);

        if (!target || !allowedTargets.includes(target) || target === lastTarget) {
            return;
        }


        fs.writeFileSync(storagePath, JSON.stringify({ target }));
        await handleSchemaGeneration(context, true, target);
        vscode.window.showInformationMessage(`Schema regenerated due to target change: ${lastTarget} → ${target}`);

    } catch (error) {
        console.error("Error handling schema regeneration:", error);
    }
}

export async function handleSchemaGeneration(context: vscode.ExtensionContext, showGenerationMessage: boolean = false, target?: string) {
    console.log("Generating schema for target:", target);
    const timestamp = new Date().toISOString();
    const schemaPath = path.join(context.globalStorageUri.fsPath, `hydroplatform_yaml_schema_${timestamp}.json`);

    await vscode.workspace.fs.createDirectory(context.globalStorageUri);

    const schema: { [key: string]: any } = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "Hydro Platform YAML Schema",
        "type": "object",
        "properties": {
            "app": {
                "type": "object",
                "properties": {
                    "font": { "type": "string" },
                    "target": { "type": "string", "enum": ["flutter", "react"] },
                    "title": { "type": "string" },
                    "children": {
                        "type": "array",
                        "items": { "$ref": "#/$definitions/component" }
                    }
                },
                "required": ["target"],
                "additionalProperties": false
            }
        },
        "required": ["app"],
        "additionalProperties": false,
        "$definitions": {}
    };


    const components = getComponentSchemas(target ?? "flutter");

    for (const [key, value] of components) {
        schema["$definitions"][key] = value;
    }

    schema["$definitions"]["component"] = {
        "oneOf": Array.from(components.keys()).map(key => ({
            "$ref": `#/$definitions/${key}`,
            "title": key
        }))
    };


    fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));

    const settings = vscode.workspace.getConfiguration("yaml");
    let schemas = settings.get<{ [key: string]: string[] }>("schemas") || {};

    for (const schemaUri of Object.keys(schemas)) {
        if (schemaUri.includes("hydroplatform_yaml_schema")) {
            console.log("Deleting schema:", schemaUri);
            try {
            delete schemas[schemaUri];
            } catch (error) {
                // ignore
            }
        }
    }

    schemas[`file://${schemaPath}`] = ["*.hydro.yaml", "*.hydro.yml"];

    await settings.update("schemas", schemas, vscode.ConfigurationTarget.Global);

    if (showGenerationMessage) {
        vscode.window.showInformationMessage(`YAML schema generated and applied.`);
    }
}

export function getLastTarget(context: vscode.ExtensionContext): string | undefined {
    const storagePath = path.join(context.globalStorageUri.fsPath, "last_target.json");

    if (fs.existsSync(storagePath)) {
        return JSON.parse(fs.readFileSync(storagePath, "utf8")).target;
    }

    return undefined;
}



function getComponentSchemas(target: string): Map<string, Map<any, any>> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
        return new Map();
    }

    const componentPath = path.join(workspaceFolder, "translation", target);
    const componentFolders = fs.readdirSync(componentPath).filter(name => !name.includes("."));
    const componentSchemas = new Map<string, any>();

    for (const folder of componentFolders) {
        const schemaPath = path.join(componentPath, folder, "schema.json");
        if (fs.existsSync(schemaPath)) {
            try {
                const schemaContent = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
                if (schemaContent && typeof schemaContent === "object") {
                    for (const [key, value] of Object.entries(schemaContent)) {
                        if (typeof value === "object") {
                            componentSchemas.set(key, value);
                        }
                    }
                }
            } catch (error) {
                console.error(`Failed to parse schema in ${schemaPath}:`, error);
            }
        }
    }

    return componentSchemas;
}