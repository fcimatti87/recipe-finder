// library to check the data at runtime
import { z } from 'zod';

export const MealTypeSchema = z.enum(['antipasto', 'primo', 'secondo', 'contorno', 'piatto_unico', 'dolce']);

// define a schema to validate what the user submits through the form.
export const RecipeRequestSchema = z.object({
    mealType: MealTypeSchema.or(z.literal('qualsiasi')),
    ingredients: z
        .string()
        .trim()
        .min(1, { error: 'Per favore inserisci almeno un ingrediente.'}) // error to show if this check fails
});

export const IngredientSchema = z.object({
    name: z.string().min(1, {error: "Il nome dell'ingrediente è obbligatorio"}),
    amount: z
        .number()
        .positive()
        .nullable(), // nullable means q.b.,
    unit: z.enum(['g', 'kg', 'ml', 'l', 'cucchiai', 'cucchiaini', 'q.b.', 'pz']),
});

// define a schema to validate the recipe AI response.
export const RecipeSchema = z.object({
    title: z.string(),
    mealType: MealTypeSchema,

    // ingredienti
    ingredients: z.array(IngredientSchema).min(1, {error: "La ricetta deve avere almeno un ingrediente"}),

    // fasi
    instructions: z.array(z
        .string()
        .min(5, {error: "L'istruzione deve essere più dettagliata"})
    ).min(1, {error: "La ricetta deve avere almeno un passaggio"}),

    // tempi di preparazione e cottura
    prepTimeMinutes: z.number().int().nonnegative(),
    cookTimeMinutes: z.number().int().nonnegative(),
    
    // Informazioni aggiuntive
    servings: z
        .number()
        .int()
        .positive({error: "Le porzioni devono essere almeno 1"}),
    difficulty: z.enum(['facile', 'medio', 'difficile'])
});

// extract the inferred type
export type RecipeRequest = z.infer<typeof RecipeRequestSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;
export type MealType = z.infer<typeof MealTypeSchema>;
export type Ingredient = z.infer<typeof IngredientSchema>;

// Il tipo esiste solo mentre scrivi il codice, e TypeScript lo usa per controllarti.
// Quando il progetto viene compilato, i tipi vengono cancellati: nel JavaScript che gira nel browser o sul server non ne resta traccia.

// Lo schema invece esiste mentre l'app gira. È un oggetto JavaScript vero, con dei metodi, che controlla i dati nel momento in cui arrivano.
// TypeScript questi dati non li può vedere, perché quando controlla il codice non esistono ancora.