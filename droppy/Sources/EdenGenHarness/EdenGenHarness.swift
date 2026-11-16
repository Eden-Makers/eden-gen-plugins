// Not named main.swift: Swift treats that name as top-level code, which cannot coexist with @main.

import DroppyKit
import DroppyKitHarness
import EdenGen

@main
struct EdenGenHarness: DropletHarnessApp {
    static func makeDroplet() -> any Droplet { EdenGenDroplet() }
}
