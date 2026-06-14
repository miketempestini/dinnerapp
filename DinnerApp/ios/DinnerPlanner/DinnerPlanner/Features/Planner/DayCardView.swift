import SwiftUI

/// One day row in the planner. Presentational only — the parent resolves labels
/// and handles taps. Shows the assignment, side chips, note preview, and skip state.
struct DayCardView: View {
    let day: DayPlan
    let assignment: String?
    let sideNames: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(day.weekday.label).font(.headline)
                Spacer()
                if day.skipped {
                    Text("Skipped")
                        .font(.caption2.weight(.semibold))
                        .padding(.horizontal, 8).padding(.vertical, 3)
                        .background(.gray.opacity(0.2), in: Capsule())
                        .foregroundStyle(.secondary)
                }
                Image(systemName: "chevron.right").font(.caption).foregroundStyle(.tertiary)
            }

            if day.skipped {
                Text("No dinner planned").font(.subheadline).foregroundStyle(.secondary).italic()
            } else if let assignment {
                Text(assignment).font(.subheadline.weight(.medium))
            } else {
                Text("Tap to plan a dinner").font(.subheadline).foregroundStyle(.secondary).italic()
            }

            if !sideNames.isEmpty {
                FlowLayout(spacing: 6) {
                    ForEach(sideNames, id: \.self) { name in
                        Text(name)
                            .font(.caption2)
                            .padding(.horizontal, 8).padding(.vertical, 3)
                            .background(Color.teal.opacity(0.18), in: Capsule())
                            .foregroundStyle(.teal)
                    }
                }
            }

            if !day.note.isEmpty {
                Label(day.note, systemImage: "note.text")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
        }
        .padding(.vertical, 4)
    }
}
