from manimlib import *


class BasicNotebook(Scene):
    def construct(self):
        ## A Manim Cell
        print("With some code")
        print("With some more code")

        ## And another Manim Cell
        print("And even more code")


class BasicNotebookWithType(Scene):

    def construct(self) -> None:
        ## Cell inside construct(self) marked with "None" type
        print("With some code None")
        print("With some more code None")


class NoManimScene(Scene):
    def constructtttt(self):
        ## Should not be detected as Manim Cell
        print("Hi there")


class WithoutAnyManimCells(Scene):
    def construct(self):
        print("We have no ManimCell in here")
        print("And therefore also no ManimCell is detected")
