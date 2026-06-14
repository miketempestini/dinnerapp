import Foundation
import SwiftData

/// Centralized mutations over the SwiftData store, ported from the web Zustand
/// `useStore` actions. Kept as static functions taking a `ModelContext` so views
/// stay thin (they use `@Query` for reads and call these for writes).
///
/// Referential cleanup (deleting a meal clears it from the week, deleting a side
/// removes it from each day) is done explicitly here, exactly as the web store does.
enum PlannerActions {

    // MARK: Week bootstrap

    /// Ensure the seven `DayPlan` rows exist (idempotent). Called on first launch.
    static func ensureWeek(_ context: ModelContext) {
        let existing = (try? context.fetch(FetchDescriptor<DayPlan>())) ?? []
        let present = Set(existing.map { $0.dayIndex })
        for wd in Weekday.allCases where !present.contains(wd.rawValue) {
            context.insert(DayPlan(dayIndex: wd.rawValue))
        }
        save(context)
    }

    private static func days(_ context: ModelContext) -> [DayPlan] {
        (try? context.fetch(FetchDescriptor<DayPlan>())) ?? []
    }

    static func day(_ context: ModelContext, index: Int) -> DayPlan? {
        days(context).first { $0.dayIndex == index }
    }

    // MARK: Meals

    @discardableResult
    static func addMeal(_ context: ModelContext, name: String, ingredients: [Ingredient]) -> Meal {
        let meal = Meal(name: name.trimmingCharacters(in: .whitespaces), ingredients: ingredients)
        context.insert(meal)
        save(context)
        return meal
    }

    static func deleteMeal(_ context: ModelContext, _ meal: Meal) {
        // Clear it from any day assigned this meal (as meal or leftover source).
        for d in days(context) where d.assignmentRefId == meal.id &&
            (d.assignmentKind == .meal || d.assignmentKind == .leftover) {
            d.assignmentKind = nil
            d.assignmentRefId = nil
        }
        context.delete(meal)
        save(context)
    }

    // MARK: Restaurants

    @discardableResult
    static func addRestaurant(_ context: ModelContext, name: String, tags: [String]) -> Restaurant {
        let r = Restaurant(name: name.trimmingCharacters(in: .whitespaces), tags: tags)
        context.insert(r)
        save(context)
        return r
    }

    static func deleteRestaurant(_ context: ModelContext, _ restaurant: Restaurant) {
        for d in days(context) where d.assignmentKind == .restaurant && d.assignmentRefId == restaurant.id {
            d.assignmentKind = nil
            d.assignmentRefId = nil
        }
        context.delete(restaurant)
        save(context)
    }

    // MARK: Sides

    @discardableResult
    static func addSide(_ context: ModelContext, name: String) -> SideDish {
        let s = SideDish(name: name.trimmingCharacters(in: .whitespaces))
        context.insert(s)
        save(context)
        return s
    }

    static func deleteSide(_ context: ModelContext, _ side: SideDish) {
        for d in days(context) where d.sideIds.contains(side.id) {
            d.sideIds.removeAll { $0 == side.id }
        }
        context.delete(side)
        save(context)
    }

    // MARK: Day assignment

    /// Assign a main item to a day; clears the skip flag (mirrors `assignDay`).
    static func assign(_ context: ModelContext, dayIndex: Int, kind: AssignmentKind, refId: String) {
        guard let d = day(context, index: dayIndex) else { return }
        d.assignmentKind = kind
        d.assignmentRefId = refId
        d.skipped = false
        save(context)
    }

    static func clearAssignment(_ context: ModelContext, dayIndex: Int) {
        guard let d = day(context, index: dayIndex) else { return }
        d.assignmentKind = nil
        d.assignmentRefId = nil
        save(context)
    }

    static func setNote(_ context: ModelContext, dayIndex: Int, note: String) {
        guard let d = day(context, index: dayIndex) else { return }
        d.note = note
        save(context)
    }

    /// Toggle skip. Skipping clears the assignment and sides (mirrors `setSkipped`).
    static func setSkipped(_ context: ModelContext, dayIndex: Int, skipped: Bool) {
        guard let d = day(context, index: dayIndex) else { return }
        d.skipped = skipped
        if skipped {
            d.assignmentKind = nil
            d.assignmentRefId = nil
            d.sideIds = []
        }
        save(context)
    }

    static func addSideToDay(_ context: ModelContext, dayIndex: Int, sideId: String) {
        guard let d = day(context, index: dayIndex), !d.sideIds.contains(sideId) else { return }
        d.sideIds.append(sideId)
        save(context)
    }

    static func removeSideFromDay(_ context: ModelContext, dayIndex: Int, sideId: String) {
        guard let d = day(context, index: dayIndex) else { return }
        d.sideIds.removeAll { $0 == sideId }
        save(context)
    }

    // MARK: Week-level

    /// Reset every day and clear custom items (mirrors `clearWeek`).
    static func clearWeek(_ context: ModelContext) {
        for d in days(context) {
            d.assignmentKind = nil
            d.assignmentRefId = nil
            d.sideIds = []
            d.note = ""
            d.skipped = false
        }
        for item in (try? context.fetch(FetchDescriptor<CustomItem>())) ?? [] {
            context.delete(item)
        }
        save(context)
    }

    /// Randomly fill empty, non-skipped days with saved meals (mirrors `handlePlanForMe`).
    static func planForMe(_ context: ModelContext, meals: [Meal]) {
        guard !meals.isEmpty else { return }
        let empties = days(context)
            .filter { !$0.skipped && !$0.hasAssignment }
            .sorted { $0.dayIndex < $1.dayIndex }
        guard !empties.isEmpty else { return }

        let shuffled = meals.shuffled()
        for (i, d) in empties.enumerated() {
            let meal = shuffled[i % shuffled.count]
            d.assignmentKind = .meal
            d.assignmentRefId = meal.id
            d.skipped = false
        }
        save(context)
    }

    // MARK: Custom shopping items

    static func addCustomItem(_ context: ModelContext, text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        let count = (try? context.fetchCount(FetchDescriptor<CustomItem>())) ?? 0
        context.insert(CustomItem(text: trimmed, order: count))
        save(context)
    }

    static func removeCustomItem(_ context: ModelContext, _ item: CustomItem) {
        context.delete(item)
        save(context)
    }

    // MARK: Persistence

    static func save(_ context: ModelContext) {
        do { try context.save() } catch { print("SwiftData save failed: \(error)") }
    }
}
