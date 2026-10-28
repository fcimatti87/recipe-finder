// Server Actions
'use server';

import { 
  type Recipe,
  RecipeRequestSchema,
  RecipeSchema
 } from "./schemas";
// import { z } from 'zod';
import { MOCK_RECIPE } from "./mock-recipe";
import { generateText, Output, APICallError, NoObjectGeneratedError } from 'ai'; // Vercel AI SDK core: provider-agnostic functions (text generation, structured output, errors)
import { google } from '@ai-sdk/google';   // Google provider: connects the Vercel AI SDK core to the Gemini API (auth, request format)

// create models that call the Google Generative AI API using the provider instance (the first argument is the model id, e.g. gemini-3.8-flash)
const MODEL_ID = "gemini-3.8-flash";
const AI_TIMEOUT_MS = 45_000;
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

  console.log("ingredients: " + ingredients);
  console.log("mealType: " + mealType);
  // console.log(JSON.stringify(z.toJSONSchema(RecipeSchema), null, 2));

  prompt = prompt + ' con questi ingredienti: ' + ingredients + ' . Considera che il tempo di preparazione deve comprendere anche riposi, raffreddamenti e lievitazioni.';

  console.log("API key loaded:", Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY));

  console.time("gemini");

  // use Google language models to generate text with the generateText function
  // use generateText function with Output.object() to generate structured data from a prompt
  
  try {
    const { output, usage, finishReason } = await generateText({
      providerOptions: {
        google: {
            thinkingConfig: {
              thinkingLevel: 'medium'
            }
          }
      },
      model: model,
      output: Output.object({
        schema: RecipeSchema,
      }),
      prompt: prompt,
      maxRetries: 0,
      // abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS) // the abort timeout to interrupt long waits
    });

    console.log({usage, finishReason});
    
    return {
      status: 'success',
      recipe: output,
    };

  } catch(e){
    
    console.error(e);

    // generic error message: network outage, wrong AI model (404), not a valid key (401/403), Google overloaded (503)
    let message = 'Non sono riuscita a generare la ricetta. Riprova tra poco.';

    if (APICallError.isInstance(e) && e.statusCode === 429) { // rate limit: per minute or per day.
      message = 'Troppe richieste in questo momento. Riprova tra qualche minuto.';

    } else if (NoObjectGeneratedError.isInstance(e)) {
      console.error('NoObjectGeneratedError');
      console.error('Cause:', e.cause);
      console.error('Text:', e.text);
      console.error('Response:', e.response);
      console.error('Usage:', e.usage);
      console.error('Finish Reason:', e.finishReason);

    } else if (e instanceof Error && e.name === "TimeoutError"){
      console.error(`AI request timed out after ${AI_TIMEOUT_MS} ms`);
      message = 'Il servizio è molto lento in questo momento. Riprova tra poco.';
    }

    return {
      status: 'error',
      message: message,
    };

  } finally {
    console.timeEnd("gemini");
  }

}