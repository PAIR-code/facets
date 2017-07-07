package(default_visibility = ["//visibility:public"])

load("@org_tensorflow_tensorboard//tensorboard/defs:web.bzl", "ts_web_library")
load("@org_tensorflow_tensorboard//tensorboard/defs:vulcanize.bzl", "tensorboard_html_binary")

licenses(["notice"])  # Apache 2.0

ts_web_library(
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

tensorboard_html_binary(
    name = "demo",
    testonly = True,
    input_path = "/facets-dive/demo/quickdraw.html",
    output_path = "/facets-dive/demo/quickdraw.html",
    deps = [":quickdraw"],
)
