import { 
    type Recipe ,
    type Ingredient
} from "../lib/schemas";
import { MEAL_TYPE_LABELS } from "../lib/labels";

function formatIngredient(ingredient: Ingredient): string {
    let ingr = ingredient.name + ':';
    if (ingredient.amount) {
        ingr = ingr + ' ' + ingredient.amount;
    }
    return ingr + ' ' + ingredient.unit;
};

export default function RecipeCard({ recipe } : {recipe: Recipe }) {
    return (
        <article className="mt-8 rounded border border-zinc-300 p-4">
            <h2 className="text-xl font-semibold">{recipe.title}</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4">
                <dt>Tipologia:</dt>
                <dd>{MEAL_TYPE_LABELS[recipe.mealType]}</dd>
                <dt>Porzioni:</dt>
                <dd>{recipe.servings}</dd>
                <dt>Tempo di preparazione:</dt>
                <dd>{recipe.prepTimeMinutes} minuti</dd>
                <dt>Tempo di cottura:</dt>
                <dd>{recipe.cookTimeMinutes} minuti</dd>
                <dt>Difficoltà:</dt>
                <dd>{recipe.difficulty}</dd>
            </dl>
            <h3 className="mt-4 font-medium">Ingredienti:</h3>
            <ul className="list-disc pl-5">
                {recipe.ingredients.map((ingr) => (
                    <li key={ingr.name}>{formatIngredient(ingr)}</li>
                ))}            
            </ul>
            <h3 className="mt-4 font-medium">Istruzioni:</h3>
            <ol className="list-decimal pl-5">
                {recipe.instructions.map((instr) => (
                    <li key={instr}>{instr}</li>
                ))}
            </ol>
        </article>
    );
}