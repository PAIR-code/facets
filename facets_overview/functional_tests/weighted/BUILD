package(default_visibility = ["//visibility:public"])

load("@org_tensorflow_tensorboard//tensorboard/defs:web.bzl", "ts_web_library")
load("@org_tensorflow_tensorboard//tensorboard/defs:vulcanize.bzl", "tensorboard_html_binary")

ts_web_library(
    name = "weighted",
    srcs = [
        "weighted_test.ts",
        "weighted-test.html",
        "index.html",
    ],
    clutz_entry_points = [
        "proto.featureStatistics.DatasetFeatureStatistics",
        "proto.featureStatistics.DatasetFeatureStatisticsList",
        "proto.featureStatistics.FeatureNameStatistics",
        "proto.featureStatistics.NumericStatistics",
        "proto.featureStatistics.StringStatistics",
        "proto.featureStatistics.CommonStatistics",
        "proto.featureStatistics.Histogram",
        "proto.featureStatistics.RankHistogram"
    ],
    path = "/facets-overview/functional-tests/weighted",
    deps = [
        "//facets_overview/proto",
        "//facets_overview/common",
        "//facets_overview/components/facets_overview",
        "//facets_overview/functional_tests/test_helpers",
        "@org_tensorflow_tensorboard//tensorboard/components/tf_imports:d3",
        "@org_tensorflow_tensorboard//tensorboard/components/tf_imports:polymer",
        "@org_tensorflow_tensorboard//tensorboard/components/tf_imports:webcomponentsjs",
        "@org_polymer_iron_demo_helpers",
    ]
)

tensorboard_html_binary(
    name = "devserver",
    input_path = "/facets-overview/functional-tests/weighted/index.html",
    output_path = "/facets-overview/functional-tests/weighted/index.html",
    deps = [":weighted"]
)
