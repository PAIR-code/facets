package(
    default_testonly = True,
    default_visibility = ["//visibility:public"],
)

load("@org_tensorflow_tensorboard//tensorboard/defs:web.bzl", "tf_web_library")
load("@org_tensorflow_tensorboard//tensorboard/defs:vulcanize.bzl", "tensorboard_html_binary")

licenses(["notice"])  # Apache 2.0

tf_web_library(
    name = "many",
    srcs = [
        "index.html",
        "many-test.html",
        "many_test.ts",
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
    path = "/facets-overview/functional-tests/many",
    deps = [
        "//facets_overview/common",
        "//facets_overview/components/facets_overview",
        "//facets_overview/functional_tests/test_helpers",
        "//facets_overview/proto:feature_statistics_closure_proto",
        "@org_polymer_iron_demo_helpers",
        "@org_tensorflow_tensorboard//tensorboard/components/tf_imports:d3",
        "@org_tensorflow_tensorboard//tensorboard/components/tf_imports:polymer",
        "@org_tensorflow_tensorboard//tensorboard/components/tf_imports:webcomponentsjs",
    ],
)

# Build rule for compiled demo test.
#
#   $ bazel run //facets_overview/functional_tests/many:devserver
#   $ google-chrome http://localhost:6006/facets-overview/functional-tests/many/index.html
#
# NOTE: This runs TensorBoard Vulcanize.java to inline HTML imports and
#       runs the Closure Compiler on the JavaScript outputted by the
#       TypeScript Compiler, in order to remove ES6 imports, which don't
#       work in web browsers. Otherwise we'd `bazel run` tf_web_library.
tensorboard_html_binary(
    name = "devserver",
    compile = True,
    input_path = "/facets-overview/functional-tests/many/index.html",
    output_path = "/facets-overview/functional-tests/many/index.html",
    deps = [":many"],
)
