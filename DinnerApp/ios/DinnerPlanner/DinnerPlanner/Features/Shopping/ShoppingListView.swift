import SwiftUI
import SwiftData
import UIKit

/// The "Shopping" tab. Aggregates ingredients from the week's cooked meals
/// (deduped + summed, grouped by category), lists assigned sides, and supports
/// free-form "Other" items. Copy/Share produce the same text as the web app.
struct ShoppingListView: View {
    @Environment(\.modelContext) private var context
    @Environment(AppRouter.self) private var router

    @Query(sort: \DayPlan.dayIndex) private var days: [DayPlan]
    @Query(sort: \Meal.name) private var meals: [Meal]
    @Query(sort: \Restaurant.name) private var restaurants: [Restaurant]
    @Query(sort: \SideDish.name) private var sides: [SideDish]
    @Query(sort: \CustomItem.order) private var customItems: [CustomItem]

    @State private var newItem = ""
    @State private var shareText: String?
    @State private var showShare = false
    @State private var copied = false
    @FocusState private var addFocused: Bool

    private var grouped: [Category: [LineItem]] { ShoppingListBuilder.build(days: days, meals: meals) }
    private var sideNames: [String] { ShoppingListBuilder.gatherSides(days: days, sides: sides) }
    private var totalItems: Int { ShoppingListBuilder.totalItems(grouped) }
    private var hasCooked: Bool { ShoppingListBuilder.hasAnyCookedAssignment(days: days) }

    var body: some View {
        NavigationStack {
            Group {
                if !hasCooked {
                    ContentUnavailableView {
                        Label("Nothing to shop for yet", systemImage: "cart")
                    } description: {
                        Text("Assign at least one home-cooked meal to a day, then come back.")
                    } actions: {
                        Button("Go to Planner") { router.selectedTab = .planner }
                            .buttonStyle(.borderedProminent)
                    }
                } else {
                    listContent
                }
            }
            .navigationTitle("Shopping List")
            .toolbar {
                if hasCooked {
                    ToolbarItemGroup(placement: .topBarTrailing) {
                        Button { copy() } label: {
                            Label(copied ? "Copied" : "Copy", systemImage: copied ? "checkmark" : "doc.on.doc")
                        }
                        Button { share() } label: { Label("Share", systemImage: "square.and.arrow.up") }
                    }
                }
            }
            .sheet(isPresented: $showShare) {
                if let shareText { ShareSheet(items: [shareText]) }
            }
        }
    }

    private var listContent: some View {
        List {
            if totalItems == 0 {
                Section {
                    Text("Your scheduled meals don't have ingredients yet. Add them on the Dinners tab to build a grocery list.")
                        .foregroundStyle(.secondary)
                }
            }

            ForEach(Category.allCases) { cat in
                let items = grouped[cat] ?? []
                if !items.isEmpty {
                    Section(cat.label) {
                        ForEach(items) { item in
                            HStack {
                                Text(item.name)
                                if !item.qtyDisplay.isEmpty {
                                    Text("— \(item.qtyDisplay)").foregroundStyle(.secondary)
                                }
                            }
                        }
                    }
                }
            }

            if !sideNames.isEmpty {
                Section("Sides") {
                    ForEach(sideNames, id: \.self) { Text($0) }
                }
            }

            Section("Other") {
                ForEach(customItems) { item in
                    Text(item.text)
                        .swipeActions {
                            Button(role: .destructive) {
                                PlannerActions.removeCustomItem(context, item)
                            } label: { Label("Delete", systemImage: "trash") }
                        }
                }
                HStack {
                    TextField("Add an item…", text: $newItem)
                        .focused($addFocused)
                        .onSubmit(addItem)
                    Button("Add", action: addItem)
                        .disabled(newItem.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }

    private func addItem() {
        let trimmed = newItem.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        PlannerActions.addCustomItem(context, text: trimmed)
        newItem = ""
        addFocused = true   // keep focus for rapid entry, like the web
    }

    private func fullText() -> String {
        ShoppingListBuilder.fullText(
            days: days, meals: meals, restaurants: restaurants, sides: sides,
            customItems: customItems.map(\.text)
        )
    }

    private func copy() {
        UIPasteboard.general.string = fullText()
        withAnimation { copied = true }
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 1_500_000_000)
            withAnimation { copied = false }
        }
    }

    private func share() {
        shareText = fullText()
        showShare = true
    }
}
