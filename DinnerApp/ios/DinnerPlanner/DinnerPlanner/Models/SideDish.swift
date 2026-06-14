import Foundation
import SwiftData

/// A name-only side dish (e.g. Garlic Bread). Ported from the web `SideDish` type.
@Model
final class SideDish {
    @Attribute(.unique) var id: String
    var name: String

    init(id: String = IDGenerator.next(), name: String) {
        self.id = id
        self.name = name
    }
}
