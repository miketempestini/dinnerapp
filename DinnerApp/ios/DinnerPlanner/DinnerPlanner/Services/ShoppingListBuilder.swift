import Foundation

/// A single aggregated grocery line. Ported from the web `LineItem`.
struct LineItem: Identifiable, Hashable {
    var id: String { "\(name)|\(unit ?? "")|\(category.rawValue)" }
    let name: String
    let unit: String?
    let qtyDisplay: String   // "" or "2" or "2 cups + 1 pack"
    let category: Category
}

/// One row of the week-plan summary. Ported from the web `WeekPlanLine`.
struct WeekPlanLine: Identifiable {
    var id: Int { dayIndex }
    let dayIndex: Int
    let day: String
    let label: String
    let isSkipped: Bool
    let isEmpty: Bool
}

/// Aggregates the shopping list and builds text exports. Direct port of
/// `shoppingList.ts` (`buildShoppingList`, `parseNumeric`, `gatherSides`,
/// `buildWeekPlan`, and the `*toText` helpers).
enum ShoppingListBuilder {

    // MARK: Grocery aggregation

    private struct Bucket {
        var name: String
        var unit: String?
        var category: Category
        var numericQty: Double = 0
        var extras: [String] = []
        var hadAnyQty = false
    }

    private static func key(name: String, unit: String?) -> String {
        "\(name.trimmingCharacters(in: .whitespaces).lowercased())|\((unit ?? "").trimmingCharacters(in: .whitespaces).lowercased())"
    }

    /// Parse a quantity string into a number, supporting plain numbers and simple
    /// fractions ("2", "1.5", "1/2"). Returns nil for anything else.
    static func parseNumeric(_ qty: String?) -> Double? {
        guard let qty = qty?.trimmingCharacters(in: .whitespaces), !qty.isEmpty else { return nil }
        let pattern = #"^(\d+(?:\.\d+)?)(?:\s*/\s*(\d+(?:\.\d+)?))?$"#
        guard let re = try? NSRegularExpression(pattern: pattern),
              let m = re.firstMatch(in: qty, range: NSRange(qty.startIndex..., in: qty)) else { return nil }
        func group(_ i: Int) -> Double? {
            guard m.range(at: i).location != NSNotFound,
                  let r = Range(m.range(at: i), in: qty) else { return nil }
            return Double(qty[r])
        }
        guard let n = group(1) else { return nil }
        let d = group(2) ?? 1
        return d != 0 ? n / d : nil
    }

    /// Collect ingredients from days assigned a meal or leftover (leftovers pull
    /// from their source meal), then dedupe + sum, grouped by category.
    static func build(days: [DayPlan], meals: [Meal]) -> [Category: [LineItem]] {
        let byId = Dictionary(uniqueKeysWithValues: meals.map { ($0.id, $0) })

        var ingredients: [Ingredient] = []
        for day in days where day.isCooked {
            guard let refId = day.assignmentRefId, let meal = byId[refId] else { continue }
            ingredients.append(contentsOf: meal.ingredients)
        }

        var buckets: [String: Bucket] = [:]
        var order: [String] = []
        for ing in ingredients {
            let k = key(name: ing.name, unit: ing.unit)
            if buckets[k] == nil {
                let trimmedUnit = ing.unit?.trimmingCharacters(in: .whitespaces)
                buckets[k] = Bucket(name: ing.name.trimmingCharacters(in: .whitespaces),
                                    unit: (trimmedUnit?.isEmpty == false) ? trimmedUnit : nil,
                                    category: ing.category)
                order.append(k)
            }
            if let qty = ing.qty?.trimmingCharacters(in: .whitespaces), !qty.isEmpty {
                buckets[k]?.hadAnyQty = true
                if let n = parseNumeric(qty) {
                    buckets[k]?.numericQty += n
                } else {
                    buckets[k]?.extras.append(qty)
                }
            }
        }

        var grouped: [Category: [LineItem]] = [:]
        for c in Category.allCases { grouped[c] = [] }

        let sorted = order.compactMap { buckets[$0] }
            .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }

