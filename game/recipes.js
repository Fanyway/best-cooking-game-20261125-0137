// DAPUR KILAT — recipes.js
// Every ingredient and dish in the game. A dish is exactly three processed
// ingredients; the same ingredients in a different mix make a different dish,
// so the cook has to plan, not just grab.

// An ingredient as it sits on its counter. `station` says where it must be
// processed before it can go on a plate; null means it is ready as-is.
export const INGREDIENTS = {
  nasi:   { id: 'nasi',   name: 'Nasi',      station: null,      color: '#f5efe0', dark: '#8a7a5c' },
  mie:    { id: 'mie',    name: 'Mie',       station: 'wok',     color: '#f2c14e', dark: '#a67c1a' },
  telur:  { id: 'telur',  name: 'Telur',     station: 'wok',     color: '#fff6d8', dark: '#b89a4a' },
  ayam:   { id: 'ayam',   name: 'Ayam',      station: 'board',   color: '#e8a87c', dark: '#9c5a2e' },
  sawi:   { id: 'sawi',   name: 'Sawi',      station: 'board',   color: '#7dc383', dark: '#2f6b35' },
  kecap:  { id: 'kecap',  name: 'Kecap',     station: null,      color: '#5b3a1e', dark: '#2c1a0c' },
  kuah:   { id: 'kuah',   name: 'Kuah Soto', station: null,      color: '#e8b04b', dark: '#8a5a12' },
};

// How a raw ingredient looks once it has been through its station.
export const PROCESSED_NAME = {
  mie: 'Mie Rebus',
  telur: 'Telur Goreng',
  ayam: 'Ayam Cincang',
  sawi: 'Sawi Potong',
};

// A plate item: { id, processed: true } once it has been through its station.
export function processItem(item) {
  return { id: item.id, processed: true };
}

export function itemLabel(item) {
  const base = INGREDIENTS[item.id];
  if (!base) return '?';
  return item.processed ? (PROCESSED_NAME[item.id] || base.name) : base.name;
}

// Dishes. `needs` lists ingredient ids; every dish needs exactly three.
export const RECIPES = [
  { id: 'nasi-goreng',      name: 'Nasi Goreng',      needs: ['nasi', 'telur', 'kecap'], price: 120, color: '#e07840' },
  { id: 'mie-ayam',         name: 'Mie Ayam',         needs: ['mie', 'ayam', 'sawi'],   price: 130, color: '#d8a028' },
  { id: 'soto-ayam',        name: 'Soto Ayam',        needs: ['kuah', 'ayam', 'telur'], price: 140, color: '#e8b04b' },
  { id: 'nasi-ayam-kecap',  name: 'Nasi Ayam Kecap',  needs: ['nasi', 'ayam', 'kecap'], price: 125, color: '#b06a2e' },
  { id: 'mie-goreng',       name: 'Mie Goreng',       needs: ['mie', 'telur', 'kecap'], price: 125, color: '#c98a2e' },
  { id: 'soto-mie',         name: 'Soto Mie',         needs: ['kuah', 'mie', 'sawi'],   price: 135, color: '#d99a3a' },
];

export function findRecipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

// Do the carried items (all must be processed) match a recipe exactly?
// Returns the recipe, or null when the mix is not a dish.
export function matchRecipe(items) {
  if (!items || items.length !== 3) return null;
  if (items.some((it) => !it.processed)) return null;
  const ids = items.map((it) => it.id).sort().join('+');
  return RECIPES.find((r) => [...r.needs].sort().join('+') === ids) || null;
}

// How many of a ticket's ingredients the given items already cover.
export function matchCount(recipe, items) {
  const have = items.map((it) => it.id);
  return recipe.needs.filter((id) => have.includes(id)).length;
}
