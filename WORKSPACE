workspace(name = "ai_google_pair_facets")

http_archive(
    name = "io_bazel_rules_closure",
    sha256 = "6691c58a2cd30a86776dd9bb34898b041e37136f2dc7e24cadaeaf599c95c657",
    strip_prefix = "rules_closure-08039ba8ca59f64248bb3b6ae016460fe9c9914f",
    urls = [
        "https://mirror.bazel.build/github.com/bazelbuild/rules_closure/archive/08039ba8ca59f64248bb3b6ae016460fe9c9914f.tar.gz",
        "https://github.com/bazelbuild/rules_closure/archive/08039ba8ca59f64248bb3b6ae016460fe9c9914f.tar.gz",  # 2018-01-16
    ],
)

load("@io_bazel_rules_closure//closure:defs.bzl", "closure_repositories")
load("@io_bazel_rules_closure//closure:defs.bzl", "web_library_external")
load("@io_bazel_rules_closure//closure:defs.bzl", "filegroup_external")

closure_repositories()

http_archive(
    name = "org_tensorflow_tensorboard",
    sha256 = "16f6bc5ffb609fd0ab7752529c04de6f04c31644dc94933dbb578c33242788f8",
    strip_prefix = "tensorboard-5d0c749863c6e23bbc9cc26dbac0a87cf99535af",
    urls = [
	    "http://mirror.bazel.build/github.com/tensorflow/tensorboard/archive/5d0c749863c6e23bbc9cc26dbac0a87cf99535af.tar.gz",  # 2018-03-01
	    "https://github.com/tensorflow/tensorboard/archive/5d0c749863c6e23bbc9cc26dbac0a87cf99535af.tar.gz",
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
        "http://mirror.bazel.build/github.com/PolymerElements/paper-card/archive/v2.0.0.tar.gz",
        "https://github.com/PolymerElements/paper-card/archive/v2.0.0.tar.gz",
    ],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_flex_layout",
        "@org_polymer_iron_image",
        "@org_polymer_paper_material_styles",
        "@org_polymer_paper_styles",
    ],
)

web_library_external(
    name = "org_polymer_paper_material_styles",
    srcs = [
        "element-styles/paper-material-styles.html",
    ],
    licenses = ["notice"],  # BSD-3-Clause
    path = "/paper-styles",
    sha256 = "abd39f4546cf11983ae70a2bb69cbb2af12918874a5fe7d803e447eea77520d6",
    strip_prefix = "paper-styles-2.0.0",
    urls = [
        "http://mirror.bazel.build/github.com/PolymerElements/paper-styles/archive/v2.0.0.tar.gz",
        "https://github.com/PolymerElements/paper-styles/archive/v2.0.0.tar.gz",
    ],
    deps = [
        "@org_polymer",
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
        "http://mirror.bazel.build/github.com/PolymerElements/iron-image/archive/v2.0.0.tar.gz",
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
        "http://mirror.bazel.build/github.com/PolymerElements/iron-validator-behavior/archive/v1.0.2.tar.gz",
        "https://github.com/PolymerElements/iron-validator-behavior/archive/v1.0.2.tar.gz",
    ],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_meta",
    ],
)
