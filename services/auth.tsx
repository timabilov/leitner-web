// @ts-nocheck
import axios from 'axios';
import createAuthRefreshInterceptor from 'axios-auth-refresh';

// import { refreshTokenAPI } from '../backend';
import {useUserStore} from '../store/userStore';
import { API_BASE_URL } from './config';
import { Platform } from 'react-native';


export const axiosInstance = axios.create({
  // set default headers here
});
// axiosInstance.defaults.headers.common['Authorization'] = 'test 401'
axiosInstance.defaults.timeout = 8 * 1000

// export const AuthContext = createContext({login: (token: string) => {console.log('Not implemented!')}});

// import { useSetDarkMode } from "../utils/asyncstoragespy";

// Function that will be called to refresh authorization
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

// export const AuthProvider = ({children}: any) => {
//   const [isLoading, setIsLoading] = useState(true);
//   // const [accessToken, setAccessToken] = useState(null);
//   const [onTokenRestore, setOnTokenRestore] = useState(() => {});
//   const accessToken = useGlobalStore(store => store.accessToken)
//   const setAccessToken = useGlobalStore(store => store.setAccessToken)
//   const refreshToken = useGlobalStore(store => store.accessToken)
//   const setRefreshToken = useGlobalStore(store => store.setAccessToken)
//   const login = (token: any, refreshToken: any) => {
//     // setIsLoading(true);

//     // console.log(token, 'token');
    
//     setAccessToken(token)
//   };

//   const logout = () => {
//     setIsLoading(true);
//     setAccessToken(null);
//     setRefreshToken(undefined)
//     AsyncStorage.removeItem(STORAGE_TOKEN_KEY);
//     GoogleSignin.revokeAccess();
//     GoogleSignin.signOut();
//     setIsLoading(false);
//   };
//   const verifySession = async () => {
//     try {
//       console.log('Verifying session...');
//       // await rehydrateToken();
//     } catch (e) {
//       console.log('Verify Session error ', e);
//     }
//   };

//   const registerDehydrateHook = (onTokenRestoreHook: any) => {
//     console.log(onTokenRestoreHook, 'hey guys', accessToken);
//     if (!accessToken) {
//       setOnTokenRestore(() => onTokenRestoreHook);
//       console.log('restore hook set', onTokenRestore);
//     } else {
//       console.log('Token is already set, calling token hook');
//       onTokenRestoreHook(accessToken);
//     }
//   };

//   // useEffect(() =>{
//   //     if (onTokenRestore && accessToken){
//   //         console.log('Token restore Hook Call!', onTokenRestore, accessToken)
//   //         onTokenRestore(accessToken)
//   //     }
//   // }, [onTokenRestore, accessToken])
  

//   return (
//     <AuthContext.Provider
//       value={{
//         login,
//         logout,
//         isLoading: false,
//         accessToken,
//         getToken: getAccessToken,
//         registerDehydrateHook,
//       }}>
//       {children}
//     </AuthContext.Provider>
//   )
// }



export const refreshTokenAPI = async (refresh_token: string) => {
  return axiosInstance.post(API_BASE_URL + '/auth/refresh-token', {
    refresh_token: refresh_token
  });
}
export const registerPushToken = async (token: string) => {
  return axiosInstance.post(API_BASE_URL + `/auth/register-push`, {
    token,
    'platform': Platform.OS
  });
}