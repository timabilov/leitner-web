import { API_BASE_URL } from "@/services/config";
import { useUserStore } from "@/store/userStore";
import { refreshTokenAPI } from "@/services/auth"; // Import your existing API call

interface StreamOptions {
  url: string;
  body: any;
  signal?: AbortSignal;
  onData: (event: string, data: any) => void;
  onError: (error: any) => void;
  onDone: () => void;
}

/**
 * A wrapper around fetch that mimics Axios Interceptors for Authentication
 * and handles SSE streaming parsing.
 */
export const streamWithAuth = async ({ url, body, signal, onData, onError, onDone }: StreamOptions) => {
  let token = useUserStore.getState().accessToken;

  // Helper to make the actual fetch request
  const makeRequest = async (tokenOverride?: string) => {
    const activeToken = tokenOverride || token;
    
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${activeToken}`,
      },
      body: JSON.stringify(body),
      signal,
    });
  };

  try {
    let response = await makeRequest();

    // --- AUTH REFRESH LOGIC (Mimicking your Axios Interceptor) ---
    if (response.status === 401) {
      console.log("Stream 401, attempting refresh...");
      const refreshToken = useUserStore.getState().refreshToken;
      
      if (!refreshToken) throw new Error("No refresh token available");

      try {
        // 1. Call your existing axios-based refresh API
        // Note: We use the raw response to avoid circular axios interceptor issues if possible, 
        // but calling the exported wrapper is fine too.
        const refreshResponse = await refreshTokenAPI(refreshToken);
        
        // 2. Hydrate Store (Update Zustand)
        const { access_token, refresh_token } = refreshResponse.data;
        useUserStore.getState().setAccessToken(access_token);
        useUserStore.getState().setRefreshToken(refresh_token);
        
        // 3. Retry the original request with new token
        response = await makeRequest(access_token);
        
      } catch (refreshErr) {
        useUserStore.getState().logout(); // Optional: Clear state if refresh fails
        throw new Error("Session expired. Please log in again.");
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    if (!response.body) throw new Error("ReadableStream not supported");

    // --- STREAM PARSING LOGIC ---
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // Split by double newline (SSE standard delimiter)
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || ""; // Keep incomplete chunk

      for (const part of parts) {
        const lines = part.split("\n");
        let eventType = "message"; // Default event
        let jsonData = null;

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.substring(7).trim();
          } else if (line.startsWith("data: ")) {
            try {
              jsonData = JSON.parse(line.substring(6));
            } catch (e) {
              console.warn("Non-JSON data received:", line);
            }
          }
        }

        if (jsonData) {
            onData(eventType, jsonData);
        }
      }
    }

    onDone();

  } catch (err: any) {
    if (err.name === 'AbortError') {
      // User stopped generation, ignore
    } else {
      onError(err);
    }
  }
};