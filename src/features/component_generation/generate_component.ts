import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { handleSchemaGeneration, getLastTarget } from "../schema_generator/schema_generator";
import { capitalizeFirstChar } from "../../helpers";

const supportedTargets = ["react", "flutter"] as const;
const globalFiles = ['global', 'setup', 'declaration', 'execution', 'imports'];
const targetSpecificFiles = {
    'react': ['styles'],
};

const targetSpecificFileExtensions = {
    'react': 'js',
    'flutter': 'dart',
};

export function createComponentProvider(context: vscode.ExtensionContext) {
    return vscode.commands.registerCommand("extension.createComponent", async () => {
        const queryResult = await queryUser();
        const { componentPath, componentName, target } = queryResult || {};
        if (!componentPath || !componentName || !target) {
            return;
        }

        createDirectoryAndFiles(componentPath, componentName, target, context);
        handleSchemaGeneration(context, true, getLastTarget(context));
    });
}

async function queryUser() {
    // Ask for the component name
    let componentName = await vscode.window.showInputBox({ prompt: "Enter the component name" });
    if (!componentName) {
        vscode.window.showErrorMessage("Component name is required");
        return;
    }
    componentName = componentName.trim().toLowerCase();

    if (!/^[a-z_]+$/.test(componentName)) {
        vscode.window.showErrorMessage("Component name must contain only lowercase letters and underscores");
        return;
    }

    // Ask for the target framework
    const target = await vscode.window.showQuickPick(supportedTargets, { placeHolder: "Select the target framework" });
    if (!target) {
        vscode.window.showErrorMessage("Target framework is required");
        return;
    }

    vscode.window.showInformationMessage(`Creating ${target} component: ${componentName}`);

    // Check if the component already exists
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
        vscode.window.showErrorMessage("Workspace folder not found");
        return;
    }

    const componentPath = vscode.Uri.file(`${workspaceFolder}/translation/${target}/${componentName}`);
    if (fs.existsSync(componentPath.fsPath)) {
        vscode.window.showErrorMessage("Component already exists");
        return;
    }

    return { componentPath, componentName, target };
}

function createDirectoryAndFiles(componentPath: vscode.Uri, componentName: string, target: string, context: vscode.ExtensionContext) {
    fs.mkdirSync(componentPath.fsPath, { recursive: true });
    createComponentFiles(componentPath, componentName, target, context);
    createDocumentation(componentPath, componentName, context);
}

function createComponentFiles(componentPath: vscode.Uri, componentName: string, target: string, context: vscode.ExtensionContext) {
    const fileExtension = targetSpecificFileExtensions[target as keyof typeof targetSpecificFileExtensions];
    const files = globalFiles.concat(targetSpecificFiles[target as keyof typeof targetSpecificFiles] || []);

    try {
        files.forEach(file => {
            const fileName = `${componentPath.fsPath}/${file}.${fileExtension}`;

            const templatePath = `${context.extensionPath}/assets/templates/targets/${target}/${file}.${fileExtension}`;
            if (fs.existsSync(templatePath)) {
                const fileContent = fs.readFileSync(templatePath, 'utf8');
                fs.writeFileSync(fileName, fileContent);
            } else {
                const fileContent = fs.readFileSync(path.join(context.extensionPath, 'assets/templates/empty_component.txt'), 'utf8');
                fs.writeFileSync(fileName, fileContent);
            }
        });
    } catch (error : any) {
        fs.rmdirSync(componentPath.fsPath, { recursive: false });
        vscode.window.showErrorMessage(`Error creating component files: ${error.message}`);
    }
}

function createDocumentation(componentPath: vscode.Uri, componentName: string, context: vscode.ExtensionContext) {
    const docsPath = `${componentPath.fsPath}/docs.md`;
    let docsTemplate = fs.readFileSync(path.join(context.extensionPath, 'assets/templates/docs.md'), 'utf8');
    docsTemplate = docsTemplate.replace(/component_name/g, capitalizeFirstChar(componentName));
    fs.writeFileSync(docsPath, docsTemplate);

    const schemaDocsPath = `${componentPath.fsPath}/schema.json`;
    let schemaDocsTemplate = fs.readFileSync(path.join(context.extensionPath, 'assets/templates/schema.json'), 'utf8');
    schemaDocsTemplate = schemaDocsTemplate.replace(/\$\$_component_name_\$\$/g, componentName.toLowerCase());
    fs.writeFileSync(schemaDocsPath, schemaDocsTemplate);
}
