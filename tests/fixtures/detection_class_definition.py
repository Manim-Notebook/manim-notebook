from manimlib import *


class AnythingElse:
    pass


class Inheritance(AnythingElse):
    def construct(self):
        ## A Manim Cell
        print("With some code")
        print("With some more code")

        ## And another Manim Cell
        print("And even more code")


class InheritanceNothing():  # don't remove "()" here (!)
    def construct(self):
        ## Should not be detected as Manim Cell
        print("With some code")
        print("With some more code")

        ## Should neither be detected as Manim Cell
        print("And even more code")


class InheritanceNothingWithoutParentheses:
    def construct(self):
        ## Should not be detected as Manim Cell
        print("With some code")
        print("With some more code")

        ## Should neither be detected as Manim Cell
        print("And even more code")
