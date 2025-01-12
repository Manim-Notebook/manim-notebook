from manimlib import *


class BasicNotebook(Scene):
    def construct(self):
        ## A Manim Cell
        print("With some code")
        print("With some more code")

        ## And another Manim Cell
        print("And even more code")

        class AnInvalidManimScene(Scene):
            def construct(self):
                ## Not a Manim Cell, but still detected as one
                # We mark this as undefined behavior and Manim does not support
                # a scene inside another scene.
                # We still consider this as a Manim Cell since detecting this
                # case would be too cumbersome to be worth it to consider.
                # The user will find out in Manim itself that this is not
                # supported.
                print("Not a valid Manim Scene")


class BaseClass(Scene):
    def setup(self):
        print("Setting up")


class SubClass(BaseClass):
    def construct(self):
        ## A Manim Cell in a subclass
        print("Constructing")
        print("Hey there")

        ## Another Manim Cell in a subclass
        print("Constructing more")
