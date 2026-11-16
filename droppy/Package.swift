// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "EdenGen",
    platforms: [.macOS(.v14)],
    products: [
        .library(name: "EdenGen", type: .dynamic, targets: ["EdenGen"])
    ],
    dependencies: [
        .package(url: "https://gitlab.com/droppyformac1/droppykit.git", from: "1.23.0")
    ],
    targets: [
        .target(
            name: "EdenGen",
            dependencies: [.product(name: "DroppyKit", package: "droppykit")],
            swiftSettings: [.swiftLanguageMode(.v5)]
        ),
        .executableTarget(
            name: "EdenGenHarness",
            dependencies: [
                "EdenGen",
                .product(name: "DroppyKitHarness", package: "droppykit")
            ],
            swiftSettings: [.swiftLanguageMode(.v5)]
        )
    ]
)
