package(default_visibility = ["//visibility:public"])

load("@org_tensorflow_tensorboard//tensorboard/defs:web.bzl", "tf_web_library")
load("@org_tensorflow_tensorboard//tensorboard/defs:vulcanize.bzl", "tensorboard_html_binary")

licenses(["notice"])  # Apache 2.0

tf_web_library(
    name = "facets_dive",
    srcs = [
        "facets-dive.html",
        "facets-dive.ts",
    ],
    path = "/facets-dive/components/facets-dive",
    deps = [
        "//facets_dive/components/facets_dive_controls",
        "//facets_dive/components/facets_dive_info_card",
        "//facets_dive/components/facets_dive_vis",
        "//facets_dive/lib:stats",
        "@org_polymer_iron_icons",
        "@org_polymer_paper_button",
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
    path = "/facets-dive/components/facets-dive",
    deps = [
        ":facets_dive",
        "//facets_dive/lib/test:externs",
        "@org_tensorflow_tensorboard//tensorboard/components/tf_imports:web_component_tester",
    ],
)

tensorboard_html_binary(
    name = "devserver",
    testonly = True,
    input_path = "/facets-dive/components/facets-dive/test.html",
    output_path = "/facets-dive/components/facets-dive/runner.html",
    deps = [":test"],
)
