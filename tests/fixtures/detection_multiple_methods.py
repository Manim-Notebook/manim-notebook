from manimlib import *


class MultipleMethods(Scene):
    def construct(self):
        ## A Manim Cell
        print("With some code")
        print("With some more code")

        ## And another Manim Cell
        print("And even more code")

    def another_construct(self):
        ## Should not be detected as Manim Cell
        print("Hi there from another construct method")
