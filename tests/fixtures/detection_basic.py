from manimlib import *


class BasicNotebook(Scene):
    def construct(self):
        ## A Manim Cell
        print("With some code")
        print("With some more code")

        ## And another Manim Cell
        print("And even more code")


class NoManimScene(Scene):
    def constructtttt(self):
        ## Should not be detected as Manim Cell
        print("Hi there")
