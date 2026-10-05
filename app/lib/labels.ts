import { 
    MealType
 } from '@/app/lib/schemas';

// Tabella di corrispondenza per le etichette
export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  antipasto: 'Antipasto',
  primo: 'Primo',
  secondo: 'Secondo',
  piatto_unico: 'Piatto unico',
  contorno: 'Contorno',
  dolce: 'Dolce',

};