import Foundation
import SwiftData

/// A takeout/restaurant favorite. Ported from the web `Restaurant` type.
@Model
final class Restaurant {
    @Attribute(.unique) var id: String
    var name: String
    var tags: [String]

    init(id: String = IDGenerator.next(), name: String, tags: [String] = []) {
        self.id = id
        self.name = name
        self.tags = tags
    }
}
