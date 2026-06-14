import SwiftUI
import SwiftData

/// The "Random" tab. Replaces the web's spinning SVG wheel with a native reveal
/// animation (rapidly cycling labels + haptics, easing to a stop). The selection
/// logic is identical: a uniform random pick, plus a "3 Randoms" mode that picks
/// three unique options and lets you choose your favorite. Sides are excluded,
/// matching the web.
struct RandomPickerView: View {
    enum Mode: String, CaseIterable, Identifiable {
        case meals = "Home Meals", restaurants = "Takeout", both = "Both"
        var id: String { rawValue }
    }

    struct Option: Identifiable, Equatable {
        let label: String
        let kind: AssignmentKind
        let refId: String
        var id: String { "\(kind.rawValue):\(refId)" }
    }

    @Environment(\.modelContext) private var context
    @Query(sort: \Meal.name) private var meals: [Meal]
    @Query(sort: \Restaurant.name) private var restaurants: [Restaurant]
    @Query private var days: [DayPlan]

    @State private var mode: Mode = .both
    @State private var isRevealing = false
    @State private var displayLabel = ""
    @State private var winner: Option?
    @State private var tripleResults: [Option] = []
    @State private var showingTriple = false
    @State private var pendingDay: Int?
    @State private var toast: String?

    private var options: [Option] {
        var list: [Option] = []
        if mode != .restaurants {
            list += meals.map { Option(label: $0.name, kind: .meal, refId: $0.id) }
        }
        if mode != .meals {
            list += restaurants.map { Option(label: $0.name, kind: .restaurant, refId: $0.id) }
        }
        return list
    }

