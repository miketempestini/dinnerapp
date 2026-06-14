import SwiftUI
import UIKit

/// Minimal wrapper around `UIActivityViewController` for sharing the backup file
/// (and for the shopping-list share). SwiftUI's `ShareLink` needs its item up
/// front; this lets us generate the file on demand, then present.
struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ controller: UIActivityViewController, context: Context) {}
}
