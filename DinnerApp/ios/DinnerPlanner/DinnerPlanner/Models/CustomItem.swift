import Foundation
import SwiftData

/// A free-form "Other" item on the shopping list (e.g. paper towels).
/// Ported from the web store's `customItems: string[]`. Cleared on Clear Week.
@Model
final class CustomItem {
    @Attribute(.unique) var id: String
    var text: String
    /// Preserves insertion order in the list.
    var order: Int

    init(id: String = IDGenerator.next(), text: String, order: Int) {
        self.id = id
        self.text = text
        self.order = order
    }
}
