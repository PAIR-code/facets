package(default_visibility = ["//visibility:public"])

load("@org_tensorflow_tensorboard//tensorboard/defs:web.bzl", "tf_web_library")
load("@org_tensorflow_tensorboard//tensorboard/defs:vulcanize.bzl", "tensorboard_html_binary")

licenses(["notice"])  # Apache 2.0

tf_web_library(
    name = "facets_dive_info_card",
    srcs = [
        "facets-dive-info-card.html",
        "facets-dive-info-card.ts",
    ],
    path = "/facets-dive/components/facets-dive-info-card",
    deps = [
        "//facets_dive/lib:info-renderers",
        "@org_polymer_paper_card",
        "@org_polymer_paper_styles",
        "@org_tensorflow_tensorboard//tensorboard/components/tf_imports:polymer",
    ],
)

tf_web_library(
    name = "test",
    testonly = True,
    srcs = [
        "test.html",
        "test.ts",
    ],
    path = "/facets-dive/components/facets-dive-info-card",
    deps = [
        ":facets_dive_info_card",
        "//facets_dive/lib/test:externs",
        "@org_tensorflow_tensorboard//tensorboard/components/tf_imports:web_component_tester",
    ],
)

# Compiles standalone HTML to test facets-dive-info-card component.
#
#   $ bazel run //facets_dive/components/facets_dive_info_card:devserver
#   $ google-chrome http://localhost:6006/facets-dive/components/facets-dive-info-card/runner.html
#
# NOTE: Test output is logged to Chrome's Ctrl+Shift+J console.
# NOTE: This runs TensorBoard Vulcanize.java to inline HTML imports and
#       runs the Closure Compiler on the JavaScript outputted by the
#       TypeScript Compiler, in order to remove ES6 imports, which don't
#       work in web browsers. Otherwise we'd `bazel run` tf_web_library.
tensorboard_html_binary(
    name = "devserver",
    testonly = True,  # Keeps JavaScript somewhat readable
    compile = True,  # Run Closure Compiler
    input_path = "/facets-dive/components/facets-dive-info-card/test.html",
    output_path = "/facets-dive/components/facets-dive-info-card/runner.html",
    deps = [":test"],
)
