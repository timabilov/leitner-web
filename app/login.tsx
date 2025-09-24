import React, { useEffect, useState } from 'react';
import {
  GoogleSignin,
  isErrorWithCode,
  isNoSavedCredentialFoundResponse,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { useMutation } from 'react-query';
import { axiosInstance } from '../services/auth';
import { API_BASE_URL } from '../services/config';
import { useUserStore } from '../store/userStore';
import { lightTheme, darkTheme } from '../styles/theme';
import { useTranslation } from 'react-i18next';
import { AxiosError } from 'axios';

// Configure Google Sign-In for web
// GoogleSignin.configure({
//   webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
//   offlineAccess: true,
// });
import { fbAuth } from '../services/firebase'; // Import your initialized auth instance


const LoginScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [googleInfo, setGoogleInfo] = useState(null);
  const setAccessToken = useUserStore(state => state.setAccessToken);
  const setRefreshToken = useUserStore(state => state.setRefreshToken);
  const setUserData = useUserStore(state => state.setUserData);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Carousel state
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState('fade-in');

  const taglines = [
    {
      text: t("Record, edit and learn smart"),
      icon: "✨",
    },
    {
      text: t("Create quizzes from your notes"),
      icon: "✨",
    },
    {
      text: t("Flashcards for better memory"),
      icon: "✨",
    },
  ];

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Carousel animation
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

  const googleVerifyMutation = useMutation({
    mutationFn: newUser => {
      return axiosInstance.post(API_BASE_URL + '/auth/google/v2?verify=true', newUser);
    },
    onSuccess: (response, variables, context) => {
      console.log('Google Sign-In Success:', response.data);
      const data = response.data;

      if (data?.new) {
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        
        if (data?.was_invited == false) {
          // new user redirecting to finish sign up 
        }
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
        console.log("Logging in with id:", data?.id, data?.company_id);
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        
        // Use localStorage instead of mmkv for web
        localStorage.setItem('user-store', JSON.stringify({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        }));
        
        setUserData(
          data.id,
          data?.name,
          variables?.user?.email,
          data.company_id,
          data?.company?.subscription,
          data.company.name,
          data?.company?.trial_started_date && new Date(data.company.trial_started_date),
          data?.company?.trial_days,
          variables?.user?.photo,
          data?.company?.full_admin_access || false
        );
        router.push('/notes');
      }
    },
    onError: (error: AxiosError, variables, context) => {
      console.log('Sign in endpoint error:', error);
      if (error.message.toLowerCase().includes('network')) {
        alert(t('Network error, please check your connection!'));
      } else if (error.message.toLowerCase().includes('timeout')) {
        alert(t('Request timed out, please try again later.'));
      } else if (error.response && (error.response.data as any)?.message) {
        alert((error.response.data as any).message);
      } else {
        alert(t('An error occurred during sign-in, please try again later or reach to support@skripe.com'));
      }
    },
  });

  const signIn = async () => {
    try {
      console.log('Signing in with Google...');
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        console.log(response.data);
        setGoogleInfo(response.data);
        googleVerifyMutation.mutate({
          ...response.data,
          platform: 'web',
        });
      } else if (isNoSavedCredentialFoundResponse(response)) {
        console.log('No saved credential found');
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            console.log('User cancelled the sign-in flow');
            break;
          case statusCodes.IN_PROGRESS:
            console.log('Sign-in in progress');
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            console.log('Play services not available');
            break;
          default:
            alert('An error occurred during sign-in');
        }
      } else {
        alert('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="container" style={{ backgroundColor: theme.colors.background }}>
      <div className="content">
        {/* App Title */}
        <h1 className="title" style={{ color: theme.colors.onBackground }}>
          {t("Leitner AI")}
        </h1>
        
        {/* Cat Illustration - placeholder for now */}
        <div className="illustration">
          🐱
        </div>

        {/* Icons Row */}
        <div className="icons-container">
          <div className="first-row">
            <div className="icon">🎤</div>
            <div className="icon">📄</div>
          </div>
          <div className="second-row">
            <div className="icon">✏️</div>
          </div>
        </div>

        {/* Tagline with Carousel */}
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
                style={{
                  backgroundColor:
                    index === activeIndex
                      ? theme.colors.primary
                      : theme.colors.elevation.level3,
                }}
              />
            ))}
          </div>
        </div>

        {/* Google Sign-In Button */}
        <div className="button-container">
          <button
            className="google-button"
            style={{ 
              backgroundColor: googleVerifyMutation.isLoading ? theme.colors.elevation.level5 : theme.colors.primary,
              color: theme.colors.onPrimary
            }}
            onClick={() => {
              console.log('Button clicked!');
              signIn();
            }}
            disabled={googleVerifyMutation.isLoading}
          >
            {googleVerifyMutation.isLoading && (
              <div className="spinner">⏳</div>
            )}
            <span className="google-button-text">
              {t("Sign in with Google")}
            </span>
          </button>
        </div>

        {/* Privacy Policy and Terms of Use Links */}
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
          <span className="link-separator" style={{ color: theme.colors.onBackground }}>
            •
          </span>
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
        .container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0 24px;
          max-width: 400px;
          width: 100%;
        }

        .title {
          font-family: 'PassionOne-Regular', serif;
          font-size: clamp(28px, 8vw, 38px);
          margin-bottom: 20px;
          text-align: center;
          font-weight: bold;
        }

        .illustration {
          font-size: 120px;
          margin-bottom: 20px;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .icons-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 40px;
          width: 100%;
        }

        .first-row {
          display: flex;
          justify-content: space-between;
          gap: 60px;
          margin-bottom: 20px;
        }

        .second-row {
          display: flex;
          justify-content: center;
        }

        .icon {
          font-size: 36px;
          animation: bounce 2s ease-in-out infinite;
        }

        .icon:nth-child(1) { animation-delay: 0s; }
        .icon:nth-child(2) { animation-delay: 0.5s; }
        .second-row .icon { animation-delay: 1s; }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }

        .tagline-container {
          margin-bottom: 20px;
          width: 75%;
          text-align: center;
        }

        .tagline-wrapper {
          margin-bottom: 10px;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .tagline-wrapper.fade-in {
          opacity: 1;
          transform: translateX(0);
        }

        .tagline-wrapper.fade-out {
          opacity: 0;
          transform: translateX(20px);
        }

        .tagline {
          font-size: 20px;
          font-weight: bold;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .dots-container {
          display: flex;
          justify-content: center;
          gap: 4px;
          margin-top: 8px;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          transition: background-color 0.3s ease;
        }

        .button-container {
          width: 100%;
          margin-bottom: 20px;
        }

        .google-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          padding: 15px 24px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .google-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .google-button:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .spinner {
          font-size: 16px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .links-container {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
        }

        .link-text {
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          letter-spacing: -0.5px;
          transition: opacity 0.2s ease;
        }

        .link-text:hover {
          opacity: 0.7;
        }

        .link-separator {
          font-size: 14px;
          font-weight: bold;
        }

        @media (max-width: 480px) {
          .content {
            padding: 0 16px;
          }
          
          .illustration {
            font-size: 80px;
          }
          
          .first-row {
            gap: 40px;
          }
          
          .icon {
            font-size: 28px;
          }
          
          .tagline {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
};


export default LoginScreen;