import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from 'react-query';
import 'react-native-reanimated';
import './i18n';
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GoogleOAuthProvider } from '@react-oauth/google';


import { useColorScheme } from '@/hooks/use-color-scheme';

const queryClient = new QueryClient();

const googleWebClientId = '241687352985-umb35edcp1011r61tnvekch5suuu6ldk.apps.googleusercontent.com' || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;


export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={googleWebClientId}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="notes" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}
