import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GoogleSignin,
  isErrorWithCode,
  isNoSavedCredentialFoundResponse,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import * as WebBrowser from 'expo-web-browser';
// import { useFonts, Inter_700Bold, Inter_400Regular } from '@expo-google-fonts/inter';
import Toast from 'react-native-simple-toast';
import { useRouter } from 'expo-router';
import { useMutation } from 'react-query';
import { axiosInstance } from '../../services/auth';
import { API_BASE_URL } from '../../services/config';
import { useUserStore } from '@/store/userStore';
import { useColorScheme } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { lightTheme, darkTheme } from '../../styles/theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { moderateScale, ms, s, scale, verticalScale, vs } from 'react-native-size-matters';
import { useTranslation } from 'react-i18next';

import SignInNoteStackDark from '../../assets/svgs/signinnotestack.svg';
import SignInMicDark from '../../assets/svgs/signinmicdark.svg';
import SignInPdfAIDark from '../../assets/svgs/signinpdfaidark.svg';
import SignInPenAIDark from '../../assets/svgs/signinpenaidark.svg';
import CatPetDarkSVG from '../../assets/svgs/catpendark.svg';

import SignInNoteStackLight from '../../assets/svgs/signinnotestacklight.svg';
import SignInMicLight from '../../assets/svgs/signinmiclight.svg';
import SignInPdfAILight from '../../assets/svgs/signinpdfailight.svg';
import SignInPenAILight from '../../assets/svgs/signinpenailight.svg';
import CatPetLightSVG from '../../assets/svgs/catpenlight.svg';
import GoogleIconSign from '../../assets/svgs/devicon_google.svg';
import SparkSingleDarkSVG from '../../assets/svgs/oui_sparkle-filled-single.svg';

import SignInSparkleSVG from '../../assets/svgs/sparkle_v2_hot.svg';
import { openLink } from '@/services/links';
import { SpinningIcon } from '@/components/SpinningIcon';
import { AxiosError } from 'axios';
import { isAvailableAsync, AppleAuthenticationButton, AppleAuthenticationButtonStyle, AppleAuthenticationButtonType, AppleAuthenticationScope, signInAsync } from 'expo-apple-authentication';

// Configure Google Sign-In
WebBrowser.maybeCompleteAuthSession();

