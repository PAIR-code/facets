workspace(name = "ai_google_pair_facets")

http_archive(
    name = "io_bazel_rules_closure",
    sha256 = "7fb23196455e26d83559cf8a2afa13f720d512f10215228186badfe6d6ad1b18",
    strip_prefix = "rules_closure-0.6.0",
    urls = [
        "https://mirror.bazel.build/github.com/bazelbuild/rules_closure/archive/0.6.0.tar.gz",
        "https://github.com/bazelbuild/rules_closure/archive/0.6.0.tar.gz",
    ],
)

load("@io_bazel_rules_closure//closure:defs.bzl", "closure_repositories")
load("@io_bazel_rules_closure//closure:defs.bzl", "web_library_external")
load("@io_bazel_rules_closure//closure:defs.bzl", "filegroup_external")

closure_repositories()

http_archive(
    name = "org_tensorflow_tensorboard",
    sha256 = "e3f39f67b950da1f80198d4534afa44f3a2335cb69940577294ad3cf90ce23be",
    strip_prefix = "tensorboard-46a0b7d947618f2ea50f982e73688f6b91119ad4",
    urls = [
        "https://mirror.bazel.build/github.com/tensorflow/tensorboard/archive/46a0b7d947618f2ea50f982e73688f6b91119ad4.tar.gz",
        "https://github.com/tensorflow/tensorboard/archive/46a0b7d947618f2ea50f982e73688f6b91119ad4.tar.gz",
    ],
)

load("@org_tensorflow_tensorboard//third_party:workspace.bzl", "tensorboard_workspace")

tensorboard_workspace()

web_library_external(
    name = "org_polymer_paper_card",
    srcs = ["paper-card.html"],
    licenses = ["notice"],  # BSD-3-Clause
    path = "/paper-card",
    sha256 = "daf6f5326501f74811c2e10ca4ca8d2a42613e88f3ac64e218e6a3cf4cc1dac2",
    strip_prefix = "paper-card-2.0.0",
    urls = [
        "https://mirror.bazel.build/github.com/PolymerElements/paper-card/archive/v2.0.0.tar.gz",
        "https://github.com/PolymerElements/paper-card/archive/v2.0.0.tar.gz",
    ],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_flex_layout",
        "@org_polymer_iron_image",
        "@org_polymer_paper_styles",
    ],
)

web_library_external(
    name = "org_polymer_iron_image",
    srcs = ["iron-image.html"],
    licenses = ["notice"],  # BSD-3-Clause
    path = "/iron-image",
    sha256 = "40c7b2ec941e29a1721c6fb19d6de69308c50a960a3c3319faf2447eed0d4d88",
    strip_prefix = "iron-image-2.0.0",
    urls = [
        "https://mirror.bazel.build/github.com/PolymerElements/iron-image/archive/v2.0.0.tar.gz",
        "https://github.com/PolymerElements/iron-image/archive/v2.0.0.tar.gz",
    ],
    deps = [
        "@org_polymer",
    ],
)

web_library_external(
    name = "org_polymer_iron_validator_behavior",
    srcs = ["iron-validator-behavior.html"],
    licenses = ["notice"],  # BSD-3-Clause
    path = "/iron-validator-behavior",
    sha256 = "0956488f849c0528d66d5ce28bbfb66e163a7990df2cc5f157a5bf34dcb7dfd2",
    strip_prefix = "iron-validator-behavior-1.0.2",
    urls = [
        "https://mirror.bazel.build/github.com/PolymerElements/iron-validator-behavior/archive/v1.0.2.tar.gz",
        "https://github.com/PolymerElements/iron-validator-behavior/archive/v1.0.2.tar.gz",
    ],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_meta",
    ],
)
