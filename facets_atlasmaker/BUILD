licenses(["notice"])  # Apache 2.0

py_binary(
    name = "atlasmaker",
    srcs = ["atlasmaker.py"],
    srcs_version = "PY2AND3",
    visibility = ["//visibility:public"],
    deps = [
        ":atlasmaker_io",
        ":convert",
    ],
)

py_library(
    name = "convert",
    srcs = ["convert.py"],
    srcs_version = "PY2AND3",
    deps = [
    ],
)

py_library(
    name = "atlasmaker_io",
    srcs = ["atlasmaker_io.py"],
    srcs_version = "PY2AND3",
)
