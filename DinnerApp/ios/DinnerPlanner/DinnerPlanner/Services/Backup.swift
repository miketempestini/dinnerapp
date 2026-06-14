import Foundation
import SwiftData

/// JSON backup/restore. The DTOs match the **web app's backup shape exactly**
/// (`backup.ts`), so a file exported here imports into the web app and vice versa.
enum Backup {

    // MARK: DTOs (mirror the web JSON 1:1)

    struct MealDTO: Codable {
        let id: String
        let name: String
        let ingredients: [Ingredient]   // Ingredient's Codable already matches {name,qty,unit,category}
    }

    struct RestaurantDTO: Codable {
        let id: String
        let name: String
        let tags: [String]
    }

    struct SideDTO: Codable {
        let id: String
        let name: String
    }

    /// Polymorphic assignment object: { kind, mealId? | restaurantId? | sourceMealId? } or null.
    struct AssignmentDTO: Codable {
        let kind: String
        let mealId: String?
        let restaurantId: String?
        let sourceMealId: String?

        init(kind: AssignmentKind, refId: String) {
            self.kind = kind.rawValue
            switch kind {
            case .meal: mealId = refId; restaurantId = nil; sourceMealId = nil
            case .restaurant: restaurantId = refId; mealId = nil; sourceMealId = nil
            case .leftover: sourceMealId = refId; mealId = nil; restaurantId = nil
            }
        }

        /// Only emit the key relevant to `kind`, matching the web output exactly.
        func encode(to encoder: Encoder) throws {
            var c = encoder.container(keyedBy: CodingKeys.self)
            try c.encode(kind, forKey: .kind)
            switch AssignmentKind(rawValue: kind) {
            case .meal: try c.encode(mealId, forKey: .mealId)
            case .restaurant: try c.encode(restaurantId, forKey: .restaurantId)
            case .leftover: try c.encode(sourceMealId, forKey: .sourceMealId)
            case .none: break
            }
        }

        enum CodingKeys: String, CodingKey { case kind, mealId, restaurantId, sourceMealId }

        var resolved: (AssignmentKind, String)? {
            guard let k = AssignmentKind(rawValue: kind) else { return nil }
            switch k {
            case .meal: return mealId.map { (k, $0) }
            case .restaurant: return restaurantId.map { (k, $0) }
            case .leftover: return sourceMealId.map { (k, $0) }
            }
        }
    }

    struct DayDTO: Codable {
        let assignment: AssignmentDTO?
        let sides: [String]?
        let note: String
        let skipped: Bool
    }

    struct BackupDTO: Codable {
        let version: Int
        let exportedAt: String
        let meals: [MealDTO]
        let restaurants: [RestaurantDTO]
        let sides: [SideDTO]?         // older web backups may omit this
        let week: [String: DayDTO]
    }

    // MARK: Export

    /// Build the backup payload from the current store and write it to a temp file
    /// named `dinnerwheel-backup-YYYY-MM-DD.json` (matching the web filename).
    static func exportFileURL(_ context: ModelContext) -> URL? {
        let meals = (try? context.fetch(FetchDescriptor<Meal>())) ?? []
        let restaurants = (try? context.fetch(FetchDescriptor<Restaurant>())) ?? []
        let sides = (try? context.fetch(FetchDescriptor<SideDish>())) ?? []
        let days = (try? context.fetch(FetchDescriptor<DayPlan>())) ?? []

        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

        var week: [String: DayDTO] = [:]
        let byIndex = Dictionary(uniqueKeysWithValues: days.map { ($0.dayIndex, $0) })
        for wd in Weekday.allCases {
            let d = byIndex[wd.rawValue]
            var assignment: AssignmentDTO?
            if let d, let kind = d.assignmentKind, let ref = d.assignmentRefId {
                assignment = AssignmentDTO(kind: kind, refId: ref)
            }
            week[wd.jsonKey] = DayDTO(assignment: assignment,
                                      sides: d?.sideIds ?? [],
                                      note: d?.note ?? "",
                                      skipped: d?.skipped ?? false)
        }

        let dto = BackupDTO(
            version: 1,
            exportedAt: iso.string(from: Date()),
            meals: meals.map { MealDTO(id: $0.id, name: $0.name, ingredients: $0.ingredients) },
            restaurants: restaurants.map { RestaurantDTO(id: $0.id, name: $0.name, tags: $0.tags) },
            sides: sides.map { SideDTO(id: $0.id, name: $0.name) },
            week: week
        )

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        guard let data = try? encoder.encode(dto) else { return nil }

        let dateStr = Self.dateStamp()
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("dinnerwheel-backup-\(dateStr).json")
        do { try data.write(to: url); return url } catch { return nil }
    }

    private static func dateStamp() -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: Date())
    }

    // MARK: Restore

    enum RestoreError: LocalizedError {
        case unsupportedVersion, malformed
        var errorDescription: String? {
            switch self {
            case .unsupportedVersion: return "Unsupported backup file version."
            case .malformed: return "Backup file is missing required fields."
            }
        }
    }

    /// Replace all data with the contents of a backup file (mirrors `replaceAll`).
    static func restore(from url: URL, into context: ModelContext) throws {
        let needsStop = url.startAccessingSecurityScopedResource()
        defer { if needsStop { url.stopAccessingSecurityScopedResource() } }

        let data = try Data(contentsOf: url)
        let dto = try JSONDecoder().decode(BackupDTO.self, from: data)
        guard dto.version == 1 else { throw RestoreError.unsupportedVersion }

        // Wipe existing records.
        for m in (try? context.fetch(FetchDescriptor<Meal>())) ?? [] { context.delete(m) }
        for r in (try? context.fetch(FetchDescriptor<Restaurant>())) ?? [] { context.delete(r) }
        for s in (try? context.fetch(FetchDescriptor<SideDish>())) ?? [] { context.delete(s) }
        for c in (try? context.fetch(FetchDescriptor<CustomItem>())) ?? [] { context.delete(c) }

        // Insert favorites.
        for m in dto.meals { context.insert(Meal(id: m.id, name: m.name, ingredients: m.ingredients)) }
        for r in dto.restaurants { context.insert(Restaurant(id: r.id, name: r.name, tags: r.tags)) }
        for s in (dto.sides ?? []) { context.insert(SideDish(id: s.id, name: s.name)) }

        // Reset & apply the week.
        PlannerActions.ensureWeek(context)
        let days = (try? context.fetch(FetchDescriptor<DayPlan>())) ?? []
        let byIndex = Dictionary(uniqueKeysWithValues: days.map { ($0.dayIndex, $0) })
        for wd in Weekday.allCases {
            guard let d = byIndex[wd.rawValue] else { continue }
            let dayDTO = dto.week[wd.jsonKey]
            if let resolved = dayDTO?.assignment?.resolved {
                d.assignmentKind = resolved.0
                d.assignmentRefId = resolved.1
            } else {
                d.assignmentKind = nil
                d.assignmentRefId = nil
            }
            d.sideIds = dayDTO?.sides ?? []
            d.note = dayDTO?.note ?? ""
            d.skipped = dayDTO?.skipped ?? false
        }

        PlannerActions.save(context)
    }
}
