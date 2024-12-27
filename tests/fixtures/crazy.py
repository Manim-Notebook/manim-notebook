class ManimScene:
    def setup(self):
        self.my_variable = 42

    def construct(self):
        a = 5

        class InnerClass:
            def __init__(self):
                self.a = 5

            def inner_function(self):
                ## A Manim Cell
                a = 6
                b = 3

                # comment
                print(a + b)

        def this_is():
            def very():
                ## A cell here ;)
                def nested():
                    # print()
                    # print()
                    # print()
                    def even_more():
                        print("Hello world")

                return nested

            return very

        print(this_is())

        # some comments

        ## A Manim Cell
        a = 6
        b = 3
        c = 42

        def inline_function():
            a = 5
            b = 6
            c = 7
            return a + b + c

        d = 5
        e = 6
        f = 8

        ## Another Manim cell
        a = 6
        b = 3

        # Important
        c = 42
        d = 5
        e = 6
        f = 8

        ## Another one
        # Here
        def inside():
            ## nested cells are not supported
            a = 5

    def another_function(self):
        print("Hello world")
