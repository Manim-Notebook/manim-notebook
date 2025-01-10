from manimlib import *


class Syntax(Scene):
    def construct(self):
        ## A Manim Cell
        print("Hello, Manim!")

        # Not a Manim Cell, just a regular comment
        print("Not a Manim Cell")

        ### A Manim Cell
        print("Hello, Manim!")

        ########## # # # # A Manim Cell
        print("Hello, Manim!")

        ## A Manim Cell without any code

        ## Another empty Manim Cell


class SyntaxNotAtStart(Scene):
    def construct(self):
        print("test")
        ## Empty Manim Cell, should start here, not at the line before


class WithoutNewLine(Scene):
    def construct(self):
        print("test")
        ## First ManimCell
        print("yeah")
        ## Second ManimCell
        print("yeah2")
        ## Third ManimCell
        ## Fourth ManimCell
