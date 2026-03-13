export type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string[]>;
};

export async function createSafeAction<T>(
  action: () => Promise<T>
): Promise<ActionResponse<T>> {
  try {
    const data = await action();
    return { success: true, data };
  } catch (error: any) {
    console.error("Action Error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}
