import SwiftUI
import SwiftData

/// Searchable list of saved dinners (meals). Add/edit via sheet, delete with confirm.
struct MealsListView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \Meal.name) private var meals: [Meal]
    @State private var search = ""
    @State private var editing: Meal?
    @State private var creating = false
    @State private var toDelete: Meal?

    private var filtered: [Meal] {
        let q = search.trimmingCharacters(in: .whitespaces).lowercased()
        guard !q.isEmpty else { return meals }
        return meals.filter { $0.name.lowercased().contains(q) }
    }

    var body: some View {
        List {
            if filtered.isEmpty {
                ContentUnavailableView(
                    meals.isEmpty ? "No meals yet" : "No matches",
                    systemImage: "fork.knife",
                    description: Text(meals.isEmpty ? "Tap + to add your first dinner." : "Try a different search.")
                )
            } else {
                ForEach(filtered) { meal in
                    Button { editing = meal } label: { MealRow(meal: meal) }
                        .buttonStyle(.plain)
                        .swipeActions {
                            Button(role: .destructive) { toDelete = meal } label: { Label("Delete", systemImage: "trash") }
                        }
                }
            }
        }
        .searchable(text: $search, prompt: "Search meals")
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
            .accessibilityLabel("New meal")
        }
        .sheet(isPresented: $creating) {
            MealEditorView(meal: nil) { name, ingredients in
                PlannerActions.addMeal(context, name: name, ingredients: ingredients)
            }
        }
        .sheet(item: $editing) { meal in
            MealEditorView(meal: meal) { name, ingredients in
                meal.name = name
                meal.ingredients = ingredients
                PlannerActions.save(context)
            }
        }
        .confirmationDialog(
            "Delete \"\(toDelete?.name ?? "")\"?",
            isPresented: Binding(get: { toDelete != nil }, set: { if !$0 { toDelete = nil } }),
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) {
                if let toDelete { PlannerActions.deleteMeal(context, toDelete) }
                toDelete = nil
            }
            Button("Cancel", role: .cancel) { toDelete = nil }
        } message: {
            Text("This removes the meal and clears it from any scheduled days.")
        }
    }
}

private struct MealRow: View {
    let meal: Meal
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(meal.name).font(.headline)
            if meal.ingredients.isEmpty {
                Text("No ingredients listed").font(.caption).foregroundStyle(.secondary).italic()
            } else {
                Text("^[\(meal.ingredients.count) ingredient](inflect: true)")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .contentShape(Rectangle())
    }
}
