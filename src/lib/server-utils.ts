import { z } from 'zod';

export type ServerActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

 
export async function withErrorHandling<T>(
  action: () => Promise<T>,
  context: string
): Promise<ServerActionResult<T>> {
  try {
    const result = await action();
    return { success: true, data: result };
  } catch (error: any) {
     
    if (error?.digest?.startsWith('NEXT_REDIRECT') || error?.digest === 'NEXT_NOT_FOUND') {
      throw error;
    }

     
    console.error(`[Server Action Error] ${context}:`, error);

     
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: error.flatten().fieldErrors as Record<string, string[]>
      };
    }

     
    const isProduction = process.env.NODE_ENV === 'production';
    const message = isProduction ? "An unexpected error occurred. Please try again later." : error.message;

    return {
      success: false,
      error: message
    };
  }
}
