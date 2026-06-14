import SwiftUI
import SwiftData

/// Tap-to-assign sheet for a single day: set the main dinner (meal / leftover /
/// restaurant), add or remove sides (multiple allowed), write a note, or skip.
/// Together these reproduce the web planner's per-day behavior.
struct AssignSheet: View {
    let dayIndex: Int

    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    @Query private var days: [DayPlan]
    @Query(sort: \Meal.name) private var meals: [Meal]
    @Query(sort: \Restaurant.name) private var restaurants: [Restaurant]
    @Query(sort: \SideDish.name) private var sides: [SideDish]

    @State private var kindTab: AssignmentKind = .meal

    private var day: DayPlan? { days.first { $0.dayIndex == dayIndex } }

    /// Leftovers usable on this day (source meal cooked on an earlier day).
    private var validLeftovers: [LeftoverTile] {
        Leftovers.derive(days: days, meals: meals).filter { $0.earliestFromIndex <= dayIndex }
    }

    var body: some View {
        NavigationStack {
            Form {
                if let day {
                    Section {
                        Toggle("Skip this day", isOn: Binding(
                            get: { day.skipped },
                            set: { PlannerActions.setSkipped(context, dayIndex: dayIndex, skipped: $0) }
                        ))
                    }

                    if !day.skipped {
                        dinnerSection(day)
                        sidesSection(day)
                        noteSection(day)
                    }
                }
            }
            .navigationTitle(Weekday(rawValue: dayIndex)?.label ?? "Day")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } }
            }
            .onAppear {
                if let kind = day?.assignmentKind { kindTab = kind }
            }
        }
    }

    // MARK: Dinner

    @ViewBuilder
    private func dinnerSection(_ day: DayPlan) -> some View {
        Section("Dinner") {
            if day.hasAssignment {
                Button(role: .destructive) {
                    PlannerActions.clearAssignment(context, dayIndex: dayIndex)
                } label: {
                    Label("Remove dinner", systemImage: "xmark.circle")
                }
            }

            Picker("Type", selection: $kindTab) {
                Text("Meal").tag(AssignmentKind.meal)
                Text("Leftover").tag(AssignmentKind.leftover)
                Text("Restaurant").tag(AssignmentKind.restaurant)
            }
            .pickerStyle(.segmented)

            switch kindTab {
            case .meal:
                if meals.isEmpty {
                    Text("No meals yet.").foregroundStyle(.secondary)
                }
                ForEach(meals) { meal in
                    selectableRow(
                        title: meal.name,
                        selected: day.assignmentKind == .meal && day.assignmentRefId == meal.id
                    ) {
                        PlannerActions.assign(context, dayIndex: dayIndex, kind: .meal, refId: meal.id)
                    }
                }
            case .leftover:
                if validLeftovers.isEmpty {
                    Text("No leftovers available. Assign a meal to an earlier day first.")
                        .foregroundStyle(.secondary)
                }
                ForEach(validLeftovers) { tile in
                    selectableRow(
                        title: "Leftovers – \(tile.mealName)",
                        selected: day.assignmentKind == .leftover && day.assignmentRefId == tile.sourceMealId
                    ) {
                        PlannerActions.assign(context, dayIndex: dayIndex, kind: .leftover, refId: tile.sourceMealId)
                    }
                }
            case .restaurant:
                if restaurants.isEmpty {
                    Text("No restaurants yet.").foregroundStyle(.secondary)
                }
                ForEach(restaurants) { r in
                    selectableRow(
                        title: r.name,
                        selected: day.assignmentKind == .restaurant && day.assignmentRefId == r.id
                    ) {
                        PlannerActions.assign(context, dayIndex: dayIndex, kind: .restaurant, refId: r.id)
                    }
                }
            }
        }
    }

    private func selectableRow(title: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Text(title).foregroundStyle(.primary)
                Spacer()
                if selected { Image(systemName: "checkmark").foregroundStyle(Color.accentColor) }
            }
            .contentShape(Rectangle())
        }
    }

    // MARK: Sides

    @ViewBuilder
    private func sidesSection(_ day: DayPlan) -> some View {
        Section("Sides") {
            if sides.isEmpty {
                Text("No side dishes yet. Add some on the Dinners tab.")
                    .foregroundStyle(.secondary)
            }
            ForEach(sides) { side in
                let on = day.sideIds.contains(side.id)
                Button {
                    if on { PlannerActions.removeSideFromDay(context, dayIndex: dayIndex, sideId: side.id) }
                    else { PlannerActions.addSideToDay(context, dayIndex: dayIndex, sideId: side.id) }
                } label: {
                    HStack {
                        Image(systemName: on ? "checkmark.circle.fill" : "circle")
                            .foregroundStyle(on ? Color.teal : Color.secondary)
                        Text(side.name).foregroundStyle(.primary)
                    }
                    .contentShape(Rectangle())
                }
            }
        }
    }

    // MARK: Note

    @ViewBuilder
    private func noteSection(_ day: DayPlan) -> some View {
        Section("Note") {
            TextField("Optional note", text: Binding(
                get: { day.note },
                set: { PlannerActions.setNote(context, dayIndex: dayIndex, note: $0) }
            ), axis: .vertical)
            .lineLimit(1...4)
        }
    }
}
