from manimlib import *

import sys


def monkey_patch_win32_console_input_reader():
    if sys.platform != "win32":
        return

    try:
        print("Trying to patch prompt_toolkit.input.win32 ...")
        import prompt_toolkit.input.win32

        win32 = sys.modules["prompt_toolkit.input.win32"]
        original_class = win32.ConsoleInputReader

        # Define a patched version of the class
        class PatchedConsoleInputReader(original_class):
            def __init__(self, *args, **kwargs):
                if "recognize_paste" in kwargs:
                    kwargs["recognize_paste"] = False
                super().__init__(*args, **kwargs)

        win32.ConsoleInputReader = PatchedConsoleInputReader  # type: ignore

        print("prompt_toolkit.input.win32 has been patched.")
    except ImportError as exc:
        raise ImportError(
            "Module 'prompt_toolkit.input.win32' could not be imported."
        ) from exc


monkey_patch_win32_console_input_reader()


# from https://github.com/Manim-Notebook/manim-notebook/issues/18#issuecomment-2431224967
class LaggyScene(Scene):

    def construct(self):
        ## create a bunch of boxes
        grid = Square().get_grid(15, 15, buff=0)
        grid.set_height(5)
        grid.set_stroke(WHITE)
        self.play(ShowCreation(grid))

        ## move the boxes using updaters
        position = ValueTracker(0)

        grid.add_updater(
            lambda m, position=position: m.move_to((position.get_value(), 0, 0))
        )

        self.play(position.animate.set_value(2), run_time=5)

        ## moves boxes back
        self.play(position.animate.set_value(0), run_time=5)
