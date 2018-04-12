package(
    default_testonly = True,
    default_visibility = ["//visibility:public"],
)

load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")
load("@org_tensorflow_tensorboard//tensorboard/defs:web.bzl", "tf_web_library")
load("@org_tensorflow_tensorboard//tensorboard/defs:vulcanize.bzl", "tensorboard_html_binary")

licenses(["notice"])  # Apache 2.0

closure_js_library(
    name = "externs",
    srcs = ["externs.js"],
)

tf_web_library(
    name = "test",
    srcs = [
        "axis_test.ts",
        "bounded-object_test.ts",
        "grid_test.ts",
        "layout_test.ts",
        "sorting_test.ts",
        "sprite-atlas_test.ts",
        "sprite-material_test.ts",
        "sprite-mesh_test.ts",
        "stats_test.ts",
        "test.html",
        "text_test.ts",
        "wordtree_test.ts",
    ],
    path = "/facets-dive/lib/test",
    deps = [
        ":externs",
        "//facets_dive/lib:axis",
        "//facets_dive/lib:bounded-object",
        "//facets_dive/lib:grid",
        "//facets_dive/lib:layout",
        "//facets_dive/lib:sorting",
        "//facets_dive/lib:sprite-atlas",
        "//facets_dive/lib:sprite-material",
        "//facets_dive/lib:sprite-mesh",
        "//facets_dive/lib:stats",
        "//facets_dive/lib:text",
        "//facets_dive/lib:wordtree",
        "@org_tensorflow_tensorboard//tensorboard/components/tf_imports:web_component_tester",
    ],
)

# Compiles standalone HTML file that tests facets-dive libs.
#
#   $ bazel run //facets_dive/lib/test:devserver
#   $ google-chrome http://localhost:6006/facets-dive/lib/test/runner.html
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
    input_path = "/facets-dive/lib/test/test.html",
    output_path = "/facets-dive/lib/test/runner.html",
    deps = [":test"],
)
