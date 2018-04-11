package(default_visibility = ["//visibility:public"])

load("@org_tensorflow_tensorboard//tensorboard/defs:web.bzl", "tf_web_library")
load("@org_tensorflow_tensorboard//tensorboard/defs:vulcanize.bzl", "tensorboard_html_binary")

licenses(["notice"])  # Apache 2.0

tf_web_library(
    name = "quickdraw",
    testonly = True,
    srcs = [
        "quickdraw.html",
        "quickdraw.ts",
    ],
    path = "/facets-dive/demo",
    deps = [
        "//facets_dive/components/facets_dive",
        "//facets_dive/lib/test:externs",
        "@org_tensorflow_tensorboard//tensorboard/components/tf_imports:d3",
    ],
)

# Compiles standalone HTML for Facets Dive demo.
#
#   $ bazel run //facets_dive/demo
#   $ google-chrome http://localhost:6006/
#
# NOTE: This runs TensorBoard Vulcanize.java to inline HTML imports and
#       runs the Closure Compiler on the JavaScript outputted by the
#       TypeScript Compiler, in order to remove ES6 imports, which don't
#       work in web browsers. Otherwise we'd `bazel run` tf_web_library.
tensorboard_html_binary(
    name = "demo",
    testonly = True,  # Keeps JavaScript somewhat readable
    compile = True,  # Run Closure Compiler
    input_path = "/facets-dive/demo/quickdraw.html",
    output_path = "/facets-dive/demo/quickdraw.html",
    deps = [":quickdraw"],
)
