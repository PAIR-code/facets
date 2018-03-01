package(default_visibility = ["//visibility:public"])

load("@org_tensorflow_tensorboard//tensorboard/defs:web.bzl", "tf_web_library")
load("@org_tensorflow_tensorboard//tensorboard/defs:vulcanize.bzl", "tensorboard_html_binary")

licenses(["notice"])  # Apache 2.0

tf_web_library(
    name = "facets_dive_controls",
    srcs = [
        "facets-dive-controls.html",
        "facets-dive-controls.ts",
    ],
    path = "/facets-dive/components/facets-dive-controls",
    deps = [
        "//facets_dive/components/facets_dive_vis",
        "//facets_dive/lib:stats",
        "//facets_dive/lib:string-format",
        "@org_polymer_iron_icons",
        "@org_polymer_paper_checkbox",
        "@org_polymer_paper_dropdown_menu",
        "@org_polymer_paper_icon_button",
        "@org_polymer_paper_input",
        "@org_polymer_paper_item",
        "@org_polymer_paper_listbox",
        "@org_polymer_paper_menu",
        "@org_polymer_paper_radio_button",
        "@org_polymer_paper_radio_group",
        "@org_polymer_paper_slider",
        "@org_polymer_paper_styles",
        "@org_polymer_paper_tooltip",
        "@org_tensorflow_tensorboard//tensorboard/components/tf_imports:d3",
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
    path = "/facets-dive/components/facets-dive-controls",
    deps = [
        ":facets_dive_controls",
        "//facets_dive/lib/test:externs",
        "@org_tensorflow_tensorboard//tensorboard/components/tf_imports:web_component_tester",
    ],
)

tensorboard_html_binary(
    name = "devserver",
    testonly = True,
    input_path = "/facets-dive/components/facets-dive-controls/test.html",
    output_path = "/facets-dive/components/facets-dive-controls/runner.html",
    deps = [":test"],
)
