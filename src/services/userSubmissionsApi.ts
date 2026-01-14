/**
 * User Submissions API Service
 * POST /api/v1/user-submissions
 */

import { UserSubmittedEntry } from '../types/search.types';

const API_BASE_URL = 'http://localhost:3001/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Submit user entry for admin review
 * POST /api/v1/user-submissions
 */
export async function submitUserEntry(
  entry: Omit<UserSubmittedEntry, 'id' | 'timestamp' | 'status'>
): Promise<{ id: string; status: string; message: string }> {
  const response = await apiCall<{ id: string; status: string; message: string }>(
    '/user-submissions',
    {
      method: 'POST',
      body: JSON.stringify({
        fieldType: entry.fieldType,
        enteredValue: entry.enteredValue,
        context: entry.context,
        userId: entry.userId,
        sessionId: entry.sessionId,
      }),
    }
  );

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || 'Submission failed');
}

export const userSubmissionsApi = {
  submit: submitUserEntry,
};

