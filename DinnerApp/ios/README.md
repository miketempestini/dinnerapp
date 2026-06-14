# Dinner Planner — Native iOS App (SwiftUI + SwiftData)

A native iPhone port of the **DinnerWheel** web app (which lives in `../` — the
React/Vite project). It replicates the full feature set using **SwiftUI** for the
UI and **SwiftData** for on-device persistence. The app is **fully offline** — no
accounts, no networking.

> The original web app is untouched. This iOS port lives entirely under
> `DinnerApp/ios/` and was built on the `ios-swiftui-native` branch.

## Requirements

- **Xcode 16 or later** (developed and verified on Xcode 26.4)
- **iOS 17+** deployment target
- An iPhone simulator or device

## Open & Run

1. Open the project:
   ```
   open DinnerPlanner/DinnerPlanner.xcodeproj
   ```
2. In Xcode, pick an iPhone simulator (e.g. **iPhone 17 Pro**) from the scheme’s
   destination menu.
3. Press **⌘R** to build and run. On first launch the app seeds a default set of
   meals, restaurants, and side dishes (the same content as the web app).

### Build from the command line

```
cd DinnerPlanner
xcodebuild -project DinnerPlanner.xcodeproj \
  -scheme DinnerPlanner \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  build
```

### Running on a physical device

Set your own **bundle identifier** and **signing team** in Xcode:
*Target → Signing & Capabilities*. The placeholder bundle id is
`com.yourname.dinnerplanner`.

## Features

| Tab | What it does |
| --- | --- |
| **Dinners** | Manage meals (name + ingredients), restaurants (name + tags), and side dishes. Segmented control switches between them. Backup/Restore lives in the toolbar (⋯). |
| **Planner** | Seven day cards (Mon–Sun). Tap a day to assign a meal, a leftover (from a meal cooked on an earlier day), or a restaurant; add sides; write a note; or skip the day. **Plan for me** randomly fills empty days; **Clear Week** resets everything. |
| **Random** | Pick a random dinner with a native reveal animation + haptics. **3 Randoms** draws three unique options to choose from. Add the winner straight to a day. |
| **Shopping** | Auto-generated grocery list aggregated from the week’s cooked meals (deduped and quantity-summed, grouped by category), plus assigned sides and free-form “Other” items. Copy or Share the list as text. |

## Project Structure

```
DinnerPlanner/
  DinnerPlanner.xcodeproj          # uses a file-system–synchronized group:
                                   # new files added to the folder are picked up
                                   # automatically, no manual project edits needed
  DinnerPlanner/
    DinnerPlannerApp.swift         # @main, ModelContainer, first-launch seeding
    AppRouter.swift                # cross-tab navigation
    Models/                        # SwiftData @Models + value types
      Category, Ingredient, Meal, Restaurant, SideDish,
      DayPlan, CustomItem, Weekday, IDGenerator
    Features/
      Favorites/                   # Dinners tab (meals / restaurants / sides) + backup
      Planner/                     # PlannerView, DayCardView, AssignSheet
      Random/                      # RandomPickerView (native reveal), Haptics
      Shopping/                    # ShoppingListView
    Services/
      Leftovers.swift              # derive leftover options from the week
      ShoppingListBuilder.swift    # aggregation, quantity parsing, text exports
      PlannerActions.swift         # all store mutations + referential cleanup
      Backup.swift                 # JSON export/import (web-compatible)
      SeedData.swift               # default meals / restaurants / sides
    Assets.xcassets                # AppIcon placeholder + AccentColor
```

## Notes on the port (where it differs from the web app)

- **Persistence:** SwiftData replaces the web’s Zustand + `localStorage`. The data
  model mirrors the web’s **id-based** shape 1:1.
- **Backups are cross-compatible:** the JSON written by *Backup* matches the web
  app’s format exactly, so a file exported on one platform imports on the other.
- **Planner interaction:** the web uses drag-and-drop; the iOS app uses a native
  **tap-to-assign** sheet (more comfortable on a phone). All planning behavior —
  one main dinner per day, multiple sides, notes, skip, leftovers, plan-for-me,
  clear week — is preserved.
- **Random picker:** the web’s spinning SVG wheel is replaced by a native **reveal
  animation** (cycling labels + haptics). The selection logic (uniform random, and
  the unique “3 Randoms” draw) is identical. Sides are excluded from random picks,
  matching the web.
- **App icon:** ships as a placeholder. Drop a 1024×1024 image into
  `Assets.xcassets/AppIcon.appiconset` to brand it.

## App Store readiness

- No deprecated APIs; builds clean against the iOS 17 SDK and later.
- Info.plist is generated from build settings (`GENERATE_INFOPLIST_FILE`), with a
  proper display name, launch screen, and supported orientations.
- Set a real bundle id, signing team, and app icon before submitting.
