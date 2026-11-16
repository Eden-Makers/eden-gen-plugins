import DroppyKit
import SwiftUI
import UniformTypeIdentifiers

@objc(EdenGenPrincipal)
public final class EdenGenPrincipal: NSObject, DropletPrincipal {
    public override init() { super.init() }

    @MainActor public func makeDroplet() -> AnyObject { EdenGenDroplet() }
}

@MainActor
public final class EdenGenDroplet: NSObject, ObservableObject, Droplet, HUDPresenting, DropletURLHandling {
    public nonisolated static let id: DropletID = "eden-gen"

    private var host: DropletHost?
    @Published private(set) var status = "Drop an image"
    @Published private var targeted = false

    public func activate(host: DropletHost) throws {
        self.host = host
        host.log.info("Eden Gen activated")
    }

    public func deactivate() {
        host = nil
    }

    public func handle(_ request: DropletURLRequest) {
        guard let path = request.query["path"], !path.isEmpty else {
            setStatus("The link needs a path query.")
            return
        }
        let url = URL(fileURLWithPath: path)
        let upscale = request.path == "upscale"
        accept(url: url, forceUpscale: upscale ? true : request.path == "reference" ? false : nil)
    }

    func accept(url: URL, forceUpscale: Bool? = nil) {
        let allowed: Set<String> = ["png", "jpg", "jpeg", "webp"]
        guard allowed.contains(url.pathExtension.lowercased()) else {
            setStatus("Use a PNG, JPEG or WebP image.")
            return
        }
        let token = apiToken
        guard !token.isEmpty else {
            setStatus("Add an API token in Eden Gen settings.")
            return
        }
        let upscale = forceUpscale ?? (mode == "upscale")
        setStatus(upscale ? "Uploading for an upscale" : "Uploading as a reference")
        let filename = url.lastPathComponent
        let scoped = url.startAccessingSecurityScopedResource()
        Task {
            defer { if scoped { url.stopAccessingSecurityScopedResource() } }
            do {
                let data = try Data(contentsOf: url)
                let assetID = try await EdenGenAPI.upload(data: data, filename: filename, token: token)
                if !upscale {
                    self.setStatus("Reference \(assetID)")
                    return
                }
                let estimate = try await EdenGenAPI.estimate(assetID: assetID, model: self.modelID, prompt: self.promptText, token: token)
                if estimate.canRun == false {
                    self.setStatus(estimate.blockers.isEmpty ? "This upscale cannot run." : estimate.blockers.joined(separator: " "))
                    return
                }
                let takeID = try await EdenGenAPI.create(
                    assetID: assetID,
                    model: self.modelID,
                    prompt: self.promptText,
                    token: token,
                    usd: estimate.usdTotal,
                    confirm: estimate.needsConfirmation
                )
                self.setStatus("Take \(takeID) · $\(String(format: "%.4f", estimate.usdTotal))")
            } catch {
                self.setStatus(error.localizedDescription)
            }
        }
    }

    private func setStatus(_ text: String) {
        status = text
        guard let host else { return }
        _ = host.hud.present(DropletHUDRequest(
            id: "eden-gen.status",
            duration: 4,
            accessibilityLabel: text
        ) {
            Image(systemName: "photo")
        } trailing: {
            Text(text).lineLimit(1)
        })
    }

    private var apiToken: String { host?.preferences.value(forKey: "apiToken", as: String.self) ?? "" }
    private var mode: String { host?.preferences.value(forKey: "mode", as: String.self) ?? "reference" }
    private var modelID: String { host?.preferences.value(forKey: "model", as: String.self) ?? "nano-banana-pro" }
    private var promptText: String {
        host?.preferences.value(forKey: "prompt", as: String.self)
            ?? "Upscale this image. Keep the subject, framing and colours. Add detail without changing the design."
    }

    var tokenBinding: Binding<String> {
        Binding(get: { self.apiToken }, set: { self.host?.preferences.setValue($0, forKey: "apiToken") })
    }
    var modeBinding: Binding<String> {
        Binding(get: { self.mode }, set: { self.host?.preferences.setValue($0, forKey: "mode") })
    }
    var modelBinding: Binding<String> {
        Binding(get: { self.modelID }, set: { self.host?.preferences.setValue($0, forKey: "model") })
    }
    var promptBinding: Binding<String> {
        Binding(get: { self.promptText }, set: { self.host?.preferences.setValue($0, forKey: "prompt") })
    }
    var isTargeted: Binding<Bool> {
        Binding(get: { self.targeted }, set: { self.targeted = $0 })
    }
}

extension EdenGenDroplet: ShelfWidgetCompositionProviding {
    public var widgetDescriptors: [ShelfWidgetDescriptor] {
        [
            ShelfWidgetDescriptor(
                id: "drop",
                title: "Eden Gen",
                systemImage: "photo.badge.plus",
                layoutTraits: ShelfWidgetLayoutTraits(
                    single: ShelfWidgetModeSize(width: 420, contentHeight: 148),
                    split: ShelfWidgetModeSize(width: 210, contentHeight: 88),
                    header: .standard
                ),
                searchKeywords: ["image", "upscale", "eden", "reference"]
            )
        ]
    }

    public func makeWidgetContent(_ id: ShelfWidgetID, layout: ShelfWidgetLayout) -> AnyView {
        AnyView(EdenGenWidget(droplet: self, layout: layout))
    }
}

