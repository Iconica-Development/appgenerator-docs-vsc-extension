import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { getSupportedTargets, getComponentsForTarget, getVariablesForComponent } from "../../helpers";


export function componentSchemaGeneratorProvider(context: vscode.ExtensionContext) {
    return vscode.commands.registerCommand("yamlSchema.generateSchemaForComponent", async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceFolder) {
            vscode.window.showErrorMessage("Workspace folder not found");
            return;
        }

        var supportedTargets = getSupportedTargets();
        if (!supportedTargets) {
            return;
        }

        const target = await vscode.window.showQuickPick(supportedTargets, { placeHolder: "Select the target framework" });
        if (!target) {
            vscode.window.showErrorMessage("Target framework is required");
            return;
        }


        var components = getComponentsForTarget(target);
        if (!components) {
            vscode.window.showErrorMessage("No components found for this target");
            return;
        }

        const component = await vscode.window.showQuickPick(components, { placeHolder: "Select a component" });

        if (!component) {
            vscode.window.showErrorMessage("Component is required");
            return;
        }

        const schemaAlreadyExists = checkIfSchemaExists(workspaceFolder, target, component);

        if (schemaAlreadyExists) {
            const options: vscode.QuickPickItem[] = [
                { label: "Replace the existing schema" },
                { label: "Merge schema's", description: "All variables that are used in the component but are not added in the schema.json will be added." },
                { label: "Cancel", }
            ];

            const overwrite = await vscode.window.showQuickPick(options, { placeHolder: "Already found a schema.json, what would you like to do?" });
            if (!overwrite || overwrite.label === "Cancel") {
                return;
            }

            if (overwrite.label === "Merge schema's") {
                mergeSchemas(workspaceFolder, target, component);
            }

            if (overwrite.label === "Replace the existing schema") {
                generateSchema(workspaceFolder, context, target, component);
            }
        } else {
            generateSchema(workspaceFolder, context, target, component);
        }
    });
}

export function allComponentsSchemaGeneratorProivder(context: vscode.ExtensionContext) {
    return vscode.commands.registerCommand("yamlSchema.generateSchemaForAllComponents", async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        const supportedTargets = getSupportedTargets();
        if (!workspaceFolder || !supportedTargets) {
            vscode.window.showErrorMessage("Workspace folder not found");
            return;
        }

        const target = await vscode.window.showQuickPick(supportedTargets, { placeHolder: "Select the target framework" });

        if (!target) {
            vscode.window.showErrorMessage("Target framework is required");
            return;
        }

        const components = getComponentsForTarget(target);

        if (!components) {
            vscode.window.showErrorMessage("No components found for this target");
            return;
        }

        const generatedSchemas: string[] = [];

        for (const component of components) {
            const schemaAlreadyExists = checkIfSchemaExists(workspaceFolder, target, component);
            if (!schemaAlreadyExists) {
                generateSchema(workspaceFolder, context, target, component);
                generatedSchemas.push(component);
            }
        }

        if (generatedSchemas.length > 0) {
            vscode.window.showInformationMessage("Schemas have been succesfully generated for the following components: " + generatedSchemas.join(", "));
        } else {
            vscode.window.showInformationMessage("No new schemas have been generated.");
        }
    });
}

function checkIfSchemaExists(workspaceFolder: string, target: string, component: string) {
    const schemaPath = path.join(workspaceFolder, "translation", target, component, "schema.json");
    return fs.existsSync(schemaPath);
}

function generateSchema(workspaceFolder: string, context: vscode.ExtensionContext, target: string, component: string) {
    const variables = getVariablesForComponent(component, target);

    const variablesSchema = variables.reduce((acc: any, variable: string) => {
        acc[variable] = { type: "string" };
        return acc;
    }, {});

    const schemaTemplatePath = path.join(context.extensionPath, "assets", "templates", "schema.json");
    let schemaTemplate = fs.readFileSync(schemaTemplatePath, "utf-8");
    schemaTemplate = schemaTemplate.replace(/\$\$_component_name_\$\$/g, component.toLowerCase());
    const schema = JSON.parse(schemaTemplate);

    schema[component]["properties"][component]["properties"] = variablesSchema;
    schema[component]["properties"][component]["required"] = variables;

    const schemaPath = path.join(workspaceFolder, "translation", target, component, "schema.json");


    fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
}

function mergeSchemas(workspaceFolder: string, target: string, component: string) {
    const variables = getVariablesForComponent(component, target);

    const schemaPath = path.join(workspaceFolder, "translation", target, component, "schema.json");
    const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));

    const existingVariables = Object.keys(schema[component]["properties"][component]["properties"]);

    const newVariables = variables.filter(variable => !existingVariables.includes(variable));

    const variablesSchema = newVariables.reduce((acc: any, variable: string) => {
        acc[variable] = { type: "string" };
        return acc;
    }, {});


    for (const variable of existingVariables) {
        if (!variables.includes(variable)) {
            delete schema[component]["properties"][component]["properties"][variable];
        }
        if (!variables.includes(variable)) {
            schema[component]["properties"][component]["required"] = schema[component]["properties"][component]["required"].filter((required: string) => required !== variable);
        }
    }

    schema[component]["properties"][component]["properties"] = { ...schema[component]["properties"][component]["properties"], ...variablesSchema };
    schema[component]["properties"][component]["required"] = [...schema[component]["properties"][component]["required"], ...newVariables];

    fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
}
