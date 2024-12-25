import * as vscode from 'vscode';
import { ExtensionContext, window, workspace, commands, extensions } from 'vscode';
import { Logger, Window } from '../logger';
import { ManimShell } from '../manimShell';
import fs from 'fs';
import path from 'path';

export function registerWalkthroughCommands(context: ExtensionContext) {
    const openSampleFileCommand = commands.registerCommand(
        'manim-notebook-walkthrough.openSample', async () => {
            Logger.info("💠 Command Open Sample File requested");
            await openSampleFile(context);
        });

    const showAllCommandsCommand = commands.registerCommand(
        'manim-notebook-walkthrough.showCommands', async () => {
            Logger.info("💠 Command Show All Commands requested");
            await showAllCommands();
        }
    );

    const showKeyboardShortcutsCommand = commands.registerCommand(
        'manim-notebook-walkthrough.showShortcuts', async () => {
            Logger.info("💠 Command Show Keyboard Shortcuts requested");
            await showKeyboardShortcuts();
        }
    );

    const showSettingsCommand = commands.registerCommand(
        'manim-notebook-walkthrough.showSettings', async () => {
            Logger.info("💠 Command Show Settings requested");
            await showSettings();
        }
    );

    const openWikiCommand = commands.registerCommand(
        'manim-notebook-walkthrough.openWiki', async () => {
            Logger.info("💠 Command Open Wiki requested");
            await openWiki();
        }
    );

    context.subscriptions.push(
        openSampleFileCommand,
        showAllCommandsCommand,
        showKeyboardShortcutsCommand,
        showSettingsCommand,
        openWikiCommand
    );
}

/**
 * Opens a sample Manim file in a new editor that the user can use to get started.
 * 
 * @param context The extension context.
 */
async function openSampleFile(context: ExtensionContext) {
    const sampleFilePath = path.join(context.extensionPath,
        'src', 'walkthrough', 'sample_scene.py');
    const sampleFileContent = fs.readFileSync(sampleFilePath, 'utf-8');

    const sampleFile = await workspace.openTextDocument({
        language: 'python',
        content: sampleFileContent
    });

    await window.showTextDocument(sampleFile);
}

/**
 * Opens the command palette with all the "Manim Notebook" commands.
 */
async function showAllCommands() {
    await commands.executeCommand('workbench.action.quickOpen', '>Manim Notebook:');
}

/**
 * Opens the keyboard shortcuts page in the settings.
 */
async function showKeyboardShortcuts() {
    await commands.executeCommand(
        'workbench.action.openGlobalKeybindings', "Manim Notebook");
}

/**
 * Opens the settings page for the extension.
 */
async function showSettings() {
    await commands.executeCommand(
        'workbench.action.openSettings', "Manim Notebook");
}

/**
 * Opens the GitHub wiki page for the extension.
 */
async function openWiki() {
    const wikiUrl = "https://github.com/Manim-Notebook/manim-notebook/wiki";
    await vscode.env.openExternal(vscode.Uri.parse(wikiUrl));
}
