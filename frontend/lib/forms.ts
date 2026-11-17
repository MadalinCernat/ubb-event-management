// Shared shape returned by form server actions and consumed by useActionState.
export interface FormState {
  // One or more human-readable error messages (e.g. backend validation list).
  messages?: string[];
  // Submitted values, echoed back so the form can repopulate after an error.
  values?: Record<string, string>;
}

export const emptyFormState: FormState = {};
