package(default_visibility = ["//visibility:public"])

load("@org_tensorflow_tensorboard//tensorboard/defs:web.bzl", "tf_web_library")

licenses(["notice"])  # Apache 2.0

tf_web_library(
    name = "facets_overview",
    srcs = [
        "facets-overview.html",
        "facets-overview.ts",
        "facets-overview-filter-validator.html",
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
    path = "/facets-overview/components/facets-overview",
    deps = [
        "//facets_overview/common",
        "//facets_overview/components/facets_overview_table",
        "//facets_overview/proto:feature_statistics_closure_proto",
        "@org_polymer_iron_list",
        "@org_polymer_iron_validator_behavior",
        "@org_polymer_paper_checkbox",
        "@org_polymer_paper_dropdown_menu",
        "@org_polymer_paper_input",
        "@org_polymer_paper_item",
        "@org_polymer_paper_listbox",
        "@org_tensorflow_tensorboard//tensorboard/components/tf_imports:polymer",
    ],
)
