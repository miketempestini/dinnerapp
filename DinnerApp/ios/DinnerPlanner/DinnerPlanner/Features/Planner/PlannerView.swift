import SwiftUI
import SwiftData

/// The "Planner" tab — seven day cards. Tap a day to assign a dinner, add sides,
/// write a note, or skip. Native tap-to-assign replaces the web's drag-and-drop
/// (far more comfortable on a phone); all underlying planning behavior is preserved.
struct PlannerView: View {
    @Environment(\.modelContext) private var context
    @Environment(AppRouter.self) private var router

    @Query(sort: \DayPlan.dayIndex) private var days: [DayPlan]
    @Query(sort: \Meal.name) private var meals: [Meal]
    @Query(sort: \Restaurant.name) private var restaurants: [Restaurant]
    @Query(sort: \SideDish.name) private var sides: [SideDish]

    @State private var selectedDayIndex: Int?
    @State private var confirmClear = false

    private var mealsById: [String: Meal] { Dictionary(uniqueKeysWithValues: meals.map { ($0.id, $0) }) }
    private var restById: [String: Restaurant] { Dictionary(uniqueKeysWithValues: restaurants.map { ($0.id, $0) }) }
    private var sidesById: [String: SideDish] { Dictionary(uniqueKeysWithValues: sides.map { ($0.id, $0) }) }

    private var canGenerateList: Bool { ShoppingListBuilder.hasAnyCookedAssignment(days: days) }

    var body: some View {
        NavigationStack {
            Group {
                if meals.isEmpty && restaurants.isEmpty {
                    ContentUnavailableView {
                        Label("Add some favorites first", systemImage: "calendar.badge.plus")
                    } description: {
                        Text("Add at least one meal or restaurant on the Dinners tab before planning.")
                    } actions: {
                        Button("Go to Dinners") { router.selectedTab = .dinners }
                            .buttonStyle(.borderedProminent)
                    }
                } else {
                    List {
                        ForEach(days) { day in
                            DayCardView(
                                day: day,
                                assignment: label(for: day),
                                sideNames: day.sideIds.compactMap { sidesById[$0]?.name }
                            )
                            .contentShape(Rectangle())
                            .onTapGesture { selectedDayIndex = day.dayIndex }
                        }

                        Section {
                            Button {
                                router.selectedTab = .shopping
                            } label: {
                                Label("Generate Grocery List", systemImage: "cart")
                                    .frame(maxWidth: .infinity)
                            }
                            .disabled(!canGenerateList)
                        }
                    }
                }
            }
            .navigationTitle("This Week")
            .toolbar {
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button {
                        PlannerActions.planForMe(context, meals: meals)
                    } label: {
                        Label("Plan for me", systemImage: "dice")
                    }
                    .disabled(meals.isEmpty)

                    Button(role: .destructive) {
                        confirmClear = true
                    } label: {
                        Label("Clear Week", systemImage: "trash")
                    }
                }
            }
            .sheet(item: Binding(get: { selectedDayIndex.map { DayIndexBox(value: $0) } },
                                 set: { selectedDayIndex = $0?.value })) { box in
                AssignSheet(dayIndex: box.value)
            }
            .confirmationDialog("Clear entire week?", isPresented: $confirmClear, titleVisibility: .visible) {
                Button("Clear week", role: .destructive) { PlannerActions.clearWeek(context) }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This wipes every day (assignments, sides, notes, skips) and clears custom shopping items. Your favorites are not affected.")
            }
        }
    }

    /// Resolve a day's main assignment into a displayable label, or nil if empty.
    private func label(for day: DayPlan) -> String? {
        guard let kind = day.assignmentKind, let ref = day.assignmentRefId else { return nil }
        switch kind {
        case .meal: return mealsById[ref].map { "🍽️ \($0.name)" }
        case .leftover: return mealsById[ref].map { "♻️ Leftovers – \($0.name)" }
        case .restaurant: return restById[ref].map { "🥡 \($0.name)" }
        }
    }
}

/// Identifiable wrapper so an `Int` day index can drive a `.sheet(item:)`.
private struct DayIndexBox: Identifiable {
    let value: Int
    var id: Int { value }
}
