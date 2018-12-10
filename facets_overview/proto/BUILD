package(default_visibility = ["//visibility:public"])

load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_proto_library")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_proto_library")

licenses(["notice"])  # Apache 2.0

proto_library(
    name = "feature_statistics_proto",
    srcs = [
        "feature_statistics.proto",
    ],
)

closure_proto_library(
    name = "feature_statistics_closure_proto",
    deps = [
        ":feature_statistics_proto",
    ],
)

# TODO: Remove when all callers are migrated to '//facets_overview/:feature_statistics_closure_proto'.
closure_js_proto_library(
    name = "proto",
    srcs = ["feature_statistics.proto"],
    deprecation = "Please migrate to '//facets_overview/proto:feature_statistics_closure_proto'.",
)
