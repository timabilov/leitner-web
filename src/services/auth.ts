import axios from 'axios';
import createAuthRefreshInterceptor from 'axios-auth-refresh';
import { API_BASE_URL } from './config';
import { useUserStore } from '@/store/userStore';
import JSZip from 'jszip';
import { toast } from 'sonner'; // Or your preferred toast library
export const axiosInstance = axios.create({
  // set default headers here
});

axiosInstance.defaults.timeout = 8 * 1000;


const refreshAuthLogic = (failedRequest: any) =>
    {

      const refreshToken = useUserStore.getState().refreshToken
      if (!refreshToken){
        
      }
      console.log('Refresh token..', refreshToken)
      return refreshTokenAPI(refreshToken).then(async tokenRefreshResponse => {
        await useUserStore.persist.rehydrate()
        const setRefreshToken = useUserStore.getState().setRefreshToken
        const setAccessToken = useUserStore.getState().setAccessToken
        setRefreshToken(tokenRefreshResponse.data.refresh_token)
        setAccessToken(tokenRefreshResponse.data.access_token)
        // AsyncStorage.setItem(STORAGE_TOKEN_KEY, tokenRefreshResponse.data.token);
        failedRequest.response.config.headers.Authorization =
          'Bearer ' + tokenRefreshResponse.data.access_token;
        return Promise.resolve();
      }).catch((error) => {
        console.log("Refresh token failed!")
        console.log(error)
      });
    }

// Instantiate the interceptor
createAuthRefreshInterceptor(axiosInstance, refreshAuthLogic, {
  statusCodes: [401],
  pauseInstanceWhileRefreshing: true,
});
// Use interceptor to inject the token to requests
axiosInstance.interceptors.request.use(async request => {
  await useUserStore.persist.rehydrate()
  const token = useUserStore.getState().accessToken
  console.log('Request: ', request.url, 'tk: ', token?.slice(0, 20));
  // console.log('Request: ', request.url);

  request.headers.Authorization = `Bearer ${token}`;
  return request;
});



export const refreshTokenAPI = async (refresh_token: string) => {
  return axiosInstance.post(API_BASE_URL + '/auth/refresh-token', {
    refresh_token: refresh_token
  });
}
export const registerPushToken = async (token: string) => {
  return axiosInstance.post(API_BASE_URL + `/auth/register-push`, {
    token,
    'platform': 'web'
  });
} 

/*
 * [WEB VERSION] Uploads a File object to a pre-signed PUT URL.
 * Replaces `uploadToCFFromPath`.
 * 
 * @param {string} note_id - The ID of the note for logging/context.
 * @param {string} putUrl - The pre-signed URL to upload the file to.
 * @param {File} file - The File object from a browser input.
 * @param {string} [defaultMimeType='application/octet-stream'] - A fallback MIME type.
 * @returns {Promise<Response>} The response from the fetch call.
 */
export const uploadFileToCF = async (
  note_id,
  putUrl,
  file, // Changed from filePath to a more descriptive name
) => {
  if (!file) {
    throw new Error('A File or Blob object is required for upload.');
  }

  // Use the Blob's size property. This works for both Blobs and Files.
  const mimeType =  'application/zip'; // Get type from blob, fallback to zip

  try {
   

    const response = await retryOperation(
      async () => {
        // --- THIS IS THE CORE FIX ---
        // Axios's second argument is the request body. We pass the Blob/File directly.
        // The third argument is the config object.
        const uploadResponse = await axiosInstance.put(putUrl, file, {
          headers: {
            // This is critical. We explicitly set the Content-Type.
            // This header object will override any default headers (like Authorization)
            // from your global axiosInstance, which is required for pre-signed URLs.
            'Content-Type': mimeType
          },
           withCredentials: false,
          transformRequest: [(data, headers) => {
            // Remove any default headers that might interfere, especially Content-Encoding
            delete headers['Content-Encoding'];
            return data;
          }],
        });

        // Axios throws an error on non-2xx status codes automatically,
        // which works perfectly with our retryOperation.
        return uploadResponse;
      },
      1500, // 1.5 second delay
      3     // 3 retries
    );

    console.log(
      `File uploaded successfully for note ${note_id}!`,
      //`Size: ${(size / 1024).toFixed(2)} KB`
    );

    return response;
  } catch (error) {
    const errorMessage = error.response ? `Status ${error.response.status}` : error.message;
    console.error(
      `Final error after retries for file "${file}" on note ${note_id}:`,
      errorMessage,
      error
    );
    throw error;
  }
};


  

  /**
 * Creates a zip file in the browser's memory from text and file attachments.
 * 
 * @param {File[]} attachments - An array of File objects.
 * @param {string} noteText - The text content of the note.
 * @param {object} sentryContext - Optional context for Sentry error reporting.
 * @returns {Promise<Blob | null>} A promise that resolves with the zip file as a Blob, or null on failure.
 */
export const createZip = async (attachments, noteText) => {
  // --- Part 1: Create Zip Data (Equivalent to Python's zipfile + BytesIO) ---
  
  if (attachments.length === 0 && !noteText?.trim()) {
    toast.error('No Content', { description: 'Please add text or attachments.' });
    return false;
  }

  const zip = new JSZip();
  
  try {
    // Add note text if it exists
    if (noteText?.trim()) {
      zip.file("note.txt", noteText.trim());
    }

    // Add attachments
    attachments.forEach((file) => {
      zip.file(file.name, file);
    });

    // Generate the raw binary data of the zip file.
    // This `zipBlob` is the direct JS equivalent of Python's `zip_content`.
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    console.log(`JS: In-memory zip created. Size: ${zipBlob.size} bytes`);

    // --- Part 2: Upload the Data (Equivalent to Python's requests.put) ---

    console.log("JS: Preparing to send PUT request to pre-signed URL...");

    // This is the direct JS equivalent of Python's `requests.put(url, data=zip_content, headers=...)`

    console.log("JS: Upload successful!");
    toast.success("Note uploaded successfully!");
    return zip

  } catch (error) {
    console.error("JS: An error occurred during the create/upload process:", error);
    
    // Provide a more helpful error message for the user
    if (error.code === "ERR_NETWORK") {
        toast.error("Upload Failed: CORS Error", {
            description: "The storage server is not configured to accept uploads from this website. This is a server-side CORS issue.",
        });
    } else {
        toast.error("Upload Failed", { description: error.message });
    }
    
    return false;
  }
};



/* A simple promise-based wait function.
 * @param {number} delay - The time to wait in milliseconds.
 * @returns {Promise<void>}
 */
const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));


/*
 * Retries a promise-based operation a specified number of times with a delay.
 * @param {() => Promise<any>} operation - The async function to run.
 * @param {number} delay - The delay between retries in milliseconds.
 * @param {number} retries - The number of remaining retries.
 * @returns {Promise<any>}
 */
export const retryOperation = async (operation, delay, retries) => {
  try {
    const result = await operation();
    return result;
  } catch (error) {
    // Axios provides more detailed error messages, which is helpful here
    const errorMessage = error.response ? `Status ${error.response.status}: ${error.response.data}` : error.message;
    console.log(
      `Task failed. Retries left: ${retries}. Reason: ${errorMessage}`
    );
    if (retries > 0) {
      await wait(delay);
      return retryOperation(operation, delay, retries - 1);
    } else {
      throw error;
    }
  }
};
