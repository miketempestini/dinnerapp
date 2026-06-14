import SwiftUI

/// Identifies the four root tabs and lets one tab jump to another
/// (e.g. Planner's "Generate Grocery List" → Shopping).
enum AppTab: Hashable {
    case dinners, planner, random, shopping
}

@Observable
final class AppRouter {
    var selectedTab: AppTab = .dinners
}