const AnimatedIcon = ({ IconComponent, width, height, phase = 0 }) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Create a chaotic effect by varying amplitude and speed based on phase
    const amplitude = moderateScale(10 + (phase % 3) * 2); // Vary amplitude between 10 and 20
    const duration = 3000 + (phase % 2) * 500; // Vary duration between 2000 and 2500

    translateY.value = withRepeat(
      withSequence(
        withTiming(-amplitude, {
          duration: duration,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(amplitude, {
          duration: duration,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: duration,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1 // Infinite loop
    );
  }, [translateY, phase]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <IconComponent width={width} height={height} />
    </Animated.View>
  );
};

const LoginScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [googleInfo, setGoogleInfo] = useState(null);
  const setAccessToken = useUserStore(state => state.setAccessToken);
  const setRefreshToken = useUserStore(state => state.setRefreshToken);
  const setUserData = useUserStore(state => state.setUserData);
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  // Carousel state
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const [isAppleSignInAvailable, setIsSignInAvailable] = useState(false);
  const taglines = [
    {
      text: t("Record, edit and learn smart"),
      icon: <SignInSparkleSVG width={moderateScale(20)} height={moderateScale(20)} />,
    },
    {
      text: t("Create quizzes from your notes"),
      icon: <SignInSparkleSVG width={moderateScale(20)} height={moderateScale(20)} />,
    },
    {
      text: t("Flashcards for better memory"),
      icon: <SignInSparkleSVG width={moderateScale(20)} height={moderateScale(20)} />,
    },
  ];

  // Carousel animation
  useEffect(() => {
    const interval = setInterval(() => {
      opacity.value = withSequence(
        withTiming(0, { duration: 300 }),
        withTiming(0, { duration: 0 }),
        withTiming(1, { duration: 300 })
      );
      translateX.value = withSequence(
        withTiming(moderateScale(20), { duration: 300 }),
        withTiming(moderateScale(-20), { duration: 0 }),
        withTiming(0, { duration: 300 })
      );
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % taglines.length);
        setDisplayIndex((prev) => (prev + 1) % taglines.length);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [opacity, translateX, taglines.length]);

  useEffect(() => {
    isAvailableAsync().then((available) => {
      console.log('Apple Sign-In available:', available);
      setIsSignInAvailable(available);
    });
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const googleVerifyMutation = useMutation({
    mutationFn: newUser => {
      return axiosInstance.post(API_BASE_URL + '/auth/google/v2?verify=true', newUser);
    },
    onSuccess: (response, variables, context) => {
      console.log('Google Sign-In Request params:', variables);
      console.log('Google Sign-In Success:', response.data);
      const data = response.data;

      if (data?.new) {
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);

        if (data?.was_invited == false) {
          // new user redirecting to finish sign up 
        }
        router.push({
          pathname: '/(auth)/welcomeonboard/onboarding',
          params: {
            identityToken: variables.idToken,
            email: variables.user.email,
            name: variables.user.name,
            photo: variables.user.photo,
            finishUrl: '/auth/google/v2'
          }
        });
      } else {
        console.log("Logging in with id:", data?.id, data?.company_id);
        useUserStore.persist.setOptions({
          name: `user-store`
        });
        console.log('Restore user settings..');
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        useUserStore.persist.rehydrate().then(() => {
          console.log('Company set', data.company.name);
          console.log('Google data: ', variables);
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
            data?.company?.full_admin_access || false // Optional parameter for full admin access
          );
          console.log('Restored user settings!');
          // router.replace('/(auth)/welcomeonboard/onboarding');
          router.replace('/');
        });
      }
    },
    onError: (error: AxiosError, variables, context) => {
      console.log('Sign in endpoint error:', error);
      if (error.message.toLowerCase().includes('network')) {
        Toast.show(t('Network error, please check your connection!'));
      } else if (error.message.toLowerCase().includes('timeout')) {
        Toast.show(t('Request timed out, please try again later.'));
      } else if (!!error.response?.data?.message) {
        Alert.alert(error.response.data.message);
      } else {

        Alert.alert(t('An error occurred during sign-in, please try again later or reach to support@skripe.com'));
      }
    },
  });

  const appleVerifyMutation = useMutation({
    mutationFn: newUser => {
      return axiosInstance.post(API_BASE_URL + '/auth/apple?verify=true', newUser);
    },
    onSuccess: (response, variables, context) => {
      console.log('Apple Sign-In Request params:', variables);
      console.log('Apple Sign-In Success:', response.data);
      const data = response.data;
      if (data?.new) {
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);

        if (data?.was_invited == false) {
          // new user redirecting to finish sign up 
        }
        router.push({
          pathname: '/(auth)/welcomeonboard/onboarding',
          params: {
            identityToken: variables.identity_token,
            email: response.data?.email,
            name: response.data?.name,
            photo: response.data?.avatar,
            finishUrl: '/auth/apple/finish',
            accessToken: response.data?.access_token,
            authorizationCode: variables?.authorization_code,
          }
        });
      } else {
        console.log("Logging in with id:", data?.id, data?.company_id);
        useUserStore.persist.setOptions({
          name: `user-store`
        });
        console.log('Restore user settings..');
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        useUserStore.persist.rehydrate().then(() => {
          console.log('Company set', data.company.name);
          console.log('Google data: ', variables);
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
            data?.company?.full_admin_access || false // Optional parameter for full admin access
          );
          console.log('Restored user settings!');
          router.replace('/');
        });
      }
    },
    onError: (error: AxiosError, variables, context) => {
      console.log('Sign in endpoint error:', error.response?.data);
      if (error.message.toLowerCase().includes('network')) {
        Toast.show(t('Network error, please check your connection!'));
      } else if (error.message.toLowerCase().includes('timeout')) {
        Toast.show(t('Request timed out, please try again later.'));
      } else if (!!error.response?.data?.message) {
        Alert.alert(error.response.data.message);
      } else {

        Alert.alert(t('An error occurred during sign-in, please try again later or reach to support@skripe.com'));
      }
    },
  });
  const signIn = async () => {
    try {
      console.log('Signing in..');
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        console.log(response.data);
        setGoogleInfo({ userInfo: response.data });
        googleVerifyMutation.mutate({
          ...response.data,
          ...{ platform: Platform.OS },
        });
      } else if (isNoSavedCredentialFoundResponse(response)) {
        // Android and Apple only.
        // No saved credential found (user has not signed in yet, or they revoked access)
      }
    } catch (error) {
      console.error(error);
      if (isErrorWithCode(error)) {
        console.log('Error code:', error.code);
        switch (error.code) {
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            console.log('Play services not available..')
            Alert.alert(t("Google play services are not available, please verify your device support."));
            break;
          case statusCodes.SIGN_IN_CANCELLED:
            console.log('User cancelled the sign-in flow');
            Toast.show(t("Sign in canceled."))
            break;
          case statusCodes.IN_PROGRESS:
            console.log('Sign-in in progress');
            Toast.show(t("Sign-in in progres.."))
            break;
          default:
        }

      } else {
        console.log('An error occurred during Google Sign-In:');
        if (error.toString().toLowerCase().includes('network')) {
          Alert.alert(t('Network error, please check your connection!'));
        } else {
          console.log('General error happened!');
          console.log(error);
          Sentry.captureException(error, {
            extra: {
              signIn: "googleSignIn"
            }
          })
          Alert.alert(t('Sorry error happened, try reloading the app or try again later.'));

        }

        return;
        // some other error happened
      }
    }
  };





  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* App Title */}
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          {t("Leitner AI")}
        </Text>
        {/* <SpinningIcon spinDuration={8000} pulsating={true} pulseDuration={1000}>
            <SparkSingleDarkSVG width={s(38)} height={s(38)} />
        </SpinningIcon> */}
        {/* Cat Illustration */}
        {theme === darkTheme ?
          <CatPetDarkSVG width={moderateScale(140)} height={moderateScale(140)} style={{ marginBottom: verticalScale(10) }} /> :
          <CatPetLightSVG width={moderateScale(140)} height={moderateScale(140)} style={{ marginBottom: verticalScale(10) }} />}

        {/* Icons Row */}
        <View style={styles.iconsContainer}>
          <View style={styles.firstRow}>
            <View>
              {theme === darkTheme ?
                <AnimatedIcon IconComponent={SignInMicDark} width={moderateScale(42)} height={moderateScale(42)} phase={0} /> :
                <AnimatedIcon IconComponent={SignInMicLight} width={moderateScale(42)} height={moderateScale(42)} phase={0} />}
            </View>
            <View>
              {theme === darkTheme ?
                <AnimatedIcon IconComponent={SignInPdfAIDark} width={moderateScale(42)} height={moderateScale(42)} phase={1} /> :
                <AnimatedIcon IconComponent={SignInPdfAILight} width={moderateScale(42)} height={moderateScale(42)} phase={1} />}
            </View>
          </View>
          <View style={styles.secondRow}>
            {theme === darkTheme ?
              <AnimatedIcon IconComponent={SignInPenAIDark} width={moderateScale(42)} height={moderateScale(42)} phase={2} /> :
              <AnimatedIcon IconComponent={SignInPenAILight} width={moderateScale(42)} height={moderateScale(42)} phase={2} />}
          </View>
        </View>
        {/* Tagline with Carousel */}
        <View style={styles.taglineContainer}>
          <Animated.View
            style={[
              styles.taglineWrapper,
              animatedStyle,
            ]}
          >
            <Text style={[styles.tagline, { color: theme.colors.onBackground }]}>
              {taglines[displayIndex].text}{' '}
              {taglines[displayIndex].icon}
            </Text>
          </Animated.View>
          <View style={styles.dotsContainer}>
            {taglines.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === activeIndex
                        ? theme.colors.primary
                        : theme.colors.elevation.level3,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Google Sign-In Button */}
        <View style={styles.buttonContainer}>

          <TouchableOpacity
            style={[styles.googleButton, { backgroundColor: googleVerifyMutation.isLoading ? theme.colors.elevation.level5 : theme.colors.primary }]}
            onPress={() => signIn()}
            disabled={googleVerifyMutation.isLoading}
          >
            {!googleVerifyMutation.isLoading && <GoogleIconSign width={moderateScale(22)} height={moderateScale(22)} style={styles.googleIcon} />}
            {googleVerifyMutation.isLoading && (
              <ActivityIndicator
                size="small"
                color={theme.colors.onBackground}
                style={styles.spinner}
              />
            )}
            <Text style={[styles.googleButtonText, { color: theme.colors.onPrimary }]}>
              {t("Sign in with Google")}
            </Text>
          </TouchableOpacity>
        </View>
        {isAppleSignInAvailable && <AppleAuthenticationButton
          buttonType={AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthenticationButtonStyle.WHITE_OUTLINE}
          cornerRadius={12}
          style={[{ width: '100%' }, { marginTop: vs(5), height: vs(50) }]}
          onPress={async () => {
            try {
              const credential = await signInAsync({
                requestedScopes: [
                  AppleAuthenticationScope.FULL_NAME,
                  AppleAuthenticationScope.EMAIL,
                ],
              });

              console.log(credential['authorizationCode']);
              appleVerifyMutation.mutate({
                identity_token: credential['identityToken'],
                authorization_code: credential['authorizationCode'],
                platform: Platform.OS,
              });
              // signed in
            } catch (e) {
              if (e.code === 'ERR_REQUEST_CANCELED') {
                Alert.alert(t("Sign in canceled."))
              } else {
                Alert.alert(t('An error occurred during sign-in, please try again later or reach to support@skripe.com'));
              }
            }
          }}
        />}
        {/* Privacy Policy and Terms of Use Links */}
        <View style={styles.linksContainer}>
          <TouchableOpacity onPress={() => openLink('https://leitnerify.ai/privacy-policy')}>
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>
              {t("Privacy Policy")}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.linkSeparator, { color: theme.colors.onBackground }]}>   </Text>
          <TouchableOpacity onPress={() => openLink('https://leitnerify.ai/terms-of-use')}>
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>
              {t("Terms of Use")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(22),
  },
  title: {
    fontFamily: 'PassionOne-Regular',
    fontSize: moderateScale(38),
    marginBottom: verticalScale(20),
  },
  illustration: {
    width: moderateScale(120),
    height: moderateScale(120),
    marginBottom: verticalScale(45),
  },
  stackContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: verticalScale(24),
  },
  iconsContainer: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    width: '100%',
  },
  firstRow: {
    gap: scale(60),
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  secondRow: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: verticalScale(50),
  },
  icon: {
    width: moderateScale(36),
    height: moderateScale(36),
  },
  taglineContainer: {
    marginBottom: verticalScale(20),
    width: '75%',
    alignItems: 'center',
  },
  taglineWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(5),
    justifyContent: 'center',
  },
  tagline: {
    fontFamily: 'Inter_700Bold',
    fontSize: moderateScale(22),
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: verticalScale(8),
  },
  dot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: 4,
    marginHorizontal: scale(2),
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginRight: scale(10),
    // marginBottom: verticalScale(14),
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(15),
    // paddingVertical: verticalScale(13),
    paddingHorizontal: scale(22),
    borderRadius: 12,
    justifyContent: 'center',
    width: '100%',
  },
  googleIcon: {
    width: moderateScale(22),
    height: moderateScale(22),
    marginRight: scale(12),
  },
  googleButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: moderateScale(14, 0.9),
  },
  linksContainer: {
    flexDirection: 'row',
    gap: scale(16),
    alignItems: 'center',
    marginTop: verticalScale(23),
  },
  linkText: {
    letterSpacing: -0.5,
    fontFamily: 'Inter_500Medium',
    fontSize: moderateScale(14),
  },
  linkSeparator: {
    fontFamily: 'Inter_700Bold',
    fontSize: moderateScale(14),
    marginHorizontal: scale(8),
  },
});

export default LoginScreen;