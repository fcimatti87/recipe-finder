// Server Actions
'use server';

import { 
  type Recipe,
  RecipeRequestSchema,
  RecipeSchema
 } from "./schemas";
import { MOCK_RECIPE } from "./mock-recipe";
import { generateText, Output } from 'ai';
import { google } from '@ai-sdk/google';

const MODEL_ID = "gemini-3.8-flash";
const model = google(MODEL_ID);

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

  let prompt;
  if (mealType !== 'qualsiasi'){
    prompt = 'Genera un ' + mealType;
  } else {
    prompt = 'Genera una ricetta';
  }

  console.log("API key loaded:", Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY));
  console.time("gemini");


  // create models that call the Google Generative AI API using the provider instance (the first argument is the model id, e.g. gemini-3.8-flash)
  // use Google language models to generate text with the generateText function
  // use generateText function with Output.object() to generate structured data from a prompt
  const { output } = await generateText({
    model: model,
    output: Output.object({
      schema: RecipeSchema,
    }),
    prompt: prompt + ' con questi ingredienti: ' + ingredients
  });

  console.timeEnd("gemini");
  
  return {
    status: 'success',
    recipe: output,
  };

}