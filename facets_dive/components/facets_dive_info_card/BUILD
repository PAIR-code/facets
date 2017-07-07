package(default_visibility = ["//visibility:public"])

load("@org_tensorflow_tensorboard//tensorboard/defs:web.bzl", "ts_web_library")
load("@org_tensorflow_tensorboard//tensorboard/defs:vulcanize.bzl", "tensorboard_html_binary")

licenses(["notice"])  # Apache 2.0

ts_web_library(
    name = "facets_dive_info_card",
    srcs = [
        "facets-dive-info-card.html",
        "facets-dive-info-card.ts",
    ],
    path = "/facets-dive/components/facets-dive-info-card",
    deps = [
        "//facets_dive/lib:info-renderers",
        "@org_polymer_paper_card",
        "@org_polymer_paper_material_styles",
        "@org_polymer_paper_styles",
        "@org_tensorflow_tensorboard//tensorboard/components/tf_imports:polymer",
    ],
)

ts_web_library(
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

tensorboard_html_binary(
    name = "devserver",
    testonly = True,
    input_path = "/facets-dive/components/facets-dive-info-card/test.html",
    output_path = "/facets-dive/components/facets-dive-info-card/runner.html",
    deps = [":test"],
)
