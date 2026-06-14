import SwiftUI
import SwiftData
import UniformTypeIdentifiers

/// The "Dinners" tab — segmented Meals / Restaurants / Sides, plus backup/restore
/// in the toolbar. Mirrors the web Favorites page (which also hosts backup/restore).
struct FavoritesView: View {
    enum Section: String, CaseIterable, Identifiable {
        case meals = "Meals", restaurants = "Restaurants", sides = "Sides"
        var id: String { rawValue }
    }

    @Environment(\.modelContext) private var context
    @State private var section: Section = .meals

    // Backup / restore UI state.
    @State private var shareURL: URL?
    @State private var showShare = false
    @State private var showImporter = false
    @State private var pendingRestoreURL: URL?
    @State private var restoreErrorMessage: String?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("Section", selection: $section) {
                    ForEach(Section.allCases) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)
                .padding()

                switch section {
                case .meals: MealsListView()
                case .restaurants: RestaurantsListView()
                case .sides: SidesListView()
                }
            }
            .navigationTitle("Dinners")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Button { backup() } label: { Label("Backup", systemImage: "square.and.arrow.up") }
                        Button { showImporter = true } label: { Label("Restore", systemImage: "square.and.arrow.down") }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            // Share the freshly generated backup file.
            .sheet(isPresented: $showShare) {
                if let shareURL { ShareSheet(items: [shareURL]) }
            }
            // Pick a backup file to restore.
            .fileImporter(isPresented: $showImporter, allowedContentTypes: [.json]) { result in
                switch result {
                case .success(let url): pendingRestoreURL = url
                case .failure(let error): restoreErrorMessage = error.localizedDescription
                }
            }
            // Confirm before replacing all data.
            .confirmationDialog(
                "Replace all data with backup?",
                isPresented: Binding(get: { pendingRestoreURL != nil }, set: { if !$0 { pendingRestoreURL = nil } }),
                titleVisibility: .visible
            ) {
                Button("Replace", role: .destructive) { performRestore() }
                Button("Cancel", role: .cancel) { pendingRestoreURL = nil }
            } message: {
                Text("Your current meals, restaurants, sides, and week will be overwritten. This cannot be undone.")
            }
            .alert("Restore failed", isPresented: Binding(get: { restoreErrorMessage != nil }, set: { if !$0 { restoreErrorMessage = nil } })) {
                Button("OK", role: .cancel) { restoreErrorMessage = nil }
            } message: {
                Text(restoreErrorMessage ?? "")
            }
        }
    }

    private func backup() {
        guard let url = Backup.exportFileURL(context) else { return }
        shareURL = url
        showShare = true
    }

    private func performRestore() {
        guard let url = pendingRestoreURL else { return }
        defer { pendingRestoreURL = nil }
        do { try Backup.restore(from: url, into: context) }
        catch { restoreErrorMessage = error.localizedDescription }
    }
}