extension EdenGenDroplet: SettingsPaneProviding {
    public func makeSettingsPane(context: SettingsPaneContext) -> AnyView {
        _ = context
        let view = EdenGenSettings(droplet: self)
        if let defaults = host?.preferences.userDefaults {
            return AnyView(view.defaultAppStorage(defaults))
        }
        return AnyView(view)
    }
}

struct EdenGenWidget: View {
    @ObservedObject var droplet: EdenGenDroplet
    let layout: ShelfWidgetLayout

    var body: some View {
        ShelfWidgetScaffold("Eden Gen", systemImage: "photo.badge.plus") {
            EmptyView()
        } content: {
            VStack(alignment: .leading, spacing: 8) {
                Text(layout.isSplit ? "Drop an image" : "Drop a PNG, JPEG or WebP")
                    .droppyWidgetText(.title)
                Text(droplet.status)
                    .lineLimit(2)
                    .droppyWidgetText(.body)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .onDrop(of: [.fileURL, .image], isTargeted: droplet.isTargeted) { providers in
                droplet.acceptProviders(providers)
            }
            .droppyWidgetDropTarget(isTargeted: droplet.isTargeted.wrappedValue)
        }
    }
}

struct EdenGenSettings: View {
    @ObservedObject var droplet: EdenGenDroplet

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            DropletSettingsSection {
                Text("Account")
            } content: {
                DropletSettingsCard {
                    SecureField("API token", text: droplet.tokenBinding)
                    Text("Create a token at edengen.ai/app/developers. It stays in this droplet's preferences.")
                }
            }
            DropletSettingsSection {
                Text("Drop")
            } content: {
                DropletSettingsCard {
                    Picker("When an image is dropped", selection: droplet.modeBinding) {
                        Text("Save as a reference").tag("reference")
                        Text("Upscale").tag("upscale")
                    }
                    TextField("Upscale model", text: droplet.modelBinding)
                    TextField("Upscale prompt", text: droplet.promptBinding, axis: .vertical)
                }
            }
        }
        .padding(16)
    }
}

extension EdenGenDroplet {
    func acceptProviders(_ providers: [NSItemProvider]) -> Bool {
        guard let provider = providers.first else { return false }
        if provider.hasItemConformingToTypeIdentifier(UTType.fileURL.identifier) {
            provider.loadItem(forTypeIdentifier: UTType.fileURL.identifier, options: nil) { item, _ in
                let url = Self.url(from: item)
                guard let url else { return }
                Task { @MainActor in self.accept(url: url) }
            }
            return true
        }
        return false
    }

    private static func url(from item: NSSecureCoding?) -> URL? {
        if let url = item as? URL { return url }
        if let data = item as? Data { return URL(dataRepresentation: data, relativeTo: nil) }
        if let text = item as? String { return URL(string: text) }
        return nil
    }
}

private enum EdenGenAPI {
    struct EstimateResult {
        var usdTotal: Double
        var canRun: Bool
        var needsConfirmation: Bool
        var blockers: [String]
    }

    static func upload(data: Data, filename: String, token: String) async throws -> String {
        var request = URLRequest(url: URL(string: "https://edengen.ai/v1/assets")!)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")
        request.setValue(filename.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "image.png", forHTTPHeaderField: "X-Filename")
        request.httpBody = data
        let body = try await send(request)
        guard let id = body["id"] as? String else { throw URLError(.cannotParseResponse) }
        return id
    }

    static func estimate(assetID: String, model: String, prompt: String, token: String) async throws -> EstimateResult {
        let payload: [String: Any] = [
            "model": model,
            "prompt": prompt,
            "aspect_ratio": "16:9",
            "count": 1,
            "references": [["asset_id": assetID, "role": "reference"]],
        ]
        let body = try await post(path: "/estimate", payload: payload, token: token, idempotency: nil)
        let blockers = body["blockers"] as? [String] ?? []
        return EstimateResult(
            usdTotal: body["usd_total"] as? Double ?? 0,
            canRun: body["can_run"] as? Bool ?? false,
            needsConfirmation: body["needs_confirmation"] as? Bool ?? false,
            blockers: blockers
        )
    }

    static func create(assetID: String, model: String, prompt: String, token: String, usd: Double, confirm: Bool) async throws -> String {
        var payload: [String: Any] = [
            "model": model,
            "prompt": prompt,
            "aspect_ratio": "16:9",
            "count": 1,
            "max_cost_usd": usd,
            "references": [["asset_id": assetID, "role": "reference"]],
        ]
        if confirm { payload["confirm_cost"] = true }
        let body = try await post(path: "/takes", payload: payload, token: token, idempotency: UUID().uuidString)
        if let id = body["id"] as? String { return id }
        if let data = body["data"] as? [[String: Any]], let id = data.first?["id"] as? String { return id }
        throw URLError(.cannotParseResponse)
    }

    private static func post(path: String, payload: [String: Any], token: String, idempotency: String?) async throws -> [String: Any] {
        var request = URLRequest(url: URL(string: "https://edengen.ai/v1\(path)")!)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let idempotency { request.setValue(idempotency, forHTTPHeaderField: "Idempotency-Key") }
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        return try await send(request)
    }

    private static func send(_ request: URLRequest) async throws -> [String: Any] {
        let (data, response) = try await URLSession.shared.data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]
        if !(200..<300).contains(status) {
            let message = (json["error"] as? [String: Any])?["message"] as? String ?? "Eden Gen returned HTTP \(status)."
            throw NSError(domain: "EdenGen", code: status, userInfo: [NSLocalizedDescriptionKey: message])
        }
        return json
    }
}