        for b in sorted {
            var qtyDisplay = ""
            if b.hadAnyQty {
                var parts: [String] = []
                if b.numericQty > 0 {
                    let num = formatNumber(b.numericQty)
                    if let unit = b.unit {
                        let plural = (b.numericQty > 1 && !unit.hasSuffix("s")) ? "s" : ""
                        parts.append("\(num) \(unit)\(plural)")
                    } else {
                        parts.append(num)
                    }
                }
                parts.append(contentsOf: b.extras)
                qtyDisplay = parts.joined(separator: " + ")
            }
            grouped[b.category]?.append(LineItem(name: b.name, unit: b.unit, qtyDisplay: qtyDisplay, category: b.category))
        }
        return grouped
    }

    private static func formatNumber(_ value: Double) -> String {
        if value == value.rounded() { return String(Int(value)) }
        // Trim trailing zeros, mirroring the web's toFixed(2).replace(/\.?0+$/, '').
        return String(format: "%.2f", value)
            .replacingOccurrences(of: #"\.?0+$"#, with: "", options: .regularExpression)
    }

    /// Total grocery line count (used to decide empty states).
    static func totalItems(_ grouped: [Category: [LineItem]]) -> Int {
        Category.allCases.reduce(0) { $0 + (grouped[$1]?.count ?? 0) }
    }

    /// True if any day has a cooked (meal/leftover) assignment.
    static func hasAnyCookedAssignment(days: [DayPlan]) -> Bool {
        days.contains { $0.isCooked }
    }

    // MARK: Sides

    /// Unique side-dish names from non-skipped days, sorted. Port of `gatherSides`.
    static func gatherSides(days: [DayPlan], sides: [SideDish]) -> [String] {
        let byId = Dictionary(uniqueKeysWithValues: sides.map { ($0.id, $0.name) })
        var names = Set<String>()
        for day in days where !day.skipped {
            for id in day.sideIds { if let n = byId[id] { names.insert(n) } }
        }
        return names.sorted { $0.localizedCaseInsensitiveCompare($1) == .orderedAscending }
    }

    // MARK: Week plan summary

    static func buildWeekPlan(days: [DayPlan], meals: [Meal], restaurants: [Restaurant]) -> [WeekPlanLine] {
        let mealName = Dictionary(uniqueKeysWithValues: meals.map { ($0.id, $0.name) })
        let restName = Dictionary(uniqueKeysWithValues: restaurants.map { ($0.id, $0.name) })
        let byIndex = Dictionary(uniqueKeysWithValues: days.map { ($0.dayIndex, $0) })

        return Weekday.allCases.map { wd in
            let day = byIndex[wd.rawValue]
            if day?.skipped == true {
                return WeekPlanLine(dayIndex: wd.rawValue, day: wd.label, label: "Skipped", isSkipped: true, isEmpty: false)
            }
            guard let day, let kind = day.assignmentKind, let ref = day.assignmentRefId else {
                return WeekPlanLine(dayIndex: wd.rawValue, day: wd.label, label: "—", isSkipped: false, isEmpty: true)
            }
            let label: String
            switch kind {
            case .meal: label = mealName[ref] ?? "Unknown"
            case .restaurant: label = "\(restName[ref] ?? "Unknown") (Takeout)"
            case .leftover: label = "Leftovers – \(mealName[ref] ?? "Unknown")"
            }
            return WeekPlanLine(dayIndex: wd.rawValue, day: wd.label, label: label, isSkipped: false, isEmpty: false)
        }
    }

    // MARK: Text exports (ported from *toText helpers)

    static func weekPlanToText(_ plan: [WeekPlanLine]) -> String {
        var lines = ["🍽️  This Week's Dinner Plan", String(repeating: "─", count: 30)]
        for p in plan { lines.append("\(p.day): \(p.label)") }
        return lines.joined(separator: "\n")
    }

    static func shoppingListToText(_ grouped: [Category: [LineItem]]) -> String {
        var lines: [String] = []
        for cat in Category.allCases {
            let items = grouped[cat] ?? []
            if items.isEmpty { continue }
            lines.append(cat.rawValue)
            for i in items {
                lines.append("  - \(i.name)\(i.qtyDisplay.isEmpty ? "" : " (\(i.qtyDisplay))")")
            }
            lines.append("")
        }
        return lines.joined(separator: "\n").trimmingCharacters(in: .whitespacesAndNewlines)
    }

    static func sidesToText(_ sideNames: [String]) -> String {
        guard !sideNames.isEmpty else { return "" }
        return "\nSides\n" + sideNames.map { "  - \($0)" }.joined(separator: "\n")
    }

    static func customItemsToText(_ items: [String]) -> String {
        guard !items.isEmpty else { return "" }
        return "\nOther\n" + items.map { "  - \($0)" }.joined(separator: "\n")
    }

    /// Full clipboard/share payload, matching the web Copy button output.
    static func fullText(days: [DayPlan], meals: [Meal], restaurants: [Restaurant], sides: [SideDish], customItems: [String]) -> String {
        let plan = buildWeekPlan(days: days, meals: meals, restaurants: restaurants)
        let grouped = build(days: days, meals: meals)
        let sideNames = gatherSides(days: days, sides: sides)
        return weekPlanToText(plan)
            + "\n\n\n🛒  Grocery List\n" + String(repeating: "─", count: 30) + "\n"
            + shoppingListToText(grouped)
            + sidesToText(sideNames)
            + customItemsToText(customItems)
    }
}
