import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
	const hoverProvider = vscode.languages.registerHoverProvider("yaml", {
		async provideHover(document, position, token) {
			const target = retrieveTarget(document);

			if (!target) {
				return;
			}

			const range = document.getWordRangeAtPosition(position, /\b[a-zA-Z_-]+(?=\s*:)/);
			if (!range) {
				return;
			}
			const word = document.getText(range);

			// Resolve the documentation path from the workspace root
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
			if (!workspaceFolder) {
				return;
			}

			const docsPath = path.join(workspaceFolder, "translation", target, "docs", `${word}.md`);

			if (fs.existsSync(docsPath)) {
				const markdownContent = fs.readFileSync(docsPath, "utf-8");
				const markdown = new vscode.MarkdownString(markdownContent);
				markdown.isTrusted = true;
				return new vscode.Hover(markdown);
			} else {
				return new vscode.Hover("No documentation found");
			}


		},
	});

	const completionProvider = vscode.languages.registerCompletionItemProvider("yaml", {
		async provideCompletionItems(document, position, token, context) {
			const target = retrieveTarget(document);

			if (!target) {
				return;
			}


			const lineText = document.lineAt(position).text;

			if (lineText.includes(":")) {
				return [];
			}

			const key = findNearestParentKey(document, position);
			if (!key) {
				return [];
			}

			const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
			if (!workspaceFolder) {
				return [];
			}

			const filePath = findFileWithExtension(path.join(workspaceFolder, "translation", target), key);
			
			if (!filePath) {
				return [];
			}

			if (!fs.existsSync(filePath)) {
				return [];
			}

			const fileContent = fs.readFileSync(filePath, "utf-8");

			// Extract variables inside [[var]]
			const varMatches = fileContent.match(/\[\[([a-zA-Z0-9_-]+)\]\]/g);
			if (!varMatches) {
				return [];
			}

			// Extract existing attributes in the current block
			const existingAttributes = getExistingAttributes(document, position);
			const uniqueVars = new Set(varMatches.map(match => match.replace(/\[\[|\]\]/g, "")));

			const completionItems = Array.from(uniqueVars)
				.filter(varName => !existingAttributes.has(varName)) // Filter out existing attributes
				.map(varName => {
					const item = new vscode.CompletionItem(`${varName}:`, vscode.CompletionItemKind.Variable);
					item.documentation = new vscode.MarkdownString(`Variable from ${key}.${filePath.split(".").pop()}`);
					return item;
				});

			return completionItems;
		}
	},
		...Array.from("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
	);

	// Register a text document change event listener
	const textChangeListener = vscode.workspace.onDidChangeTextDocument(event => {
		const editor = vscode.window.activeTextEditor;
		if (!editor || editor.document.languageId !== "yaml") {
			return;
		}

		const position = editor.selection.active;
		const lineText = editor.document.lineAt(position).text;

		// Check if the line already contains a colon
		if (lineText.trim() !== "" && !lineText.includes(":")) {
			vscode.commands.executeCommand("editor.action.triggerSuggest");
		}
	});

	context.subscriptions.push(hoverProvider);
	context.subscriptions.push(completionProvider);
	context.subscriptions.push(textChangeListener);
}

export function deactivate() { }

function findNearestParentKey(document: vscode.TextDocument, position: vscode.Position): string | null {
	let currentIndent = document.lineAt(position).firstNonWhitespaceCharacterIndex;

	for (let line = position.line - 1; line >= 0; line--) {
		const lineText = document.lineAt(line).text.trim();
		const indent = document.lineAt(line).firstNonWhitespaceCharacterIndex;

		// Ignore lines that are indented deeper (nested items)
		if (indent >= currentIndent) {
			continue;
		}

		// Check for list items (- key:)
		const listMatch = lineText.match(/^-?\s*([a-zA-Z_-]+):\s*$/);
		if (listMatch) {
			return listMatch[1]; // Return the key (e.g., "button")
		}

		// Check for regular keys (not in lists)
		const match = lineText.match(/^([a-zA-Z_-]+):\s*$/);
		if (match) {
			return match[1];
		}

		currentIndent = indent;
	}

	return null;
}

function retrieveTarget(document: vscode.TextDocument): string | null {
	const text = document.getText();
	const targetMatch = text.match(/target:\s*['"]?([^'"\n]+)['"]?/);

	if (!targetMatch) {
		return null;
	}

	return targetMatch[1];
}

function getExistingAttributes(document: vscode.TextDocument, position: vscode.Position): Set<string> {
	const existingAttributes = new Set<string>();
	const currentIndent = document.lineAt(position).firstNonWhitespaceCharacterIndex;

	// Scan lines in both directions (before and after cursor)
	scanLines(document, position, currentIndent, existingAttributes, -1); // Scan backward
	scanLines(document, position, currentIndent, existingAttributes, 1);  // Scan forward

	return existingAttributes;
}

function scanLines(document: vscode.TextDocument, position: vscode.Position, currentIndent: number, existingAttributes: Set<string>, direction: number) {
	const totalLines = document.lineCount;
	let line = position.line + (direction === 1 ? 1 : 0);

	while (line >= 0 && line < totalLines) {
		const lineText = document.lineAt(line).text.trim();
		const indent = document.lineAt(line).firstNonWhitespaceCharacterIndex;

		// Stop if we hit another parent key or a list item (- key:)
		if (indent < currentIndent && (lineText.match(/^-?\s*([a-zA-Z_-]+):\s*$/) || lineText.match(/^([a-zA-Z_-]+):\s*$/))) {
			break;
		}

		// Match attributes (key: value)
		const match = lineText.match(/^([a-zA-Z0-9_-]+):\s*/);
		if (match) {
			existingAttributes.add(match[1]);
		}

		line += direction;
	}
}

function findFileWithExtension(dirPath: string, baseName: string): string | null {
	const files = fs.readdirSync(dirPath);
	for (const file of files) {
		const filePath = path.join(dirPath, file);
		const fileBaseName = path.basename(file, path.extname(file));
		if (fileBaseName === baseName) {
			return filePath;
		}
	}
	return null;
}