<div align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=Manim-Notebook.manim-notebook">
    <img src="./assets/manim-notebook-logo.png" width="130px" alt="Manim Notebook Logo showing a physical notebook with an 'M' letter on its title page"/>
  </a>

  <div align="center">
    <h3 align="center">Manim Notebook</h3>
    <p>
      VSCode extension to interactively preview your Manim animations</strong>
    </p>
  </div>

  <div align="center">
    <a href="https://marketplace.visualstudio.com/items?itemName=Manim-Notebook.manim-notebook">VSCode Marketplace</a>
    |
    <a href="https://github.com/Manim-Notebook/manim-notebook/">GitHub</a>
  </div>
</div>

<br>

> [!warning]
> This extension is for [3b1b's Manim library](https://github.com/3b1b/manim) and *NOT* the [Manim Community Edition (Manim CE)](https://www.manim.community/).

[**Manim Notebook Quick Showcase Video**](https://github.com/user-attachments/assets/24eab702-e351-4cc9-8f7b-7b94c54b4072)

## 🎈 What is this?

Manim Notebook is a VSCode extension tailored to your needs when writing Python code to animate mathematical concepts with 3Blue1Brown's [Manim library](https://github.com/3b1b/manim). It's *NOT* a Jupyter Notebook; instead it enriches your existing Python files with interactive Manim cells that let you live-preview parts of the code and instantly see the animations.

Originally, the motivation for this extension was Grant Sanderson's video [How I animate 3Blue1Brown](https://youtu.be/rbu7Zu5X1zI?feature=shared) where he shows his Manim workflow in Sublime Text. This extension brings a similar workflow to VSCode but even goes further and provides a rich VSCode integration.

## 💻 Usage

Our VSCode **walkthrough** will guide you through the first steps and provide a sample file. The walkthrough should open automatically upon installation of [the Manim Notebook extension](https://marketplace.visualstudio.com/items?itemName=Manim-Notebook.manim-notebook). If not, you can invoke it manually: open the command palette (`Ctrl/Cmd + Shift + P`) and search for `Manim Notebook: Open Walkthrough`.

The main concept is that of a Manim Cell, which is just a regular Python comment, but one that starts with `##` instead of `#`.

![manim-cell-preview](https://github.com/user-attachments/assets/577a93cb-0d05-4fa7-b1a9-52c1ccf2e5dc)

> [!tip]
> For customization options, troubleshooting tips and a lot more, check out the [Wiki](https://github.com/Manim-Notebook/manim-notebook/wiki/).

---

## 🚀 Features

- **Manim Cells**. Split your code into Manim Cells that start with `##`. You will be presented with a CodeLens to preview the animation (and you can even _reload_ your changed Python files such that you don't have to restart the preview).
- **Preview any code**. Simple as that, select any code and preview it. No manual copy-pasting needed.
- **With or without Terminal**. The extension parses the `manimgl` terminal output to provide rich VSCode integrations and makes possible an almost terminal-free workflow.
  - Shows the progress of the live Manim preview as VSCode progress bar.
  - Takes a user-defined delay into account, e.g. to wait for custom shell startup scripts (like `venv` activation).
  - State management: keeps track of the ManimGL state to react accordingly in different situations, e.g. prevent from running multiple statements at the same time.
- **Video export**. Export your animations to a video file. A small wizard will guide you through the most important settings.
- **And more...** Find all commands in the command palette (`Ctrl/Cmd + Shift + P`) by searching for `> Manim Notebook`. E.g. another command lets you `clear()` the window. Yet with another one you can start the scene at your cursor.

<sub>
In the long run, we aim to even provide a <strong>Debugger for Manim code</strong> such that you can step through your animations and run until breakpoints. This would be a huge step forward in the Manim development workflow. For now, the Manim Cells that we provide are a start towards a more interactive experience.
</sub>

<br>

<a href="https://marketplace.visualstudio.com/items?itemName=bhoov.vscode-manim">
  <img src="https://github.com/user-attachments/assets/b13a01f6-7d24-4bfb-9d3f-fee7b8a456a3" alt="Manim Notebook Logo with a fancy color-gradient background"/>
</a>
