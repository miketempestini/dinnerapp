import type { Meal, Restaurant } from '../types';

export const SEED_MEALS: Meal[] = [
  {
    id: 'vrxkxo1cmoc3icz9',
    name: 'Pizza',
    ingredients: [
      { name: 'pizza dough', category: 'Pantry/Grains' },
      { name: 'pizza sauce', category: 'Condiments & Spices' },
      { name: 'mozzarella cheese', category: 'Dairy' },
      { name: 'pepperoni', category: 'Meat & Seafood' },
      { name: 'butter', category: 'Dairy' },
      { name: 'garlic', category: 'Condiments & Spices' },
      { name: 'Parmesan cheese', category: 'Other' },
    ],
  },
  {
    id: '3y8p51q5moc3ihjg',
    name: 'Tacos',
    ingredients: [
      { name: 'tortillas', category: 'Pantry/Grains' },
      { name: 'ground beef', category: 'Meat & Seafood' },
      { name: 'Mexican cheese', category: 'Dairy' },
      { name: 'Pico de Gallo', category: 'Produce' },
      { name: 'Hot sauce', category: 'Condiments & Spices' },
      { name: 'sour cream', category: 'Condiments & Spices' },
    ],
  },
  {
    id: '1gbtbrn6moc3imim',
    name: 'Smash Burgers',
    ingredients: [
      { name: 'ground beef', category: 'Meat & Seafood' },
      { name: 'burger buns', category: 'Pantry/Grains' },
      { name: 'american cheese', category: 'Dairy' },
      { name: 'burger sauce', category: 'Condiments & Spices' },
      { name: 'onions', category: 'Produce' },
      { name: 'ketchup', category: 'Condiments & Spices' },
    ],
  },
  {
    id: 'ybu2lyucmoc3is7z',
    name: 'Beef and Rice Bowls',
    ingredients: [
      { name: 'ground beef', category: 'Meat & Seafood' },
      { name: 'rice', category: 'Other' },
      { name: 'cheese', category: 'Dairy' },
      { name: 'pico de Gallo', category: 'Produce' },
    ],
  },
  {
    id: 'wb2q3ikqmoc3j1kn',
    name: 'Quesadilla',
    ingredients: [
      { name: 'tortilla', category: 'Pantry/Grains' },
      { name: 'cheese', category: 'Dairy' },
    ],
  },
  {
    id: '2u3jus7jmoc3jwhd',
    name: 'Chicken Wraps',
    ingredients: [
      { name: 'tortilla', category: 'Pantry/Grains' },
      { name: 'chicken strips', category: 'Meat & Seafood' },
    ],
  },
  {
    id: 'bxxbfr8zmoc3k5k8',
    name: 'Calzones',
    ingredients: [
      { name: 'pizza dough', category: 'Bakery' },
      { name: 'ricotta cheese', category: 'Dairy' },
      { name: 'pepperoni', category: 'Meat & Seafood' },
      { name: 'mozzarella', category: 'Dairy' },
      { name: 'butter', category: 'Dairy' },
      { name: 'garlic', category: 'Condiments & Spices' },
      { name: 'Parmesan cheese', category: 'Dairy' },
    ],
  },
  {
    id: '7s28d1ywmoc3k9no',
    name: 'Stackers',
    ingredients: [
      { name: 'tortilla', category: 'Pantry/Grains' },
      { name: 'ground beef', category: 'Meat & Seafood' },
      { name: 'cheese', category: 'Dairy' },
      { name: 'hot sauce', category: 'Condiments & Spices' },
    ],
  },
  { id: 'fovh1wrgmoc3kda0', name: 'Alfredo Pasta', ingredients: [] },
  {
    id: 'cdniee2rmoc3kix0',
    name: 'Pasta with Meat Sauce',
    ingredients: [
      { name: 'pasta', category: 'Pantry/Grains' },
      { name: 'pasta sauce', category: 'Condiments & Spices' },
      { name: 'Parmesan cheese', category: 'Dairy' },
      { name: 'ground beef', category: 'Meat & Seafood' },
    ],
  },
  {
    id: 'kvxdn368moc3knyp',
    name: 'Tortellini',
    ingredients: [
      { name: 'tortellini', category: 'Pantry/Grains' },
      { name: 'pasta sauce', category: 'Condiments & Spices' },
    ],
  },
  { id: 'vpf93ic1moc3krv7', name: 'Sandwiches', ingredients: [] },
  { id: 'p0s167stmoc3kv68', name: 'Breakfast Dinner', ingredients: [] },
  { id: 'idcy0m63moc3kz3v', name: 'Lasagna', ingredients: [] },
];

export const SEED_RESTAURANTS: Restaurant[] = [
  { id: 't9mfpkzwmoc3l3hz', name: "McDonalds", tags: ['burgers', 'drive thru', 'fast food'] },
  { id: 'cm39ciczmoc3l6h5', name: "Wendy's", tags: ['burgers', 'drive thru', 'fast food'] },
  { id: 'savmz2wtmoc3l9yl', name: 'Culvers', tags: ['burgers', 'chicken', 'ice cream', 'fast food'] },
  { id: 'g9wng2p4moc3lcwa', name: 'Bitter Pops', tags: ['burgers'] },
  { id: 'dwwjvnnqmoc3lgla', name: 'Burrito House', tags: ['mexican'] },
  { id: 'fpzw8gpxmoc3lkmg', name: 'Taco Bell', tags: ['mexican'] },
  { id: 'pyr4p2k7moc3loio', name: 'Jimmy Johns', tags: ['sandwiches'] },
  { id: 'i5khpjpjmoc3lujc', name: 'Cafe Tola', tags: ['mexican'] },
  { id: 'efzg5mj4moc3mjh0', name: 'Papa Johns', tags: ['pizza'] },
  { id: 't4a8q6dvmoc3mp1y', name: 'Dominos', tags: ['pizza'] },
  { id: 'zsa01206moc3msj6', name: 'Little Ceasers', tags: ['pizza'] },
  { id: 'c3mpjxvcmoc3mvja', name: 'Shake Shack', tags: ['burgers'] },
  { id: 'dqjx9u3bmoc3mzjp', name: "Portillo's", tags: ['italian', 'drive thru', 'burgers', 'chicken', 'beef'] },
  { id: 'kb0oncqemoc3n30n', name: "Jimmy's Pizza", tags: ['pizza'] },
  { id: 'h0nooiwdmoc3n6tr', name: 'Wingstop', tags: ['chicken'] },
  { id: 'semwbllsmoc6c486', name: 'Panda Express', tags: ['chinese'] },
  { id: 'avtfkz8vmoc6cnso', name: 'Avenue', tags: ['sit down'] },
  { id: 'ao2q65zsmoc6cr9p', name: "Crosby's", tags: ['sit down'] },
  { id: 'k3owr43amoc6dh41', name: 'Frasca', tags: ['sit down', 'italian'] },
];
