import SwiftUI
import SwiftData

/// Searchable list of side dishes with name-only quick-add, inline rename, and
/// delete with confirm. Ported from the web `SidesSection`.
struct SidesListView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \SideDish.name) private var sides: [SideDish]
    @State private var search = ""
    @State private var newName = ""
    @State private var editingId: String?
    @State private var editName = ""
    @State private var toDelete: SideDish?
    @FocusState private var addFocused: Bool

    private var filtered: [SideDish] {
        let q = search.trimmingCharacters(in: .whitespaces).lowercased()
        guard !q.isEmpty else { return sides }
        return sides.filter { $0.name.lowercased().contains(q) }
    }

    var body: some View {
        List {
            Section {
                HStack {
                    TextField("Add a side dish (e.g. Garlic Bread)", text: $newName)
                        .focused($addFocused)
                        .onSubmit(add)
                    Button("Add", action: add)
                        .disabled(newName.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }

            Section {
                if filtered.isEmpty {
                    Text(sides.isEmpty ? "No side dishes yet. Add one above!" : "No matches.")
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(filtered) { side in
                        if editingId == side.id {
                            HStack {
                                TextField("Name", text: $editName)
                                    .onSubmit { commitRename(side) }
                                Button("Save") { commitRename(side) }
                                    .disabled(editName.trimmingCharacters(in: .whitespaces).isEmpty)
                                Button("Cancel") { editingId = nil }
                                    .foregroundStyle(.secondary)
                            }
                        } else {
                            Text(side.name)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .contentShape(Rectangle())
                                .onTapGesture { editingId = side.id; editName = side.name }
                                .swipeActions {
                                    Button(role: .destructive) { toDelete = side } label: { Label("Delete", systemImage: "trash") }
                                    Button { editingId = side.id; editName = side.name } label: { Label("Rename", systemImage: "pencil") }
                                        .tint(.blue)
                                }
                        }
                    }
                }
            }
        }
        .searchable(text: $search, prompt: "Search sides")
        .confirmationDialog(
            "Delete \"\(toDelete?.name ?? "")\"?",
            isPresented: Binding(get: { toDelete != nil }, set: { if !$0 { toDelete = nil } }),
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) {
                if let toDelete { PlannerActions.deleteSide(context, toDelete) }
                toDelete = nil
            }
            Button("Cancel", role: .cancel) { toDelete = nil }
        } message: {
            Text("This removes the side dish and clears it from any scheduled days.")
        }
    }

    private func add() {
        let trimmed = newName.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        PlannerActions.addSide(context, name: trimmed)
        newName = ""
        addFocused = true   // keep focus for rapid entry, like the web Enter flow
    }

    private func commitRename(_ side: SideDish) {
        let trimmed = editName.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        side.name = trimmed
        PlannerActions.save(context)
        editingId = nil
    }
}
