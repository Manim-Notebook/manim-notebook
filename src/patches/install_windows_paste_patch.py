import sysconfig
import os

PATCH_FILE_NAME = "__manim_notebook_windows_paste_patch"
PATCH_PTH = f"import {PATCH_FILE_NAME}"

PATCH = '''
import sys


def monkey_patch_win32_recognize_paste():
    """
    Disables the "guessed bracketed mode" on Windows to avoid treating key
    strokes as paste events whenever the machine is slow to process input.

    Patch provided in:
    https://github.com/prompt-toolkit/python-prompt-toolkit/issues/1894#issuecomment-2601043935

    If you want to disable this patch, simply remove this file and the
    corresponding __manim_notebook_windows_patch.pth file from your
    site-packages directory.
    """
    if sys.platform != "win32":
        return

    try:
        import prompt_toolkit.input.win32

        win32 = sys.modules["prompt_toolkit.input.win32"]
        original_class = win32.Win32Input
        original_init = original_class.__init__

        def patched_init(self, stdin=None, *args, **kwargs):
            original_init(self, stdin, *args, **kwargs)
            if hasattr(self, "console_input_reader"):
                self.console_input_reader.recognize_paste = False

        original_class.__init__ = patched_init

    except ImportError as exc:
        raise ImportError(
            "Monkey-patching module 'prompt_toolkit.input.win32' failed as"
            + " we could not import it. Please report this issue to the"
            + " Manim Notebook developers on GitHub:"
            + " https://github.com/Manim-Notebook/manim-notebook"
        ) from exc

    except Exception as exc:
        raise Exception(
            "Monkey-patching module 'prompt_toolkit.input.win32' failed"
            + " due to an unexpected error. Please report this issue to the"
            + " Manim Notebook developers on GitHub:"
            + " https://github.com/Manim-Notebook/manim-notebook"
            + f" Original error: {exc}"
        ) from exc


monkey_patch_win32_recognize_paste()

'''


def install_patch():
    """
    Installs the Windows paste patch by copying the patch file to the
    site-packages directory and creating a .pth file that imports the patch.

    This patch will be applied whenever the Python interpreter is started.
    """
    # Find path to the site-packages directory
    # https://stackoverflow.com/a/52638888/
    site_packages_path = sysconfig.get_path("purelib")

    # Copy the patch file to the site-packages directory
    patch_file_path = os.path.join(site_packages_path, f"{PATCH_FILE_NAME}.py")
    with open(patch_file_path, "w", encoding="utf-8") as patch_file:
        patch_file.write(PATCH)

    # https://github.com/pypa/virtualenv/issues/1703#issuecomment-596618912
    # Create a .pth file in the site-packages directory that imports the patch
    # (necessary since sitecustomize.py does not work in virtual environments)
    pth_file_path = os.path.join(site_packages_path, f"{PATCH_FILE_NAME}.pth")
    with open(pth_file_path, "w", encoding="utf-8") as pth_file:
        pth_file.write(PATCH_PTH)


install_patch()
# Construct a string that we check against, without the string being present
# in the source code itself.
SUCCESS_SIGNATURE = "42" + "0" * 4 + "43" + "Manim" + "Notebook" + "31415"
print("Manim Notebook: Windows paste patch applied")
print(SUCCESS_SIGNATURE)
print(
    "For more information, see https://github.com/Manim-Notebook/manim-notebook/wiki/%F0%9F%A4%A2-Troubleshooting#windows-paste-patch"
)
