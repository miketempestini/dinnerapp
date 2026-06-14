import Foundation

/// Default content inserted on first launch, ported verbatim from the web
/// `seedData.ts` (17 meals, 19 restaurants, 9 sides). Ids match the web app so
/// the two stay in sync conceptually and backups remain interoperable.
enum SeedData {

    static func meals() -> [Meal] {
        [
            Meal(id: "vrxkxo1cmoc3icz9", name: "Pizza", ingredients: [
                Ingredient(name: "pizza dough", category: .pantryGrains),
                Ingredient(name: "pizza sauce", category: .condimentsSpices),
                Ingredient(name: "mozzarella cheese", category: .dairy),
                Ingredient(name: "pepperoni", category: .meatSeafood),
                Ingredient(name: "butter", category: .dairy),
                Ingredient(name: "garlic", category: .condimentsSpices),
                Ingredient(name: "Parmesan cheese", category: .other),
            ]),
            Meal(id: "3y8p51q5moc3ihjg", name: "Tacos", ingredients: [
                Ingredient(name: "tortillas", category: .pantryGrains),
                Ingredient(name: "ground beef", category: .meatSeafood),
                Ingredient(name: "Mexican cheese", category: .dairy),
                Ingredient(name: "Pico de Gallo", category: .produce),
                Ingredient(name: "Hot sauce", category: .condimentsSpices),
                Ingredient(name: "sour cream", category: .condimentsSpices),
            ]),
            Meal(id: "1gbtbrn6moc3imim", name: "Smash Burgers", ingredients: [
                Ingredient(name: "ground beef", category: .meatSeafood),
                Ingredient(name: "burger buns", category: .pantryGrains),
                Ingredient(name: "american cheese", category: .dairy),
                Ingredient(name: "burger sauce", category: .condimentsSpices),
                Ingredient(name: "onions", category: .produce),
                Ingredient(name: "ketchup", category: .condimentsSpices),
            ]),
            Meal(id: "ybu2lyucmoc3is7z", name: "Beef and Rice Bowls", ingredients: [
                Ingredient(name: "ground beef", category: .meatSeafood),
                Ingredient(name: "rice", category: .other),
                Ingredient(name: "cheese", category: .dairy),
                Ingredient(name: "pico de Gallo", category: .produce),
            ]),
            Meal(id: "wb2q3ikqmoc3j1kn", name: "Quesadilla", ingredients: [
                Ingredient(name: "tortilla", category: .pantryGrains),
                Ingredient(name: "cheese", category: .dairy),
            ]),
            Meal(id: "2u3jus7jmoc3jwhd", name: "Chicken Wraps", ingredients: [
                Ingredient(name: "tortilla", category: .pantryGrains),
                Ingredient(name: "chicken strips", category: .meatSeafood),
            ]),
            Meal(id: "bxxbfr8zmoc3k5k8", name: "Calzones", ingredients: [
                Ingredient(name: "pizza dough", category: .bakery),
                Ingredient(name: "ricotta cheese", category: .dairy),
                Ingredient(name: "pepperoni", category: .meatSeafood),
                Ingredient(name: "mozzarella", category: .dairy),
                Ingredient(name: "butter", category: .dairy),
                Ingredient(name: "garlic", category: .condimentsSpices),
                Ingredient(name: "Parmesan cheese", category: .dairy),
            ]),
            Meal(id: "7s28d1ywmoc3k9no", name: "Stackers", ingredients: [
                Ingredient(name: "tortilla", category: .pantryGrains),
                Ingredient(name: "ground beef", category: .meatSeafood),
                Ingredient(name: "cheese", category: .dairy),
                Ingredient(name: "hot sauce", category: .condimentsSpices),
            ]),
            Meal(id: "fovh1wrgmoc3kda0", name: "Alfredo Pasta", ingredients: [
                Ingredient(name: "pasta", category: .pantryGrains),
                Ingredient(name: "alfredo sauce", category: .other),
                Ingredient(name: "chicken breast", category: .meatSeafood),
            ]),
            Meal(id: "cdniee2rmoc3kix0", name: "Pasta with Meat Sauce", ingredients: [
                Ingredient(name: "pasta", category: .pantryGrains),
                Ingredient(name: "pasta sauce", category: .condimentsSpices),
                Ingredient(name: "Parmesan cheese", category: .dairy),
                Ingredient(name: "ground beef", category: .meatSeafood),
            ]),
            Meal(id: "kvxdn368moc3knyp", name: "Tortellini", ingredients: [
                Ingredient(name: "tortellini", category: .pantryGrains),
                Ingredient(name: "pasta sauce", category: .condimentsSpices),
                Ingredient(name: "garlic bread", category: .bakery),
            ]),
            Meal(id: "vpf93ic1moc3krv7", name: "Sandwiches"),
            Meal(id: "p0s167stmoc3kv68", name: "Breakfast Dinner"),
            Meal(id: "idcy0m63moc3kz3v", name: "Lasagna"),
            Meal(id: "3ulstu3omojfhpr6", name: "Sloppy Joe", ingredients: [
                Ingredient(name: "Ground beef", category: .meatSeafood),
                Ingredient(name: "Buns", category: .bakery),
                Ingredient(name: "American Cheese", category: .dairy),
            ]),
            Meal(id: "omukpyjomojfi66h", name: "Hamburger Helper", ingredients: [
                Ingredient(name: "Ground beef", category: .meatSeafood),
                Ingredient(name: "Hamburger Helper", category: .meatSeafood),
            ]),
            Meal(id: "6f55sqrqmojfijz1", name: "Grilled Cheese", ingredients: [
                Ingredient(name: "Bread", category: .bakery),
                Ingredient(name: "American Cheese", category: .dairy),
            ]),
        ]
    }

