import sys


def monkey_patch_win32_recognize_paste():
    if sys.platform != "win32":
        return

    try:
        print("Trying to patch prompt_toolkit.input.win32 ...")
        import prompt_toolkit.input.win32

        win32 = sys.modules["prompt_toolkit.input.win32"]
        original_class = win32.Win32Input

        original_init = original_class.__init__

        def patched_init(self, stdin=None, *args, **kwargs):
            print("Patched Win32Input __init__ called")
            original_init(self, stdin, *args, **kwargs)

            # Patch the recognize_paste attribute in the ConsoleInputReader
            if hasattr(self, "console_input_reader"):
                print("Patching console_input_reader.recognize_paste to False.")
                self.console_input_reader.recognize_paste = False

        original_class.__init__ = patched_init
        print("Win32Input.__init__ has been successfully patched.")
    except ImportError as exc:
        raise ImportError(
            "Module 'prompt_toolkit.input.win32' could not be imported."
        ) from exc


monkey_patch_win32_recognize_paste()


# from https://github.com/Manim-Notebook/manim-notebook/issues/18#issuecomment-2431224967
from manimlib import *


class Laggy(Scene):

    def construct(self):
        ## Create some boxes
        grid = Square().get_grid(16, 16, buff=0)
        grid.set_height(5)
        grid.set_stroke(WHITE)
        self.play(ShowCreation(grid))

        ## Move the boxes
        position = ValueTracker(0)
        grid.add_updater(
            lambda m, position=position: m.move_to((position.get_value(), 0, 0))
        )
        self.play(position.animate.set_value(2), run_time=5)

        ## Move boxes back
        self.play(position.animate.set_value(0), run_time=5)
