// Server Actions
'use server';

export type State = {
  errors?: {};
  message?: string | null;
};

// prevState contains the state passed from the useActionState hook. You won't be using it in the action in this example, but it's a required prop.
export async function createRecipe(prevState: State, formData: FormData) {
  try {
    return {
      errors: '',
      message: '',
    };

  } catch(error){
    console.error(error);
    return {
      message: ''
    };
  }
}