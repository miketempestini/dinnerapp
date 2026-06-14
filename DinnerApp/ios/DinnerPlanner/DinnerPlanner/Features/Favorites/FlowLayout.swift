import SwiftUI

/// A simple wrapping layout (left-to-right, wrap to next line), used for tag and
/// side-dish chips. Avoids a third-party dependency.
struct FlowLayout: Layout {
    var spacing: CGFloat = 6

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout Void) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var rows: [[CGSize]] = [[]]
        var x: CGFloat = 0
        var rowHeights: [CGFloat] = [0]

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, x > 0 {
                rows.append([])
                rowHeights.append(0)
                x = 0
            }
            rows[rows.count - 1].append(size)
            rowHeights[rowHeights.count - 1] = max(rowHeights[rowHeights.count - 1], size.height)
            x += size.width + spacing
        }

        let totalHeight = rowHeights.reduce(0, +) + spacing * CGFloat(max(rows.count - 1, 0))
        let width = proposal.width ?? rows.map { row in row.reduce(0) { $0 + $1.width + spacing } }.max() ?? 0
        return CGSize(width: width, height: totalHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout Void) {
        let maxWidth = bounds.width
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > bounds.minX + maxWidth, x > bounds.minX {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }
            subview.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
