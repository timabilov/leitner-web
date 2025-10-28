import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import catpendark from './catpendark.svg';
import { useGoogleLogin, hasGrantedAllScopesGoogle } from '@react-oauth/google';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useEffect } from "react"
import { useMutation } from '@tanstack/react-query';
import { axiosInstance } from '../services/auth';
import { API_BASE_URL } from "@/services/config"
import { useUserStore } from "@/store/userStore"
import { useNavigate } from "react-router"

const clientId = "241687352985-umb35edcp1011r61tnvekch5suuu6ldk.apps.googleusercontent.com";
function Login({
  className,
  ...props
}: React.ComponentProps<"div">) {
 const setAccessToken = useUserStore(state => state.setAccessToken);
  const setRefreshToken = useUserStore(state => state.setRefreshToken);
  const setUserData = useUserStore(state => state.setUserData);
const navigate = useNavigate();



    useEffect(() => {
        console.log("--")
        googleLogout()
    }, []);


    const googleVerifyMutation = useMutation({
    mutationFn: newUser => {
      return axiosInstance.post(API_BASE_URL + '/auth/google/v2?verify=true', newUser);
    },
    onSuccess: (response, variables) => {
      console.log('Google Sign-In Success:', response.data);
      const data = response.data;
      if (data?.new) {
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        navigate('/onboarding',
      {
            idToken: variables.idToken,
            email: variables.user.email,
            name: variables.user.name,
            photo: variables.user.photo,
            finishUrl: '/auth/google/v2'
          }
        );
      } else {
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        localStorage.setItem('user-store', JSON.stringify({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        }));
        setUserData(
          data.id, data?.name, variables?.user?.email, data.company_id,
          data?.company?.subscription, data.company.name,
          data?.company?.trial_started_date && new Date(data.company.trial_started_date),
          data?.company?.trial_days, variables?.user?.photo,
          data?.company?.full_admin_access || false
        );
        navigate('/notes');
      }
    },
    onError: (error: AxiosError) => {
      console.log('Backend sign-in endpoint error:', error);
      if (error.message.toLowerCase().includes('network')) {
        alert(t('Network error, please check your connection!'));
      } else if (error.response && (error.response.data as any)?.message) {
        alert((error.response.data as any).message);
      } else {
        alert(t('An error occurred during sign-in, please try again later or reach support.'));
      }
    },
  });

  // --- THIS IS THE REPLACEMENT SIGN-IN LOGIC ---
  const signIn = async (credentialResponse) => {
    // const provider = new GoogleAuthProvider();
    const idToken = credentialResponse.credential;
    console.log("Received Google ID Token on web:", idToken, credentialResponse);
    const decodedToken = jwtDecode(idToken);

    console.log("Decoded Token Payload:", decodedToken);
    
    const userInfo = {
      id: decodedToken.sub, // 'sub' is the unique Google user ID
      name: decodedToken.name,
      email: decodedToken.email,
      photo: decodedToken.picture, // The claim is 'picture'
    };

    try {
      // 1. Trigger the Google sign-in popup window
      

      // 2. Prepare data for your backend in the same structure as before
      const backendData = {
        idToken,
        user: userInfo,
        platform: 'web',
      };
      
      // 3. Call your existing mutation with the data
        googleVerifyMutation.mutate(backendData);

    } catch (error) {
      console.error("Firebase Auth Error:", error);

      // 4. Handle specific, common authentication errors gracefully
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          console.log("Sign-in cancelled by user.");
          // No alert needed, as this was intentional.
          break;
        case 'auth/popup-blocked-by-browser':
          alert(t("Your browser blocked the sign-in popup. Please allow popups for this site and try again."));
          break;
        case 'auth/network-request-failed':
            alert(t("A network error occurred. Please check your internet connection."));
            break;
        default:
          alert(t("An unexpected error occurred during sign-in. Please try again."));
          break;
      }
    }
  };




  return (
     <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
      <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your Apple or Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <FieldGroup>
              <Field>
                <GoogleLogin shape="square" onSuccess={signIn} />
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
    </div>
    </div>
  )
}


export default Login;