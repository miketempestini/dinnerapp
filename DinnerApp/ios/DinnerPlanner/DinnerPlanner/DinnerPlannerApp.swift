import SwiftUI
import SwiftData

@main
struct DinnerPlannerApp: App {
    /// One container for the whole app. SwiftData persists to the on-device store,
    /// so everything works fully offline and survives relaunches.
    let container: ModelContainer

    init() {
        do {
            container = try ModelContainer(
                for: Meal.self, Restaurant.self, SideDish.self, DayPlan.self, CustomItem.self
            )
        } catch {
            fatalError("Failed to create ModelContainer: \(error)")
        }
        seedIfNeeded(container.mainContext)
    }

    var body: some Scene {
        WindowGroup {
            RootView()
        }
        .modelContainer(container)
    }

    /// First-launch seeding. Unlike the web app's incremental `seededIds` merge,
    /// this seeds once on a fresh install (adequate for the native app) and always
    /// guarantees the seven weekday rows exist.
    private func seedIfNeeded(_ context: ModelContext) {
        PlannerActions.ensureWeek(context)

        let didSeed = UserDefaults.standard.bool(forKey: "didSeedV1")
        guard !didSeed else { return }

        for meal in SeedData.meals() { context.insert(meal) }
        for restaurant in SeedData.restaurants() { context.insert(restaurant) }
        for side in SeedData.sides() { context.insert(side) }
        try? context.save()

        UserDefaults.standard.set(true, forKey: "didSeedV1")
    }
}

/// Root tab navigation: Dinners, Planner, Random, Shopping.
struct RootView: View {
    @State private var router = AppRouter()

    var body: some View {
        TabView(selection: $router.selectedTab) {
            FavoritesView()
                .tabItem { Label("Dinners", systemImage: "fork.knife") }
                .tag(AppTab.dinners)

            PlannerView()
                .tabItem { Label("Planner", systemImage: "calendar") }
                .tag(AppTab.planner)

            RandomPickerView()
                .tabItem { Label("Random", systemImage: "dice") }
                .tag(AppTab.random)

            ShoppingListView()
                .tabItem { Label("Shopping", systemImage: "cart") }
                .tag(AppTab.shopping)
        }
        .environment(router)
    }
}
