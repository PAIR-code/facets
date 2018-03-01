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
        "//facets_overview/components/facets_overview",
        "//facets_dive/components/facets_dive",
    ],
)

tensorboard_html_binary(
    name = "facets",
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
    cmd = "sed 's|<!doctype html>|<!doctype html><script>define=undefined</script>|' $(location :facets) > $@"
)