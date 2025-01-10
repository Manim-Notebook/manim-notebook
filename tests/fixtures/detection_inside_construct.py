from manimlib import *


class SceneDetectionInsideConstruct(Scene):
    def construct(self):
        ## A Manim Cell
        def some_function():
            ## Not a Manim Cell
            print("Not a Manim Cell")

        print("With some code")
        some_function()
        print("With some more code")

        ## And another Manim Cell
        print("And even more code")
        some_function()
