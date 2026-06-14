import Foundation
import SwiftData

/// A saved home-cooked dinner. Ported from the web `Meal` type (name + ingredients).
/// There are no `instructions` or `images` in the source app, so none are added here.
@Model
final class Meal {
    /// String id mirrors the web model so backups stay interoperable across platforms.
    @Attribute(.unique) var id: String
    var name: String
    /// Embedded value-type array (see `Ingredient`). Persisted as a Codable blob.
    var ingredients: [Ingredient]

    init(id: String = IDGenerator.next(), name: String, ingredients: [Ingredient] = []) {
        self.id = id
        self.name = name
        self.ingredients = ingredients
    }
}
