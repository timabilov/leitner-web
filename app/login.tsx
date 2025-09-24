import React, { useEffect, useState } from 'react';

// ADD: Imports from Firebase for authentication
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { fbAuth } from '../services/firebase'; // Import your initialized auth instance

// REMOVE: Imports from @react-native-google-signin are no longer needed for web
// import { GoogleSignin, ... } from '@react-native-google-signin/google-signin';

import { useRouter } from 'expo-router';
import { useMutation } from 'react-query';
import { axiosInstance } from '../services/auth';
import { API_BASE_URL } from '../services/config';
import { useUserStore } from '../store/userStore';
import { lightTheme, darkTheme } from '../styles/theme';
import { useTranslation } from 'react-i18next';
import { AxiosError } from 'axios';

// SVG imports
import CatPetDarkSVG from '../assets/svgs/catpendark.svg';
import CatPetLightSVG from '../assets/svgs/catpenlight.svg';
import SignInMicDark from '../assets/svgs/signinmicdark.svg';
import SignInMicLight from '../assets/svgs/signinmiclight.svg';
import SignInPdfAIDark from '../assets/svgs/signinpdfaidark.svg';
import SignInPdfAILight from '../assets/svgs/signinpdfailight.svg';
import SignInPenAIDark from '../assets/svgs/signinpenaidark.svg';
import SignInPenAILight from '../assets/svgs/signinpenailight.svg';
import GoogleIconSign from '../assets/svgs/devicon_google.svg';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode'; // <-- IMPORT THE DECODER


interface GoogleTokenPayload {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  nbf: number;
  name: string;
  picture: string; // <-- Google calls it 'picture', not 'photoURL'
  given_name: string;
  family_name: string;
  iat: number;
  exp: number;
  jti: string;
}


const LoginScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const setAccessToken = useUserStore(state => state.setAccessToken);
  const setRefreshToken = useUserStore(state => state.setRefreshToken);
  const setUserData = useUserStore(state => state.setUserData);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Carousel state and effects (No changes here)
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState('fade-in');
  const taglines = [
    { text: t("Record, edit and learn smart"), icon: "✨" },
    { text: t("Create quizzes from your notes"), icon: "✨" },
    { text: t("Flashcards for better memory"), icon: "✨" },
  ];

  // System theme detection (No changes here)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Carousel animation (No changes here)
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeClass('fade-out');
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % taglines.length);
        setDisplayIndex((prev) => (prev + 1) % taglines.length);
        setFadeClass('fade-in');
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, [taglines.length]);

  // Your backend mutation (No changes here, it works perfectly with the new data)
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
        router.push({
          pathname: '/onboarding',
          params: {
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
        router.push('/notes');
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
    const decodedToken = jwtDecode<GoogleTokenPayload>(idToken);

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


  // --- YOUR JSX REMAINS EXACTLY THE SAME ---
  return (
    <div className="container" style={{ backgroundColor: theme.colors.background }}>
      <div className="content">
        <h1 className="title" style={{ color: theme.colors.onBackground }}>
          {t("Leitner AI")}
        </h1>
        <div className="illustration">
          {isDarkMode ? (
            <CatPetDarkSVG width={120} height={120} />
          ) : (
            <CatPetLightSVG width={120} height={120} />
          )}
        </div>
        <div className="icons-container">
          <div className="first-row">
            <div className="icon">
              {isDarkMode ? (
                <SignInMicDark width={36} height={36} />
              ) : (
                <SignInMicLight width={36} height={36} />
              )}
            </div>
            <div className="icon">
              {isDarkMode ? (
                <SignInPdfAIDark width={36} height={36} />
              ) : (
                <SignInPdfAILight width={36} height={36} />
              )}
            </div>
          </div>
          <div className="second-row">
            <div className="icon">
              {isDarkMode ? (
                <SignInPenAIDark width={36} height={36} />
              ) : (
                <SignInPenAILight width={36} height={36} />
              )}
            </div>
          </div>
        </div>
        <div className="tagline-container">
          <div className={`tagline-wrapper ${fadeClass}`}>
            <p className="tagline" style={{ color: theme.colors.onBackground }}>
              {taglines[displayIndex].text} {taglines[displayIndex].icon}
            </p>
          </div>
          <div className="dots-container">
            {taglines.map((_, index) => (
              <div
                key={index}
                className="dot"
                style={{ backgroundColor: index === activeIndex ? theme.colors.primary : theme.colors.elevation.level3 }}
              />
            ))}
          </div>
        </div>
        <div className="button-container">
          <GoogleLogin
          onSuccess={signIn}
          onError={signIn}
        />
        </div>
        <div className="links-container">
          <a
            href="https://leitnerify.ai/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="link-text"
            style={{ color: theme.colors.primary }}
          >
            {t("Privacy Policy")}
          </a>
          <span className="link-separator" style={{ color: theme.colors.onBackground }}>•</span>
          <a
            href="https://leitnerify.ai/terms-of-use"
            target="_blank"
            rel="noopener noreferrer"
            className="link-text"
            style={{ color: theme.colors.primary }}
          >
            {t("Terms of Use")}
          </a>
        </div>
      </div>
      <style jsx>{`
        /* All your styles from the original component go here */
        /* ... no changes needed ... */
        .container { min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .content { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 24px; max-width: 400px; width: 100%; }
        .title { font-family: 'PassionOne-Regular', serif; font-size: clamp(28px, 8vw, 38px); margin-bottom: 20px; text-align: center; font-weight: bold; }
        .illustration { margin-bottom: 20px; animation: float 3s ease-in-out infinite; display: flex; justify-content: center; align-items: center; }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        .icons-container { display: flex; flex-direction: column; align-items: center; margin-bottom: 40px; width: 100%; }
        .first-row { display: flex; justify-content: space-between; gap: 60px; margin-bottom: 20px; }
        .second-row { display: flex; justify-content: center; }
        .icon { font-size: 36px; animation: bounce 2s ease-in-out infinite; }
        .icon:nth-child(1) { animation-delay: 0s; } .icon:nth-child(2) { animation-delay: 0.5s; } .second-row .icon { animation-delay: 1s; }
        @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-10px); } 60% { transform: translateY(-5px); } }
        .tagline-container { margin-bottom: 20px; width: 75%; text-align: center; }
        .tagline-wrapper { margin-bottom: 10px; transition: opacity 0.3s ease, transform 0.3s ease; }
        .tagline-wrapper.fade-in { opacity: 1; transform: translateX(0); } .tagline-wrapper.fade-out { opacity: 0; transform: translateX(20px); }
        .tagline { font-size: 20px; font-weight: bold; margin: 0; letter-spacing: -0.5px; }
        .dots-container { display: flex; justify-content: center; gap: 4px; margin-top: 8px; }
        .dot { width: 6px; height: 6px; border-radius: 50%; transition: background-color 0.3s ease; }
        .button-container { width: 100%; margin-bottom: 20px; }
        .google-button { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; padding: 15px 24px; border: none; border-radius: 12px; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.2s ease; }
        .google-icon { flex-shrink: 0; }
        .google-button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
        .google-button:disabled { cursor: not-allowed; opacity: 0.7; }
        .spinner { font-size: 16px; animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .links-container { display: flex; align-items: center; gap: 16px; margin-top: 24px; }
        .link-text { font-size: 14px; font-weight: 500; text-decoration: none; letter-spacing: -0.5px; transition: opacity 0.2s ease; }
        .link-text:hover { opacity: 0.7; } .link-separator { font-size: 14px; font-weight: bold; }
        @media (max-width: 480px) { .content { padding: 0 16px; } .illustration { font-size: 80px; } .first-row { gap: 40px; } .icon { font-size: 28px; } .tagline { font-size: 18px; } }
      `}</style>
    </div>
  );
};

export default LoginScreen;