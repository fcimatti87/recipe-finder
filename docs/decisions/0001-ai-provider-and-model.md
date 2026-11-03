# 0001 — Provider e modello AI
- **Data:** 06/10/2026
- **Stato:** , aggiornata il 03/11/2026 (vedi sotto)
- **Issue:** #7 Generare ricette con l'AI SDK

## Contesto
Recipe Finder deve trasformare ingredienti e tipo di pasto in una ricetta che rispetti `RecipeSchema`. Serve quindi un modello che supporti l'output strutturato.

L'app usa il Vercel AI SDK v7, che funziona con più provider. È un MVP per il portfolio: poco traffico, molte prove durante lo sviluppo, nessun budget.

## Decisione
- **Provider:** Google Gemini, tramite `@ai-sdk/google`
- **Modello:** `gemini-3.8-flash` (versione stabile)
- **Livello:** gratuito, senza fatturazione attiva

## Perché
1. **È gratuito:** nessuna carta di credito, nessun costo per prove e demo.
2. **Supporta l'output strutturato:** l'SDK usa `RecipeSchema` per chiedere la ricetta nel formato giusto e per validarla.
3. **È stabile:** un modello Preview può cambiare o sparire senza preavviso.
4. **Flash basta:** per una ricetta un modello Pro non darebbe risultati visibilmente migliori.
5. **È facile da cambiare:** il nome del modello sta in una sola costante (`MODEL_ID`) e cambiare provider richiede poche righe.

## Alternative scartate
- **OpenAI e Claude:** nessun livello gratuito. Il costo sarebbe bassissimo (circa un terzo di centesimo a ricetta), ma serve una carta.
- **Altre versioni Flash (3.5, 3.6, 3.7):** qualità simile, ma i modelli più vecchi vengono ritirati prima.

## Cosa comporta
- **Dati:** sul livello gratuito Google può usare richieste e risposte per migliorare i suoi prodotti. Va bene per liste di ingredienti, non per dati personali.
- **Limiti:** se si superano, l'API risponde con un errore 429. Gestito con un messaggio dedicato (issue #8).
- **Tempi di risposta:** il modello "ragiona" prima di rispondere, quindi può servire qualche secondo. Lo stato di attesa del bottone copre questo caso.
- **Chiave:** sta in `.env.local` (ignorato da Git) e nelle variabili d'ambiente di Vercel. Mai nel codice.

## Quando riconsiderarla
- Se i limiti gratuiti bloccano sviluppo o demo.
- Se il modello viene ritirato o esce dal livello gratuito.
- Se l'app dovrà gestire dati personali.
- Se le ricette generate non sono abbastanza buone.

## Aggiornamento 03/11/2026: passaggio a Flash-Lite
**Cosa è successo:** sul livello gratuito `gemini-3.8-flash` ha risposto per giorni con errori 503 (modello sovraccarico) o oltre il timeout di 45 secondi. 
In produzione non generava quasi nessuna ricetta.

**Nuova decisione:** in produzione uso `gemini-3.5-flash-lite`, gratuito, rapido e disponibile.

**Compromesso:** con il prompt iniziale le ricette di Flash-Lite erano povere (solo gli ingredienti indicati, niente uova né lievito nei dolci). 
Rendendo il prompt più esplicito (ingredienti da dispensa, ricette realistiche, unità di misura, tempo di preparazione) la qualità è diventata accettabile.

**Prossimo passo:** fallback, cioè provare prima `gemini-3.8-flash` e, in caso di 503, `gemini-3.5-flash-lite`.