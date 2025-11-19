import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  FieldDescription,
  FieldGroup,
} from "@/components/ui/field"
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useEffect } from "react"
import { useMutation } from '@tanstack/react-query';
import { axiosInstance } from '../services/auth';
import { API_BASE_URL } from "@/services/config"
import { useUserStore } from "@/store/userStore"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"; // Import the hook
import { AxiosError } from "axios";

function Login({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { t } = useTranslation(); // Initialize the hook
  const setAccessToken = useUserStore(state => state.setAccessToken);
  const setRefreshToken = useUserStore(state => state.setRefreshToken);
  const setUserData = useUserStore(state => state.setUserData);
  const navigate = useNavigate();

  useEffect(() => {
    googleLogout()
  }, []);

  const googleVerifyMutation = useMutation({
    mutationFn: (newUser: any) => {
      return axiosInstance.post(API_BASE_URL + '/auth/google/v2?verify=true', newUser);
    },
    onSuccess: (response, variables) => {
      const data = response.data;
      if (data?.new) {
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        navigate('/onboarding', {
          state: {
            idToken: variables.idToken,
            email: variables.user.email,
            name: variables.user.name,
            photo: variables.user.photo,
            finishUrl: '/auth/google/v2'
          }
        });
      } else {
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        localStorage.setItem('user-store', JSON.stringify({
          state: {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
          }
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

  const signIn = async (credentialResponse) => {
    const idToken = credentialResponse.credential;
    const decodedToken: any = jwtDecode(idToken);

    const userInfo = {
      id: decodedToken.sub,
      name: decodedToken.name,
      email: decodedToken.email,
      photo: decodedToken.picture,
    };

    try {
      const backendData = {
        idToken,
        user: userInfo,
        platform: 'web',
      };
      googleVerifyMutation.mutate(backendData);
    } catch (error: any) {
      console.error("Authentication Error:", error);
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          console.log("Sign-in cancelled by user.");
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
              <CardTitle className="text-xl">{t("Welcome back")}</CardTitle>
              <CardDescription>
                {t("Login with your Apple or Google account")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form>
                <FieldGroup>
                    <GoogleLogin shape="square" onSuccess={signIn} />
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
          <FieldDescription className="px-6 text-center">
            {t("By clicking continue, you agree to our")} <a href="#">{t("Terms of Service")}</a>{" "}
            {t("and")} <a href="#">{t("Privacy Policy")}</a>.
          </FieldDescription>
        </div>
      </div>
    </div>
  )
}

export default Login;