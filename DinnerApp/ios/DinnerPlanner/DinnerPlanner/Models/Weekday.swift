import Foundation

/// The seven planner days, ported from the web `DAY_KEYS` / `DAY_LABELS`.
/// `rawValue` is the index 0=Monday ... 6=Sunday (matches `DayPlan.dayIndex`).
enum Weekday: Int, CaseIterable, Identifiable {
    case monday = 0, tuesday, wednesday, thursday, friday, saturday, sunday

    var id: Int { rawValue }

    /// Full label, e.g. "Monday".
    var label: String {
        switch self {
        case .monday: return "Monday"
        case .tuesday: return "Tuesday"
        case .wednesday: return "Wednesday"
        case .thursday: return "Thursday"
        case .friday: return "Friday"
        case .saturday: return "Saturday"
        case .sunday: return "Sunday"
        }
    }

    /// Lowercase key used in the web backup JSON (e.g. "monday"). Kept for
    /// cross-platform backup interoperability.
    var jsonKey: String { label.lowercased() }

    static func from(jsonKey: String) -> Weekday? {
        Weekday.allCases.first { $0.jsonKey == jsonKey.lowercased() }
    }
}
