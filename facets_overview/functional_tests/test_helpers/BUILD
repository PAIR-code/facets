package(
    default_testonly = True,
    default_visibility = ["//visibility:public"],
)

load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")
load("@org_tensorflow_tensorboard//tensorboard/defs:web.bzl", "tf_web_library")

licenses(["notice"])  # Apache 2.0

closure_js_library(
    name = "externs",
    srcs = ["externs.js"],
)

tf_web_library(
    name = "test_helpers",
    srcs = [
        "test_helpers.ts",
        "test_helpers_bundle.html",
    ],
    clutz_entry_points = [
        "proto.featureStatistics.DatasetFeatureStatistics",
        "proto.featureStatistics.DatasetFeatureStatisticsList",
        "proto.featureStatistics.FeatureNameStatistics",
        "proto.featureStatistics.NumericStatistics",
        "proto.featureStatistics.StringStatistics",
        "proto.featureStatistics.CommonStatistics",
        "proto.featureStatistics.Histogram",
        "proto.featureStatistics.RankHistogram",
    ],
    path = "/facets-overview/functional-tests/test_helpers",
    deps = [
        ":externs",
        "//facets_overview/common",
        "//facets_overview/proto:feature_statistics_closure_proto",
    ],
)
