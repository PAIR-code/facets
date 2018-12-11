package(default_visibility = ["//visibility:public"])

load("@org_tensorflow_tensorboard//tensorboard/defs:web.bzl", "tf_web_library")

licenses(["notice"])  # Apache 2.0

tf_web_library(
    name = "facets_overview_row_legend",
    srcs = [
        "facets-overview-row-legend.html",
        "facets-overview-row-legend.ts",
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
    path = "/facets-overview/components/facets-overview-row-legend",
    deps = [
        "//facets_overview/common",
        "//facets_overview/proto:feature_statistics_closure_proto",
        "@org_tensorflow_tensorboard//tensorboard/components/tf_imports:polymer",
    ],
)
