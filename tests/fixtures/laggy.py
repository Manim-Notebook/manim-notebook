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
