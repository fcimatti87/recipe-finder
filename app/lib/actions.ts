// Server Actions
'use server';

import { 
  type Recipe,
  RecipeRequestSchema
 } from "./schemas";
import { MOCK_RECIPE } from "./mock-recipe";
export type State = {
  status: 'idle' | 'success' | 'error';
  recipe?: Recipe;
  message?: string;
};

export async function createRecipe(
  prevState: State, 
  formData: FormData
): Promise<State> {

  const validatedFields = RecipeRequestSchema.safeParse({
    mealType: formData.get('mealType'),
    ingredients: formData.get('ingredients')
  });
  
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    console.log(validatedFields.error.issues);
    
    return {
      status: 'error',
      message: validatedFields.error.issues[0].message,
    };
  }

  const { mealType, ingredients } = validatedFields.data;

  await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      status: 'success',
      recipe: MOCK_RECIPE,
    };
}