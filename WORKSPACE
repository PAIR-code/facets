workspace(name = "ai_google_pair_facets")

http_archive(
    name = "io_bazel_rules_closure",
    sha256 = "b29a8bc2cb10513c864cb1084d6f38613ef14a143797cea0af0f91cd385f5e8c",
    strip_prefix = "rules_closure-0.8.0",
    urls = [
        "https://mirror.bazel.build/github.com/bazelbuild/rules_closure/archive/0.8.0.tar.gz",
        "https://github.com/bazelbuild/rules_closure/archive/0.8.0.tar.gz",  # 2018-08-03
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
    sha256 = "892999b71a8b51f20fecf52eb70ed357eb2db1f0834dec73d43de3b86aa761ef",
    strip_prefix = "tensorboard-199cf2c94fa097ccc67aca71ebf5870eef4bc78d",
    urls = [
        "https://mirror.bazel.build/github.com/tensorflow/tensorboard/archive/199cf2c94fa097ccc67aca71ebf5870eef4bc78d.tar.gz",
        "https://github.com/tensorflow/tensorboard/archive/199cf2c94fa097ccc67aca71ebf5870eef4bc78d.tar.gz",  # 2018-09-05
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
