import SwiftUI
import SwiftData

/// Searchable list of restaurants. Add/edit via sheet, delete with confirm.
struct RestaurantsListView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \Restaurant.name) private var restaurants: [Restaurant]
    @State private var search = ""
    @State private var editing: Restaurant?
    @State private var creating = false
    @State private var toDelete: Restaurant?

    private var filtered: [Restaurant] {
        let q = search.trimmingCharacters(in: .whitespaces).lowercased()
        guard !q.isEmpty else { return restaurants }
        return restaurants.filter {
            $0.name.lowercased().contains(q) || $0.tags.contains { $0.lowercased().contains(q) }
        }
    }

    var body: some View {
        List {
            if filtered.isEmpty {
                ContentUnavailableView(
                    restaurants.isEmpty ? "No restaurants yet" : "No matches",
                    systemImage: "takeoutbag.and.cup.and.straw",
                    description: Text(restaurants.isEmpty ? "Tap + to add a takeout spot." : "Try a different search.")
                )
            } else {
                ForEach(filtered) { r in
                    Button { editing = r } label: { RestaurantRow(restaurant: r) }
                        .buttonStyle(.plain)
                        .swipeActions {
                            Button(role: .destructive) { toDelete = r } label: { Label("Delete", systemImage: "trash") }
                        }
                }
            }
        }
        .searchable(text: $search, prompt: "Search restaurants or tags")
        .overlay(alignment: .bottomTrailing) {
            Button { creating = true } label: {
                Image(systemName: "plus")
                    .font(.title2.weight(.semibold))
                    .frame(width: 56, height: 56)
                    .background(Color.accentColor, in: Circle())
                    .foregroundStyle(.white)
                    .shadow(radius: 4, y: 2)
            }
            .padding()
            .accessibilityLabel("New restaurant")
        }
        .sheet(isPresented: $creating) {
            RestaurantEditorView(restaurant: nil) { name, tags in
                PlannerActions.addRestaurant(context, name: name, tags: tags)
            }
        }
        .sheet(item: $editing) { r in
            RestaurantEditorView(restaurant: r) { name, tags in
                r.name = name
                r.tags = tags
                PlannerActions.save(context)
            }
        }
        .confirmationDialog(
            "Delete \"\(toDelete?.name ?? "")\"?",
            isPresented: Binding(get: { toDelete != nil }, set: { if !$0 { toDelete = nil } }),
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) {
                if let toDelete { PlannerActions.deleteRestaurant(context, toDelete) }
                toDelete = nil
            }
            Button("Cancel", role: .cancel) { toDelete = nil }
        } message: {
            Text("This removes the restaurant and clears it from any scheduled days.")
        }
    }
}

private struct RestaurantRow: View {
    let restaurant: Restaurant
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(restaurant.name).font(.headline)
            if restaurant.tags.isEmpty {
                Text("No tags").font(.caption).foregroundStyle(.secondary).italic()
            } else {
                ChipsView(items: restaurant.tags)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .contentShape(Rectangle())
    }
}

/// Simple wrapping chips row for tags.
struct ChipsView: View {
    let items: [String]
    var body: some View {
        FlowLayout(spacing: 6) {
            ForEach(items, id: \.self) { tag in
                Text(tag)
                    .font(.caption2)
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(Color.accentColor.opacity(0.15), in: Capsule())
                    .foregroundStyle(Color.accentColor)
            }
        }
    }
}
