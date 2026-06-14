import Foundation
import SwiftData

/// The kind of main assignment on a day, ported from the web `Assignment` union.
enum AssignmentKind: String, Codable {
    case meal
    case leftover
    case restaurant
}

/// One day of the week's plan. Exactly seven rows exist (one per `Weekday`),
/// created on first launch. Ported from the web `DayPlan` type.
///
/// The main assignment is stored as an id reference (`assignmentKind` +
/// `assignmentRefId`) rather than a SwiftData relationship. This mirrors the web
/// store 1:1, keeps backup JSON interoperable, and sidesteps the inverse-
/// relationship ambiguity of having both a meal and a leftover-source point at
/// `Meal`. Referential cleanup on delete is handled explicitly in `PlannerActions`,
/// exactly as the web `deleteMeal`/`deleteSide` actions do.
@Model
final class DayPlan {
    @Attribute(.unique) var dayIndex: Int          // 0=Mon ... 6=Sun
    var note: String
    var skipped: Bool
    var assignmentKindRaw: String?                  // "meal" | "leftover" | "restaurant" | nil
    var assignmentRefId: String?                    // mealId / sourceMealId / restaurantId
    var sideIds: [String]                           // SideDish ids assigned to this day

    init(dayIndex: Int,
         note: String = "",
         skipped: Bool = false,
         assignmentKindRaw: String? = nil,
         assignmentRefId: String? = nil,
         sideIds: [String] = []) {
        self.dayIndex = dayIndex
        self.note = note
        self.skipped = skipped
        self.assignmentKindRaw = assignmentKindRaw
        self.assignmentRefId = assignmentRefId
        self.sideIds = sideIds
    }

    var weekday: Weekday { Weekday(rawValue: dayIndex) ?? .monday }

    var assignmentKind: AssignmentKind? {
        get { assignmentKindRaw.flatMap(AssignmentKind.init(rawValue:)) }
        set { assignmentKindRaw = newValue?.rawValue }
    }

    var hasAssignment: Bool { assignmentKind != nil && assignmentRefId != nil }

    /// True when this day contributes a cooked meal to the shopping list.
    var isCooked: Bool {
        guard let kind = assignmentKind else { return false }
        return kind == .meal || kind == .leftover
    }
}
