import Foundation

/// A leftover option derived (not persisted) from the current week.
/// Ported from the web `LeftoverTile` / `deriveLeftoverTiles` (leftovers.ts).
struct LeftoverTile: Identifiable, Hashable {
    var id: String { "leftover:\(sourceMealId)" }
    let sourceMealId: String
    let mealName: String
    /// Earliest day index (0=Mon) this leftover may be used on — strictly after
    /// the day its source meal is cooked.
    let earliestFromIndex: Int
}

enum Leftovers {
    /// For each home-cooked meal assigned to a day, expose a leftover usable on
    /// any *later* day. No cascade (leftover-of-leftover is not generated).
    static func derive(days: [DayPlan], meals: [Meal]) -> [LeftoverTile] {
        let byId = Dictionary(uniqueKeysWithValues: meals.map { ($0.id, $0) })

        // Earliest day index each meal is cooked on.
        var earliest: [String: Int] = [:]
        for day in days {
            guard day.assignmentKind == .meal, let mealId = day.assignmentRefId else { continue }
            let i = day.dayIndex
            if let prev = earliest[mealId] {
                if i < prev { earliest[mealId] = i }
            } else {
                earliest[mealId] = i
            }
        }

        var tiles: [LeftoverTile] = []
        for (mealId, dayIdx) in earliest {
            guard let meal = byId[mealId] else { continue }
            tiles.append(LeftoverTile(sourceMealId: mealId,
                                      mealName: meal.name,
                                      earliestFromIndex: dayIdx + 1)) // strictly later
        }
        return tiles.sorted { $0.mealName.localizedCaseInsensitiveCompare($1.mealName) == .orderedAscending }
    }
}
