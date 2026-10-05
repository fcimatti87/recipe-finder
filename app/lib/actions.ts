// Server Actions
'use server';

import { type Recipe } from "./schemas";
import {MOCK_RECIPE} from "./mock-recipe";

export type State = {
  status: 'idle' | 'success' | 'error';
  recipe?: Recipe;
  message?: string;
};

export async function createRecipe(
  prevState: State, 
  formData: FormData
): Promise<State> {

  await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      status: 'success',
      recipe: MOCK_RECIPE,
    };
}