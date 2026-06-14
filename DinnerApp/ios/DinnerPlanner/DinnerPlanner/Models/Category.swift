import Foundation

/// Ingredient categories, ported 1:1 from the web app's `CATEGORIES` (types.ts).
/// The case order is meaningful — the shopping list groups items in this order.
enum Category: String, Codable, CaseIterable, Identifiable, Hashable {
    case produce = "Produce"
    case dairy = "Dairy"
    case meatSeafood = "Meat & Seafood"
    case pantryGrains = "Pantry/Grains"
    case condimentsSpices = "Condiments & Spices"
    case frozen = "Frozen"
    case bakery = "Bakery"
    case other = "Other"

    var id: String { rawValue }

    /// Human-readable label (same as the raw value in the source).
    var label: String { rawValue }

    /// Decode tolerantly: unknown/missing category strings fall back to `.other`
    /// so importing web backups never fails on an unexpected value.
    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = Category(rawValue: raw) ?? .other
    }
}
