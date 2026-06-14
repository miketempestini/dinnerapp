import UIKit

/// Tiny haptics helper for the random reveal. Light ticks while cycling, a
/// success thunk on landing — gives the native "feel" that replaces the web wheel.
enum Haptics {
    private static let impact = UIImpactFeedbackGenerator(style: .light)
    private static let notify = UINotificationFeedbackGenerator()

    static func tick() {
        impact.prepare()
        impact.impactOccurred(intensity: 0.5)
    }

    static func success() {
        notify.notificationOccurred(.success)
    }
}
