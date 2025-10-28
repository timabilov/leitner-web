import axios from 'axios';
import createAuthRefreshInterceptor from 'axios-auth-refresh';
import { API_BASE_URL } from './config';
import { useUserStore } from '@/store/userStore';

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

export const wait = ms => new Promise(r => setTimeout(r, ms));

export const retryOperation = async (operation, delay, retries) =>{
  return await new Promise((resolve, reject) => {
    return operation()
      .then(resolve)
      .catch(reason => {
        console.log(
          'Task failed retries left: ',
          retries,
          ' reason: ' + reason,
        );
        if (retries > 0) {
          return wait(delay)
            .then(retryOperation.bind(null, operation, delay, retries - 1))
            .then(resolve)
            .catch(reject);
        }
        return reject(reason);
      });
  });
}
  


export const uploadToCFFromPath = async (
    note_id: string,
    imagePutUrl: string, // Changed `any` to `string` for clarity
    defaultMimeType: string, // Changed `any` to `string`
    imagePath: string, // Changed `any` to `string`
  ) => {
    // Normalize file path (Expo usually handles file:// correctly, but we ensure compatibility)
    const platformPath = imagePath;
    console.log('Platform from to upload:', platformPath);
    // Get file metadata (size)
    let size: number | undefined;
    try {
      const fileInfo = imagePath
      if (!fileInfo) {
        throw new Error('File does not exist or is a directory');
      }
      size = fileInfo.size;
    } catch (err) {
      console.warn('Error getting file info:', err);
      // Sentry.captureException(err, {
      //   extra: {
      //     image_path: platformPath,
      //     note_id: note_id
      //   },
      // });
      console.warn('File probably does not exist:', platformPath);
      throw err;
    }
  
    // Determine MIME type
    const mimeType = mime.default.getType(platformPath) || defaultMimeType;
  
    // Perform the upload with retry logic
    try {
      const response = await retryOperation(
        async () => {
          // Read file as a blob-like structure (Expo file URI can be used directly with fetch)
          const response = await fetch(imagePutUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': mimeType,
            },
            body: {
              uri: imagePath, // Expo fetch handles file:// URIs correctly
              type: mimeType,
              name: imagePath.split('/').pop() || 'file', // Extract filename
            },
          });
  
          if (!response.ok) {
            throw new Error(
              `Upload failed with status ${response.status}: ${await response.text()}`,
            );
          }
  
          return response;
        },
        1500,
        3,
      );
  
      // Handle success
      console.log(
        'File uploaded successfully!',
        note_id,
        platformPath,
        ((size || 0) / 1024).toFixed(2) + ' KB',
      );
      // Optionally invalidate queries or update cache
      // queryClient.invalidateQueries(['products-list']);
  
      return response;
    } catch (error: any) {
      console.warn('Error on file upload:', error, platformPath);
      // Sentry.captureException(error, {
      //   extra: {
      //     image_path: platformPath,
      //     note_id: note_id,
      //   },
      // });
      throw error;
    }
  };