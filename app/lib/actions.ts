// Server Actions
'use server';

import { 
  type Recipe,
  RecipeRequestSchema,
  RecipeResponseSchema
 } from "./schemas";
// import { z } from 'zod';
import { MOCK_RECIPE } from "./mock-recipe";
import { MEAL_TYPE_LABELS } from "./labels";
import { generateText, Output, APICallError, NoObjectGeneratedError } from 'ai'; // Vercel AI SDK core: provider-agnostic functions (text generation, structured output, errors)
import { google } from '@ai-sdk/google';   // Google provider: connects the Vercel AI SDK core to the Gemini API (auth, request format)

// create models that call the Google Generative AI API using the provider instance (the first argument is the model id, e.g. gemini-3.8-flash)
const MODEL_ID = process.env.GEMINI_MODEL ?? 'gemini-3.8-flash';

// only to fast test
// const MODEL_ID = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite';

const AI_TIMEOUT_MS = 45_000;
const model = google(MODEL_ID);
const SYSTEM_PROMPT = `Comportati come un cuoco che crea ricette.
  Regole:
  - Scrivi tutta la ricetta in italiano.
  - Il tempo di preparazione deve comprendere anche riposi, raffreddamenti e lievitazioni.
  - Se un termine indica chiaramente un alimento, anche tramite un marchio, usalo, e nella ricetta scrivi il nome generico dell’alimento.
  - Ignora le parole che nel loro significato comune non sono alimenti.
  - Se non resta nessun alimento setta isPossible a false, setta recipe a null e scrivi in reason il motivo con un tono amichevole e in una frase sola.`;

export type State = {
  status: 'idle' | 'success' | 'error';
  recipe?: Recipe;
  message?: string;
};

export async function createRecipe(
  _prevState: State, 
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

  console.log("ingredients: " + ingredients);
  console.log("mealType: " + mealType);
  // console.log(JSON.stringify(z.toJSONSchema(RecipeResponseSchema), null, 2));
  console.log("API key loaded:", Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY));

  const prompt = 
    mealType !== 'qualsiasi' 
    ? `Genera un ${MEAL_TYPE_LABELS[mealType].toLowerCase()} usando questi ingredienti: ${ingredients}` 
    : `Genera una ricetta usando questi ingredienti:  ${ingredients}`;

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
        schema: RecipeResponseSchema,
      }),
      system: SYSTEM_PROMPT,
      prompt: prompt,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS) // the abort timeout to interrupt long waits
    });

    console.log({usage, finishReason});

    if (output.isPossible && output.recipe) {
        // recipe generated with success
      return {
          status: 'success',
          recipe: output.recipe,
      };

    } else {
      // all ingredients are not valid or recipe is not generated
      return {
        status: 'error',
        message: output.reason ?? 'Con questi ingredienti non riesco a creare una ricetta.'
      };
    }

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