    var body: some View {
        NavigationStack {
            Group {
                if meals.isEmpty && restaurants.isEmpty {
                    ContentUnavailableView {
                        Label("Nothing to pick from", systemImage: "dice")
                    } description: {
                        Text("Add a few meals or restaurants on the Dinners tab to get started.")
                    }
                } else {
                    content
                }
            }
            .navigationTitle("What's for dinner?")
            .overlay(alignment: .bottom) {
                if let toast {
                    Text(toast)
                        .font(.subheadline.weight(.semibold))
                        .padding(.horizontal, 16).padding(.vertical, 10)
                        .background(.thinMaterial, in: Capsule())
                        .padding(.bottom, 12)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .confirmationDialog(
                "Replace \(confirmedOverwriteLabel)'s dinner?",
                isPresented: overwriteBinding,
                titleVisibility: .visible
            ) {
                Button("Replace", role: .destructive) { confirmOverwrite() }
                Button("Cancel", role: .cancel) { pendingDay = nil }
            } message: {
                Text("That day already has a dinner assigned.")
            }
        }
    }

    private func confirmOverwrite() {
        guard let dayIndex = pendingDay, let winner else { pendingDay = nil; return }
        PlannerActions.assign(context, dayIndex: dayIndex, kind: winner.kind, refId: winner.refId)
        showToast("Added to \(Weekday(rawValue: dayIndex)?.label ?? "day")")
        self.winner = nil
        pendingDay = nil
    }

    private var content: some View {
        VStack(spacing: 24) {
            Picker("Mode", selection: $mode) {
                ForEach(Mode.allCases) { Text($0.rawValue).tag($0) }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)
            .onChange(of: mode) { _, _ in resetResults() }

            Spacer()

            revealArea
                .frame(maxWidth: .infinity)
                .padding(.horizontal)

            Spacer()

            if !showingTriple {
                HStack(spacing: 12) {
                    Button(action: pick) {
                        Label("Pick", systemImage: "dice.fill")
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 6)
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(options.isEmpty || isRevealing)

                    Button(action: threeRandoms) {
                        Label("3 Randoms", systemImage: "die.face.5")
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 6)
                    }
                    .buttonStyle(.bordered)
                    .disabled(options.count < 3 || isRevealing)
                }
                .padding(.horizontal)
                .padding(.bottom)
            }
        }
    }

    // MARK: Reveal area (changes by state)

    @ViewBuilder
    private var revealArea: some View {
        if isRevealing {
            revealCard(text: displayLabel.isEmpty ? "…" : displayLabel, subtitle: "Picking…")
                .scaleEffect(1.04)
                .animation(.easeInOut(duration: 0.1), value: displayLabel)
        } else if showingTriple {
            VStack(spacing: 12) {
                Text("Pick your favorite!")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.secondary)
                    .textCase(.uppercase)
                ForEach(Array(tripleResults.enumerated()), id: \.element.id) { idx, opt in
                    Button {
                        choose(opt)
                    } label: {
                        HStack {
                            Text("\(idx + 1).").foregroundStyle(.secondary)
                            Text(opt.label).fontWeight(.semibold)
                            Spacer()
                        }
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 14))
                    }
                    .buttonStyle(.plain)
                }
                Button("Start Over") { resetResults() }
                    .padding(.top, 4)
            }
        } else if let winner {
            VStack(spacing: 16) {
                revealCard(text: winner.label, subtitle: "Winner!")
                HStack(spacing: 12) {
                    Button { pick() } label: { Label("Pick again", systemImage: "arrow.clockwise") }
                        .buttonStyle(.bordered)
                    addToDayMenu
                }
            }
        } else {
            revealCard(text: "Tap Pick to choose", subtitle: nil)
                .opacity(0.5)
        }
    }

    private func revealCard(text: String, subtitle: String?) -> some View {
        VStack(spacing: 8) {
            if let subtitle {
                Text(subtitle)
                    .font(.caption.weight(.bold))
                    .foregroundStyle(Color.accentColor)
                    .textCase(.uppercase)
            }
            Text(text)
                .font(.title.weight(.bold))
                .multilineTextAlignment(.center)
                .minimumScaleFactor(0.6)
                .lineLimit(2)
        }
        .padding(.vertical, 36).padding(.horizontal, 24)
        .frame(maxWidth: .infinity)
        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 20))
    }

    private var addToDayMenu: some View {
        Menu {
            ForEach(Weekday.allCases) { wd in
                Button(wd.label) { addToDay(wd.rawValue) }
            }
        } label: {
            Label("Add to day", systemImage: "calendar.badge.plus")
        }
        .buttonStyle(.borderedProminent)
    }

    // MARK: Actions

    private func pick() {
        guard let chosen = options.randomElement() else { return }
        resetResults()
        isRevealing = true
        Task { await reveal(finalLabel: chosen.label); finish { winner = chosen } }
    }

    private func threeRandoms() {
        guard options.count >= 3 else { return }
        resetResults()
        let chosen = Array(options.shuffled().prefix(3))   // unique: drawn without replacement
        isRevealing = true
        Task {
            await reveal(finalLabel: chosen[0].label)
            finish { tripleResults = chosen; showingTriple = true }
        }
    }

    private func choose(_ opt: Option) {
        withAnimation {
            winner = opt
            showingTriple = false
            tripleResults = []
        }
    }

    private func addToDay(_ dayIndex: Int) {
        guard let winner else { return }
        if let day = days.first(where: { $0.dayIndex == dayIndex }), day.hasAssignment {
            pendingDay = dayIndex   // confirm overwrite
        } else {
            PlannerActions.assign(context, dayIndex: dayIndex, kind: winner.kind, refId: winner.refId)
            showToast("Added to \(Weekday(rawValue: dayIndex)?.label ?? "day")")
            self.winner = nil
        }
    }

    /// Cycle labels with an ease-out (increasing delay), then settle on the result.
    private func reveal(finalLabel: String) async {
        let labels = options.map(\.label)
        var delay: Double = 0.04
        let start = Date()
        while Date().timeIntervalSince(start) < 1.4 {
            await MainActor.run {
                displayLabel = labels.randomElement() ?? finalLabel
                Haptics.tick()
            }
            try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            delay *= 1.18
        }
        await MainActor.run { displayLabel = finalLabel }
    }

    private func finish(_ apply: @escaping () -> Void) {
        Task { @MainActor in
            withAnimation { apply() }
            isRevealing = false
            Haptics.success()
        }
    }

    private func resetResults() {
        winner = nil
        tripleResults = []
        showingTriple = false
        displayLabel = ""
    }

    private func showToast(_ message: String) {
        withAnimation { toast = message }
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 1_600_000_000)
            withAnimation { toast = nil }
        }
    }

    // Overwrite confirmation, attached at view scope.
    private var overwriteBinding: Binding<Bool> {
        Binding(get: { pendingDay != nil }, set: { if !$0 { pendingDay = nil } })
    }
}

// Attach the overwrite confirmation via an extension to keep `body` readable.
extension RandomPickerView {
    var confirmedOverwriteLabel: String {
        Weekday(rawValue: pendingDay ?? 0)?.label ?? ""
    }
}
