import type { Recipe } from "./schemas";

export const MOCK_RECIPE: Recipe = {
    title: "Spaghetti aglio, olio e peperoncino",
    mealType: 'primo',
    ingredients: [
        { name: "spaghetti", amount: 320, unit: "g" },
        { name: "aglio", amount: 2, unit: "pz" },
        { name: "olio extravergine d'oliva", amount: 4, unit: "cucchiai" },
        { name: "peperoncino", amount: 1, unit: "pz" },
        { name: "prezzemolo", amount: null, unit: "q.b." },
        { name: "sale", amount: null, unit: "q.b." },
    ],
    instructions:  [
        "Porta a bollore abbondante acqua salata e cuoci gli spaghetti.",
        "Nel frattempo scalda l'olio in padella con l'aglio a fettine e il peperoncino.",
        "Quando l'aglio è dorato, spegni il fuoco per non farlo bruciare.",
        "Scola la pasta al dente, tenendo da parte un mestolo di acqua di cottura.",
        "Salta gli spaghetti in padella con un po' di acqua di cottura e il prezzemolo tritato.",
    ],
    prepTimeMinutes: 5,
    cookTimeMinutes: 12,
    servings: 4,
    difficulty: 'facile',
};