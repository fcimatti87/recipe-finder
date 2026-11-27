// Server Actions
'use server';

import { 
  type Recipe,
  // type Ingredient,
  // type MealType,
  RecipeRequestSchema,
  RecipeResponseSchema
 } from "./schemas";
// import { z } from 'zod';
// import { MOCK_RECIPE } from "./mock-recipe";
import { MEAL_TYPE_LABELS } from "./labels";
import { generateText, Output, APICallError, NoObjectGeneratedError, RetryError } from 'ai'; // Vercel AI SDK core: provider-agnostic functions (text generation, structured output, errors)
import { google } from '@ai-sdk/google';   // Google provider: connects the Vercel AI SDK core to the Gemini API (auth, request format)
import { headers } from 'next/headers';
import { minuteRateLimit, dailyRateLimit } from "./rateLimit";

// create models that call the Google Generative AI API using the provider instance (the first argument is the model id, e.g. gemini-3.8-flash)
const MODEL_ID = process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite';
const AI_TIMEOUT_MS = 45_000;
const AI_MAX_RETRIES = 1;
const model = google(MODEL_ID);
const SYSTEM_PROMPT = 
`Regole per gli ingredienti:
- Se un termine indica chiaramente un alimento, anche tramite un marchio, usalo, e nella ricetta scrivi il nome generico dell’alimento.
- Ignora le parole che nel loro significato comune non sono alimenti.
- Puoi aggiungere ingredienti da dispensa che si trovano in ogni casa.
- Usa "pz" solo per ingredienti che si contano (uova, spicchi d'aglio, limoni); tutto il resto va in grammi o millilitri.
- Esprimi il lievito in grammi (una bustina sono 16 g); spezie e aromi in cucchiaini o "q.b.".
- Se non resta nessun alimento setta isPossible a false, setta recipe a null e scrivi in reason il motivo con un tono amichevole e in una frase sola.
- Se lo stesso ingrediente compare più volte, indica a cosa serve ciascuna quantità

Regole per la ricetta:
- Comportati come un cuoco esperto e proponi una ricetta gustosa, equilibrata e realistica.
- Scrivi tutta la ricetta in italiano, con accenti e apostrofi corretti.
- prepTimeMinutes è il tempo totale escluso la cottura principale: comprende cotture preliminari di eventuali ingredienti, riposi, raffreddamenti e lievitazioni.`;

export type State = {
  status: 'idle' | 'success' | 'error';
  mealType?: string;
  ingredients?: string;
  recipe?: Recipe;
  message?: string;
};

export async function createRecipe(
  _prevState: State, 
  formData: FormData
): Promise<State> {

  const fields = {
    mealType: String(formData.get("mealType") ?? "qualsiasi"),
    ingredients: String(formData.get("ingredients") ?? ""),
  };

  //-- 1. input validation
  const validatedFields = RecipeRequestSchema.safeParse(fields);
  
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    console.log(validatedFields.error.issues);
    
    return {
      status: 'error',
      message: validatedFields.error.issues[0].message,
      ...fields
    };
  }

  //-- 2. get IP from header
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');

  /**
   * fallback value "unknown" to reject the request (in another hosting or with Docker if no reverse proxy is configured or in automatic test if action is call without a real HTTP)  
   */  
  const ip = forwardedFor 
    ? forwardedFor.split(',')[0].trim() 
    : headersList.get('x-real-ip') || 'unknown';

  // console.log('Richiesta ricevuta dall\'IP:', ip);

  if (ip === 'unknown'){
    return {
      status: 'error',
      message: `IP mancante`,
      ...fields
    };
  }

  //-- 3. rate limit per minutes check
  const { success: minuteRLsuccess, reset: minuteRLreset } = await minuteRateLimit.limit(ip);
  
  console.log(new Date().toISOString(), new Date(minuteRLreset).toISOString());
  
  if (!minuteRLsuccess) {
    // const now = Date.now();
    // const secondsLeft = Math.max(0, Math.ceil((minuteRLreset - now)/1000));
    // console.log(`secondsLeft ${secondsLeft}`);

    return {
      status: 'error',
      message: `Hai superato il limite delle richieste al minuto, riprova tra 1 minuto`,
      ...fields
    };
  }

  //-- 4. rate limit per day check
  const { success: dailyRLsuccess, reset: dailyRLreset } = await dailyRateLimit.limit(ip);

  console.log(dailyRLreset, new Date(dailyRLreset).toISOString());

  if (!dailyRLsuccess) {
    const resetTime = new Date(dailyRLreset).toLocaleTimeString("it-IT", { 
      hour: "2-digit", 
      minute: "2-digit",  
      timeZone: 'Europe/Rome' });
    // console.log(`resetTime ${resetTime}`);

    return {
      status: 'error',
      message: `Hai superato il limite delle richieste giornaliere, riprova alle ${resetTime}`,
      ...fields
    };
  }

  //-- 5. call AI to create the recipe
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
              thinkingLevel: 'high'
            }
          }
      },
      model: model,
      output: Output.object({
        schema: RecipeResponseSchema,
      }),
      system: SYSTEM_PROMPT,
      prompt: prompt,
      maxRetries: AI_MAX_RETRIES, // between one retry and the next, the AI ​​SDK automatically applies an exponential backoff (a delay that increases with each attempt) to avoid overloading the provider's API
      abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS) // the abort timeout to interrupt long waits, it covers the whole call
    });

    console.log({usage, finishReason});

    if (output.isPossible && output.recipe) {
        // recipe generated with success
      return {
          status: 'success',
          recipe: output.recipe,
          ...fields
      };

    } else {
      // all ingredients are not valid or recipe is not generated
      return {
        status: 'error',
        message: output.reason ?? 'Con questi ingredienti non riesco a creare una ricetta.',
        ...fields
      };
    }

  } catch(e){
    
    console.error(e);

    // Dopo i tentativi l'SDK lancia un RetryError: l'errore vero è in lastError
    const err = RetryError.isInstance(e) ? e.lastError : e;

    // generic error message: network outage, wrong AI model (404), not a valid key (401/403), Google overloaded (503)
    let message = 'Non sono riuscita a generare la ricetta. Riprova tra poco.';

    if (APICallError.isInstance(err) && err.statusCode === 429) { // rate limit: per minute or per day.
      message = 'Troppe richieste in questo momento. Riprova tra qualche minuto.';

    } else if (APICallError.isInstance(err) && err.statusCode === 503) {
      message = 'Il servizio AI è molto richiesto in questo momento. Riprova tra un minuto.';

    } else if (NoObjectGeneratedError.isInstance(err)) {
      console.error('NoObjectGeneratedError');
      console.error('Cause:', err.cause);
      console.error('Text:', err.text);
      console.error('Response:', err.response);
      console.error('Usage:', err.usage);
      console.error('Finish Reason:', err.finishReason);

    } else if (err instanceof Error && err.name === "TimeoutError"){
      console.error(`AI request timed out after ${AI_TIMEOUT_MS} ms`);
      message = 'Il servizio è molto lento in questo momento. Riprova tra poco.';

    } else {
      console.error('[createRecipe] errore non previsto', err);
    }

    return {
      status: 'error',
      message: message,
      ...fields
    };

  } finally {
    console.timeEnd("gemini");
  }

}