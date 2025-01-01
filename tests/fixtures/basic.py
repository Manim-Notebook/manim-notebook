from manimlib import *


class MyFirstManimNotebook(Scene):
    def construct(self):
        ## Create a circle
        circle = Circle()
        circle.set_stroke(BLUE_E, width=4)
        self.play(ShowCreation(circle))

        ## Transform circle to square
        square = Square()
        self.play(ReplacementTransform(circle, square))

        ## Make it red & fly away
        self.play(
            square.animate.set_fill(RED_D, opacity=0.5),
            self.frame.animate.set_width(25),
        )
