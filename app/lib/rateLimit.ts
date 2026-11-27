import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const redis = Redis.fromEnv();

/**
 * limiter: deve essere abbastanza alto da non bloccare mai una persona vera
 * e abbastanza basso da non far finire i limiti del piano AI a chi abusa.
 * prefix: optional prefix for the keys used in redis, useful if you want to share a redis
 * instance with other app and want to avoid key collisions
 */

// Create a new ratelimiter per IP that allows 3 requests per 60 seconds
/** 
 * Per IP Gemini 3.1 Flash Lite permette 15 RPM (richieste al minuto) per l'intero progetto.
 * Con maxRetries: 1 una richiesta può costare fino a 2 chiamate al modello: 3 × 2 = 6 per IP,
 * quindi due IP alla volta stanno sotto le 15 e un ufficio di 3 colleghi riesce a farcela.
 * 
 * Sliding window: blocca le chiamate a raffica a cavallo tra un minuto e l'altro (fixedWindow ne consentirebbe invece 6 in un secondo)
 */
export const minuteRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "60 s"),
  prefix: "recipe-finder:minute",
});

// Create a new ratelimiter per IP that allows 20 requests per day
/** 
 * Per IP Gemini 3.1 Flash Lite permette 500 RPD (richieste al giorno) per l'intero progetto.
 * Con maxRetries: 1 una richiesta può costare fino a 2 chiamate al modello: 3 × 2 = 6 per IP,
 * 20 × 2 = 40 chiamate per IP nello scenario peggiore: sono necessari circa 12 IP contemporaneamente per esaurire la quota,
 * mentre un utilizzo lecito (anche da parte di un piccolo ufficio) rimane ben al di sotto di tale limite.
 * 
 * Fixed window: si azzera a mezzanotte UTC (l'indicazione "riprova alle HH:MM" è precisa) 
 * e l'eventuale picco di richieste in corrispondenza del cambio di finestra è comunque limitato dal tetto massimo previsto per minuto
 */
export const dailyRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(20, "24 h"),
  prefix: "recipe-finder:daily",
});

