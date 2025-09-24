import { Platform } from "react-native";
import * as Notifications from 'expo-notifications';
import { registerPushToken } from "./auth";
import * as Sentry from '@sentry/react-native';
import { useUserStore } from "@/store/userStore";
import Toast from 'react-native-simple-toast';
import { openSettings } from "expo-linking";
import i18n from "@/i18n";

const { setNotificationsDenied } =  useUserStore.getState();
const { setPushTokenRegistered } =  useUserStore.getState();
const { pushTokenRegistered } =  useUserStore.getState();

export async function registerForPushNotificationsAsync(userId: string, companyId: string, setPushTokenCallback: (token: string) => void) {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('lessnote-high-priority', {
      name: 'Lessnote High Priority',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

    // const projectId =
    //   Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    // if (!projectId) {
    //   handleRegistrationError('Project ID not found');
    // }
   
    const status = await requestPermissionsAsync();
    if (status!== 'granted') {
      console.log("Push notifications permissions not granted, skip")
      return;
    }else {
      registerDevicePushToken(userId, companyId, setPushTokenCallback);
    }
}

export const requestPermissionsAsync = async () => {
     const { status } = await Notifications.requestPermissionsAsync();
    console.log('Verifying Notification permission status:', status);
    setNotificationsDenied(status !== 'granted');
    return status;
}

 export const checkNotificationPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    console.log('Verifying Notification permission status:', status);
    setNotificationsDenied(status !== 'granted');
    return status;
  };


  const registerDevicePushToken = async ( userId: string, companyId: string, setPushTokenCallback: (pushToken: string) => void, ) => {
 try {
      const pushTokenString = (
        await Notifications.getDevicePushTokenAsync()
      ).data;
      console.log("push token string");
      console.log(pushTokenString);
      await registerPushToken(pushTokenString)
      setPushTokenRegistered(true);
      if (setPushTokenCallback)
        setPushTokenCallback(pushTokenString);
      return pushTokenString;
    } catch (e: unknown) {
      setPushTokenRegistered(false);
      console.log('Error getting or registering push', e)
      Sentry.captureException(e, {
        extra: {
          userId: userId,
          companyId: companyId
        }
      })
    }
  }


  export const checkAndEnableNotifications = async (userId: string, companyId: string, setPushToken: (token: string) => void) => {
    const status  = await checkNotificationPermission();
    console.log("status", status)
    if (status !== 'granted') {
      console.log("burda");
      Toast.show(i18n.t('You will have to enable this permission from your app settings'), Toast.SHORT);
      setTimeout(() => {
        openSettings().catch(() =>
          Toast.show(i18n.t('Cannot open settings, please go to app settings manually and enable notifications'),  Toast.SHORT)
        );
      }, 1000)
    } else if (!pushTokenRegistered){
      registerForPushNotificationsAsync(userId, companyId, setPushToken)
    }
  }