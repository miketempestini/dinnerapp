import Foundation

/// A single ingredient on a meal. Ported from the web `Ingredient` type.
///
/// This is a value type embedded inside `Meal.ingredients`. SwiftData persists
/// the array as a Codable blob, which mirrors the web model where ingredients
/// live inline on the meal (rather than as independent records).
struct Ingredient: Codable, Hashable, Identifiable {
    var id = UUID()
    var name: String
    var qty: String?
    var unit: String?
    var category: Category

    init(id: UUID = UUID(), name: String, qty: String? = nil, unit: String? = nil, category: Category = .other) {
        self.id = id
        self.name = name
        self.qty = qty
        self.unit = unit
        self.category = category
    }

    // `id` is local-only (not part of the web shape); decode tolerates its absence.
    enum CodingKeys: String, CodingKey { case name, qty, unit, category }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = UUID()
        self.name = try c.decode(String.self, forKey: .name)
        self.qty = try c.decodeIfPresent(String.self, forKey: .qty)
        self.unit = try c.decodeIfPresent(String.self, forKey: .unit)
        self.category = try c.decodeIfPresent(Category.self, forKey: .category) ?? .other
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(name, forKey: .name)
        try c.encodeIfPresent(qty, forKey: .qty)
        try c.encodeIfPresent(unit, forKey: .unit)
        try c.encode(category, forKey: .category)
    }
}
