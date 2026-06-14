import SwiftUI

/// Add/edit a meal: name + repeatable ingredient rows (name, qty, unit, category).
/// Ported from the web `MealEditor`. `onSave` is called with cleaned values.
struct MealEditorView: View {
    let meal: Meal?
    let onSave: (_ name: String, _ ingredients: [Ingredient]) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var name: String
    @State private var rows: [Ingredient]

    init(meal: Meal?, onSave: @escaping (_ name: String, _ ingredients: [Ingredient]) -> Void) {
        self.meal = meal
        self.onSave = onSave
        _name = State(initialValue: meal?.name ?? "")
        _rows = State(initialValue: meal?.ingredients ?? [])
    }

    private var canSave: Bool { !name.trimmingCharacters(in: .whitespaces).isEmpty }

    var body: some View {
        NavigationStack {
            Form {
                Section("Meal name") {
                    TextField("e.g. Frozen Pepperoni Pizza", text: $name)
                }

                Section("Ingredients (optional)") {
                    if rows.isEmpty {
                        Text("No ingredients yet. Add them to power the shopping list.")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    ForEach($rows) { $row in
                        IngredientRow(row: $row)
                    }
                    .onDelete { rows.remove(atOffsets: $0) }

                    Button { rows.append(Ingredient(name: "")) } label: {
                        Label("Add ingredient", systemImage: "plus")
                    }
                }
            }
            .navigationTitle(meal == nil ? "New meal" : "Edit meal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }.disabled(!canSave)
                }
            }
        }
    }

    private func save() {
        let cleaned: [Ingredient] = rows.compactMap { r in
            let n = r.name.trimmingCharacters(in: .whitespaces)
            guard !n.isEmpty else { return nil }
            return Ingredient(
                name: n,
                qty: r.qty?.trimmingCharacters(in: .whitespaces).nilIfEmpty,
                unit: r.unit?.trimmingCharacters(in: .whitespaces).nilIfEmpty,
                category: r.category
            )
        }
        onSave(name.trimmingCharacters(in: .whitespaces), cleaned)
        dismiss()
    }
}

private struct IngredientRow: View {
    @Binding var row: Ingredient
    var body: some View {
        VStack(spacing: 8) {
            TextField("Name", text: $row.name)
            HStack {
                TextField("Qty", text: Binding($row.qty, default: ""))
                    .frame(maxWidth: 70)
                TextField("Unit", text: Binding($row.unit, default: ""))
                    .frame(maxWidth: 90)
                Spacer()
                Picker("Category", selection: $row.category) {
                    ForEach(Category.allCases) { Text($0.label).tag($0) }
                }
                .labelsHidden()
            }
            .font(.subheadline)
        }
        .padding(.vertical, 2)
    }
}

extension String {
    var nilIfEmpty: String? { isEmpty ? nil : self }
}

extension Binding where Value == String {
    /// Bind a `String?` field to a non-optional `TextField`.
    init(_ source: Binding<String?>, default fallback: String) {
        self.init(
            get: { source.wrappedValue ?? fallback },
            set: { source.wrappedValue = $0 }
        )
    }
}
