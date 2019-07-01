workspace(name = "ai_google_pair_facets")

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

# Needed as a transitive dependency of rules_webtesting below.
http_archive(
    name = "bazel_skylib",
    sha256 = "2b9af2de004d67725c9985540811835389b229c27874f2e15f5e319622a53a3b",
    strip_prefix = "bazel-skylib-e9fc4750d427196754bebb0e2e1e38d68893490a",
    urls = [
        "https://mirror.bazel.build/github.com/bazelbuild/bazel-skylib/archive/e9fc4750d427196754bebb0e2e1e38d68893490a.tar.gz",
        "https://github.com/bazelbuild/bazel-skylib/archive/e9fc4750d427196754bebb0e2e1e38d68893490a.tar.gz",
    ],
)

load("@bazel_skylib//lib:versions.bzl", "versions")

versions.check(minimum_bazel_version = "0.22.0")

http_archive(
    name = "io_bazel_rules_closure",
    sha256 = "b6936ecc0b5a1ef616b9d7e76694d414aa5605265c11322257a610fb256b1bf7",
    # The changes that we need for Bazel 0.26 compatibility are not in
    # any release, so we pin to HEAD as of 2019-06-04.
    strip_prefix = "rules_closure-7434c41542ca9e1b05166d897b90073d1b8b2cf8",
    urls = [
        "http://mirror.tensorflow.org/github.com/bazelbuild/rules_closure/archive/7434c41542ca9e1b05166d897b90073d1b8b2cf8.tar.gz",
        "https://github.com/bazelbuild/rules_closure/archive/7434c41542ca9e1b05166d897b90073d1b8b2cf8.tar.gz",  # 2019-06-04
    ],
)

http_archive(
    name = "io_bazel_rules_webtesting",
    sha256 = "89f041028627d801ba3b4ea1ef2211994392d46e25c1fc3501b95d51698e4a1e",
    strip_prefix = "rules_webtesting-0.2.2",
    urls = [
        "https://mirror.bazel.build/github.com/bazelbuild/rules_webtesting/archive/0.2.2.tar.gz",
        "https://github.com/bazelbuild/rules_webtesting/archive/0.2.2.tar.gz",
    ],
)

load("@io_bazel_rules_closure//closure:defs.bzl", "closure_repositories")
load("@io_bazel_rules_closure//closure:defs.bzl", "web_library_external")
load("@io_bazel_rules_closure//closure:defs.bzl", "filegroup_external")

closure_repositories(
    #    omit_com_google_protobuf = True,
    omit_com_google_protobuf_js = True,
)
http_archive(
    name = "org_tensorflow_tensorboard",
    sha256 = "09ced8f421fb9d4e73b3b0f8f44c91ee653251e7c2e2b953a4774a507c348a86",
    strip_prefix = "tensorboard-b7dd0e369dfe51f6f08dbaf3e85fe0942dbaf64f",
    urls = [
        "https://github.com/stephanwlee/tensorboard/archive/b7dd0e369dfe51f6f08dbaf3e85fe0942dbaf64f.tar.gz",  # 2019-06-28
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
