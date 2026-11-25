// Ember & Thyme — Rush Hour Kitchen
// data.js — one job: the food. Ingredients, what can be done to them,
// and the recipes the order board can ask for.

// An item is { id, state } where state is 'raw' | 'chopped' | 'cooked' | 'soup' | 'burnt'.
// A plate is { id: 'plate', components: [item, item, item] } with at most 3.

export const INGREDIENTS = {
  tomato: {
    id: 'tomato', name: 'Tomato', bin: 'Tomato',
    choppable: true, cookable: false,
    rawColor: '#e0523d', rawDark: '#b23a2a', leaf: '#5da24a',
  },
  lettuce: {
    id: 'lettuce', name: 'Lettuce', bin: 'Lettuce',
    choppable: true, cookable: false,
    rawColor: '#7cc24f', rawDark: '#4e8f33', leaf: '#8fd06a',
  },
  onion: {
    id: 'onion', name: 'Onion', bin: 'Onion',
    choppable: true, cookable: false,
    rawColor: '#c9a7d8', rawDark: '#9a76ad', leaf: '#e8dcf2',
  },
  patty: {
    id: 'patty', name: 'Patty', bin: 'Patty',
    choppable: false, cookable: true, cookTime: 6, cookResult: 'cooked',
    rawColor: '#c96f5a', rawDark: '#9c4a38', leaf: '#8a5a3a',
  },
  bun: {
    id: 'bun', name: 'Bun', bin: 'Bun',
    choppable: false, cookable: false,
    rawColor: '#e8b96a', rawDark: '#c08a3e', leaf: '#f6d493',
  },
  pasta: {
    id: 'pasta', name: 'Pasta', bin: 'Pasta',
    choppable: false, cookable: true, cookTime: 7, cookResult: 'cooked',
    rawColor: '#f2d06b', rawDark: '#c9a13c', leaf: '#fbe08a',
  },
  fish: {
    id: 'fish', name: 'Fish', bin: 'Fish',
    choppable: false, cookable: true, cookTime: 7, cookResult: 'cooked',
    rawColor: '#7fb3d8', rawDark: '#4a7ea6', leaf: '#bcd8ea',
  },
};

// Cooking a chopped tomato on the stove turns it into soup.
export const SOUP_FROM = 'tomato';
export const SOUP_COOK_TIME = 5;

export const RECIPES = [
  {
    id: 'salad', name: 'Garden Salad', price: 9,
    components: ['lettuce:chopped', 'tomato:chopped'],
    blurb: 'Crisp, fresh, fast.',
  },
  {
    id: 'soup', name: 'Tomato Soup', price: 11,
    components: ['tomato:soup'],
    blurb: 'Slow-simmered, served steaming.',
  },
  {
    id: 'pasta', name: 'Marinara Pasta', price: 12,
    components: ['pasta:cooked', 'tomato:chopped'],
    blurb: 'Twirls of golden pasta.',
  },
  {
    id: 'burger', name: 'Ember Burger', price: 13,
    components: ['bun:raw', 'patty:cooked', 'lettuce:chopped'],
    blurb: 'The house signature.',
  },
  {
    id: 'fish', name: 'Grilled Fish', price: 14,
    components: ['fish:cooked', 'onion:chopped'],
    blurb: 'Charred skin, sweet onion.',
  },
];

export function makeItem(id, state = 'raw') {
  return { id, state };
}

export function itemKey(item) {
  return `${item.id}:${item.state}`;
}

export function itemLabel(item) {
  if (!item) return '';
  if (item.id === 'plate') return 'Plate';
  const def = INGREDIENTS[item.id];
  if (!def) return item.id;
  if (item.state === 'chopped') return `Chopped ${def.name}`;
  if (item.state === 'cooked') return `Cooked ${def.name}`;
  if (item.state === 'soup') return 'Tomato Soup';
  if (item.state === 'burnt') return `Burnt ${def.name}`;
  return def.name;
}

// A plate matches a recipe when its components are exactly the recipe's,
// in any order. Returns the recipe or null.
export function matchRecipe(plate) {
  if (!plate || plate.id !== 'plate') return null;
  const have = plate.components.map(itemKey).sort().join('|');
  for (const recipe of RECIPES) {
    const want = [...recipe.components].sort().join('|');
    if (have === want) return recipe;
  }
  return null;
}

// True when every component on the plate belongs to at least one recipe that
// could still be completed from it (used to tint the plate green/red).
export function plateCouldStillMatch(plate) {
  if (!plate || plate.id !== 'plate' || plate.components.length === 0) return true;
  const have = plate.components.map(itemKey);
  return RECIPES.some((recipe) => {
    const want = [...recipe.components];
    return have.every((key) => {
      const i = want.indexOf(key);
      if (i === -1) return false;
      want.splice(i, 1);
      return true;
    });
  });
}

export function randomRecipe(rng) {
  return RECIPES[Math.floor(rng() * RECIPES.length)];
}
