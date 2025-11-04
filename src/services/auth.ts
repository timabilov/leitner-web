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
  fileToUpload, // Changed from filePath to a more descriptive name
  fileName,
  file
) => {
  if (!fileToUpload) {
    throw new Error('A File or Blob object is required for upload.');
  }

  // Use the Blob's size property. This works for both Blobs and Files.
  const size = fileToUpload.size;
  const mimeType = fileToUpload.type || 'application/zip'; // Get type from blob, fallback to zip

  try {
    const responseFile = await axiosInstance.get(fileToUpload, {
      // --- THIS IS THE CRITICAL FIX ---
      // Tell Axios to expect binary data, not JSON.
      responseType: 'blob',
    });

    // With responseType: 'blob', response.data IS the Blob object itself.

    const response = await retryOperation(
      async () => {
        // --- THIS IS THE CORE FIX ---
        // Axios's second argument is the request body. We pass the Blob/File directly.
        // The third argument is the config object.
        const uploadResponse = await axiosInstance.put(putUrl, responseFile.data, {
          headers: {
            // This is critical. We explicitly set the Content-Type.
            // This header object will override any default headers (like Authorization)
            // from your global axiosInstance, which is required for pre-signed URLs.
            'Content-Type': mimeType,
          },
        });

        // Axios throws an error on non-2xx status codes automatically,
        // which works perfectly with our retryOperation.
        return uploadResponse;
      },
      1500, // 1.5 second delay
      3     // 3 retries
    );

    console.log(
      `File "${fileName}" uploaded successfully for note ${note_id}!`,
      `Size: ${(size / 1024).toFixed(2)} KB`
    );

    return response;
  } catch (error) {
    const errorMessage = error.response ? `Status ${error.response.status}` : error.message;
    console.error(
      `Final error after retries for file "${fileName}" on note ${note_id}:`,
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
export const createZip = async (attachments, noteText, sentryContext = {}) => {
  // 1. Check for content (same as before)
  if (attachments.length === 0 && !noteText?.trim()) {
    toast.error('No Content', {
      description: 'Please add text or attachments to create a note.',
    });
    return null;
  }

  // 2. Initialize JSZip
  const zip = new JSZip();

  try {
    // 3. Handle the note text
    // Instead of writing to a file system, we create a Blob in memory.
    if (noteText?.trim()) {
      const textBlob = new Blob([noteText.trim()], { type: 'text/plain' });
      zip.file('note.txt', textBlob);
    }

    // 4. Handle attachments
    // We assume `attachments` is an array of File objects.
    // The File object itself contains the data and name.
    attachments.forEach((file) => {
      // The first argument is the filename, the second is the file data.
      zip.file(file.name, file);
    });

    // 5. Generate the zip file as a Blob
    // This happens asynchronously in memory.
    const zipBlob = await zip.generateAsync({ type: 'blob' });
     // Create the temporary, in-memory path (Object URL) for the Blob
    // const zipPath = URL.createObjectURL(zipBlob);

    const zipFileName = `my-archive_${Date.now()}.zip`;
      const zipFile = new File([zipBlob], zipFileName, {
        type: "application/zip"
      });
      console.log("Created File object with name:", zipFile);

      // Create a temporary URL for the download link
      const downloadUrl = URL.createObjectURL(zipFile);


  return { zipBlob, zipPath: downloadUrl, zipFileName,  zipFile };

  } catch (error) {
    console.error('Error creating zip:', error);
    toast.error('Error', {
      description: 'Failed to create the zip file.',
    });
    // Sentry reporting remains the same
    // Sentry.captureException(error, { extra: sentryContext });
    return null;
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
