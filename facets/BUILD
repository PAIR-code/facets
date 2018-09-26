package(default_visibility = ["//visibility:public"])

load("@org_tensorflow_tensorboard//tensorboard/defs:web.bzl", "tf_web_library")
load("@org_tensorflow_tensorboard//tensorboard/defs:vulcanize.bzl", "tensorboard_html_binary")

licenses(["notice"])  # Apache 2.0

tf_web_library(
    name = "visualizations",
    srcs = [
        "visualizations.html",
    ],
    path = "/facets",
    deps = [
        "//facets_dive/components/facets_dive",
        "//facets_overview/components/facets_overview",
    ],
)

# Compiles standalone HTML for Facets Dive demo, used by ":facets_jupyter"
#
# NOTE: This runs TensorBoard Vulcanize.java to inline HTML imports and
#       runs the Closure Compiler on the JavaScript outputted by the
#       TypeScript Compiler, in order to remove ES6 imports, which don't
#       work in web browsers. Otherwise we'd `bazel run` tf_web_library.
tensorboard_html_binary(
    name = "facets",
    compile = True,
    input_path = "/facets/visualizations.html",
    output_path = "/all/visualizations.html",
    deps = [":visualizations"],
)

# Add javascript to undefine the define function when building the vulcanized
# visualizations. This is to avoid issues with require.js dependency loading
# when using the visualizations inside of a Jupyter notebook.
# TODO(jwexler): Figure out a cleaner way to get vulcanized visualizations that
# work in Jupyter notebooks.
genrule(
    name = "facets_jupyter",
    srcs = [":facets"],
    outs = ["facets-jupyter.html"],
    cmd = "sed 's|<!doctype html>|<!doctype html><script>define=undefined</script>|' $(location :facets) > $@",
)
