const ingredientVisuals: Array<[string[], string]> = [
  [['spring onion', 'green onion', 'scallion', 'daun bawang'], 'spring-onions'],
  [['potato', 'kentang'], 'potatoes'],
  [['chili pepper', 'chilli pepper', 'red chili', 'red chilli', 'cabai', 'cabe'], 'chili-peppers'],
  [['radish', 'lobak'], 'radishes'],
  [['asparagus'], 'asparagus'],
  [['baby corn', 'jagung muda'], 'baby-corn'],
  [['mini bell pepper', 'mini pepper', 'baby bell pepper'], 'mini-bell-peppers'],
  [['broccolini'], 'broccolini'],
  [['snow pea', 'mangetout'], 'snow-peas'],
];

export const getIngredientVisualHref = (name: string): string | undefined => {
  const normalizedName = name.toLowerCase();
  const match = ingredientVisuals.find(([terms]) =>
    terms.some((term) => normalizedName.includes(term)),
  );

  return match ? `/ingredient-illustrations.svg#${match[1]}` : undefined;
};