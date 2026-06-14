import SwiftUI

/// Add/edit a restaurant: name + comma-separated tags. Ported from `RestaurantEditor`.
struct RestaurantEditorView: View {
    let restaurant: Restaurant?
    let onSave: (_ name: String, _ tags: [String]) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var name: String
    @State private var tagsText: String

    init(restaurant: Restaurant?, onSave: @escaping (_ name: String, _ tags: [String]) -> Void) {
        self.restaurant = restaurant
        self.onSave = onSave
        _name = State(initialValue: restaurant?.name ?? "")
        _tagsText = State(initialValue: restaurant?.tags.joined(separator: ", ") ?? "")
    }

    private var canSave: Bool { !name.trimmingCharacters(in: .whitespaces).isEmpty }

    var body: some View {
        NavigationStack {
            Form {
                Section("Name") {
                    TextField("e.g. Luigi's Pizzeria", text: $name)
                }
                Section("Tags (comma-separated)") {
                    TextField("Pizza, Italian", text: $tagsText)
                        .autocorrectionDisabled()
                }
            }
            .navigationTitle(restaurant == nil ? "New restaurant" : "Edit restaurant")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }.disabled(!canSave)
                }
            }
        }
    }

    private func save() {
        let tags = tagsText.split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
        onSave(name.trimmingCharacters(in: .whitespaces), tags)
        dismiss()
    }
}
