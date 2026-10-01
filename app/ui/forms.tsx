// useActionState è un hook, e gli hook funzionano solo nei Client Components
'use client';

import { useActionState } from 'react';
import { 
    State,
    createRecipe
} from '@/app/lib/actions';
import { 
    MealTypeSchema
} from '@/app/lib/schemas';
import { MEAL_TYPE_LABELS } from '@/app/lib/labels';

export default function RecipeForm() {

  // : State è l'annotazione di tipo che dice a TypeScript che l'oggetto deve avere la forma del tipo State" (definito in actions.ts, con errors? e message?)
  const initialState: State = { message: null, errors: {} };
  const [state, formAction] = useActionState(createRecipe, initialState);

  return (
    <form 
      action={formAction}
      className='flex flex-col gap-4'>
      <div>
        {/* Meal type */}
        <div>
          <label 
            htmlFor="mealType"
            className='block font-medium'>
            Scegli un tipo di pasto
          </label>
          <div>
            <select
              id="mealType"
              name="mealType"
              defaultValue="qualsiasi"
              className='rounded border border-zinc-400 p-2'
            >
              <option value="qualsiasi">Qualsiasi</option>
              {MealTypeSchema.options.map((mt) => (
                <option key={mt} value={mt}>
                  {MEAL_TYPE_LABELS[mt]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <label 
            htmlFor="ingredients"
            className='block font-medium'>
            Inserisci gli ingredienti separati da virgola
          </label>
          <div>
            <textarea
                id="ingredients"
                name="ingredients"
                aria-describedby='missing-ingredients-error'
                className='w-full rounded border border-zinc-400 p-2'/>
          </div>
        </div>

        <div id="missing-ingredients-error" aria-live="polite">
          { state.message && (
            <p className="text-red-700">
              {state.message}
            </p>
          )}
        </div>

      </div>
      <div>
        <button 
          type="submit" 
          className='rounded bg-zinc-600 px-4 py-2 text-white disabled:opacity-50'>
          Crea la ricetta</button>
      </div>
    </form>
  );
}