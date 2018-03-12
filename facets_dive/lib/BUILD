package(default_visibility = ["//visibility:public"])

load("@org_tensorflow_tensorboard//tensorboard/defs:web.bzl", "tf_web_library")

licenses(["notice"])  # Apache 2.0

tf_web_library(
    name = "axis",
    srcs = [
        "axis.html",
        "axis.ts",
    ],
    path = "/facets-dive/lib",
    deps = [
        ":bounded-object",
        ":grid",
    ],
)

tf_web_library(
    name = "bounded-object",
    srcs = [
        "bounded-object.html",
        "bounded-object.ts",
    ],
    path = "/facets-dive/lib",
)

tf_web_library(
    name = "data-example",
    srcs = [
        "data-example.html",
        "data-example.ts",
    ],
    path = "/facets-dive/lib",
)

tf_web_library(
    name = "grid",
    srcs = [
        "grid.html",
        "grid.ts",
    ],
    path = "/facets-dive/lib",
    deps = [":sorting"],
)

tf_web_library(
    name = "info-renderers",
    srcs = [
        "info-renderers.html",
        "info-renderers.ts",
    ],
    path = "/facets-dive/lib",
)

tf_web_library(
    name = "label",
    srcs = [
        "label.html",
        "label.ts",
    ],
    path = "/facets-dive/lib",
    deps = [":sorting"],
)

tf_web_library(
    name = "layout",
    srcs = [
        "layout.html",
        "layout.ts",
    ],
    path = "/facets-dive/lib",
)

tf_web_library(
    name = "sorting",
    srcs = [
        "sorting.html",
        "sorting.ts",
    ],
    path = "/facets-dive/lib",
)

tf_web_library(
    name = "stats",
    srcs = [
        "stats.html",
        "stats.ts",
    ],
    path = "/facets-dive/lib",
    deps = [":wordtree"],
)

tf_web_library(
    name = "string-format",
    srcs = [
        "string-format.html",
        "string-format.ts",
    ],
    path = "/facets-dive/lib",
)

tf_web_library(
    name = "text",
    srcs = [
        "text.html",
        "text.ts",
    ],
    path = "/facets-dive/lib",
)

tf_web_library(
    name = "sprite-atlas",
    srcs = [
        "sprite-atlas.html",
        "sprite-atlas.ts",
    ],
    path = "/facets-dive/lib",
    deps = [
        ":text",
        "@org_tensorflow_tensorboard//tensorboard/components/tf_imports:threejs",
    ],
)

tf_web_library(
    name = "sprite-material",
    srcs = [
        "sprite-material.html",
        "sprite-material.ts",
    ],
    path = "/facets-dive/lib",
    deps = [
        ":sprite-atlas",
        "@org_tensorflow_tensorboard//tensorboard/components/tf_imports:threejs",
    ],
)

tf_web_library(
    name = "sprite-mesh",
    srcs = [
        "sprite-mesh.html",
        "sprite-mesh.ts",
    ],
    path = "/facets-dive/lib",
    deps = [
        ":sprite-atlas",
        ":sprite-material",
        "@org_tensorflow_tensorboard//tensorboard/components/tf_imports:threejs",
    ],
)

tf_web_library(
    name = "wordtree",
    srcs = [
        "wordtree.html",
        "wordtree.ts",
    ],
    path = "/facets-dive/lib",
)
