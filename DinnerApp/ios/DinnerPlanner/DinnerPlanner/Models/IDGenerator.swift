import Foundation

/// Generates short, collision-resistant string ids, mirroring the web store's
/// `uid()` (random base-36 + timestamp base-36). String ids keep the data model
/// and backup JSON identical to the web app.
enum IDGenerator {
    static func next() -> String {
        let random = String(Int.random(in: 0..<Int(1e12), using: &SystemRandomNumberGenerator.shared), radix: 36)
        let time = String(Int(Date().timeIntervalSince1970 * 1000), radix: 36)
        return random + time
    }
}

private extension SystemRandomNumberGenerator {
    static var shared = SystemRandomNumberGenerator()
}