    static func restaurants() -> [Restaurant] {
        [
            Restaurant(id: "t9mfpkzwmoc3l3hz", name: "McDonalds", tags: ["burgers", "drive thru", "fast food"]),
            Restaurant(id: "cm39ciczmoc3l6h5", name: "Wendy's", tags: ["burgers", "drive thru", "fast food"]),
            Restaurant(id: "savmz2wtmoc3l9yl", name: "Culvers", tags: ["burgers", "chicken", "ice cream", "fast food"]),
            Restaurant(id: "g9wng2p4moc3lcwa", name: "Bitter Pops", tags: ["burgers"]),
            Restaurant(id: "dwwjvnnqmoc3lgla", name: "Burrito House", tags: ["mexican"]),
            Restaurant(id: "fpzw8gpxmoc3lkmg", name: "Taco Bell", tags: ["mexican"]),
            Restaurant(id: "pyr4p2k7moc3loio", name: "Jimmy Johns", tags: ["sandwiches"]),
            Restaurant(id: "i5khpjpjmoc3lujc", name: "Cafe Tola", tags: ["mexican"]),
            Restaurant(id: "efzg5mj4moc3mjh0", name: "Papa Johns", tags: ["pizza"]),
            Restaurant(id: "t4a8q6dvmoc3mp1y", name: "Dominos", tags: ["pizza"]),
            Restaurant(id: "zsa01206moc3msj6", name: "Little Ceasers", tags: ["pizza"]),
            Restaurant(id: "c3mpjxvcmoc3mvja", name: "Shake Shack", tags: ["burgers"]),
            Restaurant(id: "dqjx9u3bmoc3mzjp", name: "Portillo's", tags: ["italian", "drive thru", "burgers", "chicken", "beef"]),
            Restaurant(id: "kb0oncqemoc3n30n", name: "Jimmy's Pizza", tags: ["pizza"]),
            Restaurant(id: "h0nooiwdmoc3n6tr", name: "Wingstop", tags: ["chicken"]),
            Restaurant(id: "semwbllsmoc6c486", name: "Panda Express", tags: ["chinese"]),
            Restaurant(id: "avtfkz8vmoc6cnso", name: "Avenue", tags: ["sit down"]),
            Restaurant(id: "ao2q65zsmoc6cr9p", name: "Crosby's", tags: ["sit down"]),
            Restaurant(id: "k3owr43amoc6dh41", name: "Frasca", tags: ["sit down", "italian"]),
        ]
    }

    static func sides() -> [SideDish] {
        [
            SideDish(id: "sd01fruit0seed001", name: "Fruit"),
            SideDish(id: "sd02grbrd0seed002", name: "Garlic Bread"),
            SideDish(id: "sd03mshpt0seed003", name: "Mashed Potatoes"),
            SideDish(id: "sd04macch0seed004", name: "Mac and Cheese"),
            SideDish(id: "sd05veggi0seed005", name: "Veggies"),
            SideDish(id: "sd06rice00seed006", name: "Rice"),
            SideDish(id: "sd07fries0seed007", name: "French Fries"),
            SideDish(id: "sd08naan00seed008", name: "Naan Bread"),
            SideDish(id: "sd09bkdpt0seed009", name: "Baked Potatoes"),
        ]
    }
}
