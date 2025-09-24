import { useColorScheme, Text, View, Appearance, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, TextInput, Alert, Platform } from "react-native";
import { lightTheme, darkTheme } from '../../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useUserStore } from "@/store/userStore";
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Sentry from '@sentry/react-native';
import { axiosInstance, registerPushToken } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useQuery, useQueryClient } from "react-query";
import debounce from 'lodash.debounce';
import { s, vs, ms } from 'react-native-size-matters';
import Toast from 'react-native-simple-toast';
import RecordingIconDarkSVG from '../../assets/svgs/recordingTypeIconDark.svg';
import SparkSingleDarkSVG from '../../assets/svgs/oui_sparkle-filled-single.svg';
// import PenAIFilledGradientDarkSVG from '../../assets/svgs/fluent_pen-sparkle-16-filled.svg';
import ImageTypeIconDarkSVG from '../../assets/svgs/imageTypeIconDark.svg';
import PdfTypeIconDarkSVG from '../../assets/svgs/pdfTypeIconDark.svg';
import YoutubeTypeIconDarkSVG from '../../assets/svgs/youtubeTypeIconDark.svg';
import ExamTypeIconDarkSVG from '../../assets/svgs/examiconDark.svg';
import ImageTypeIconSimpleDarkSVG from '../../assets/svgs/imageIconSimpleDark.svg';
import SubscribedNotificationNoteIconDarkSVG from '../../assets/svgs/material-symbols_alarm-on.svg';
import MultiNoteStackIconDarkSVG from '../../assets/svgs/basil_stack-solid.svg';
import SignInMicDark from '../../assets/svgs/signinmicdark.svg';
import SignInPdfAIDark from '../../assets/svgs/signinpdfaidark.svg';
import SignInPenAIDark from '../../assets/svgs/signinpenaidark.svg';
import SparkAISVG from '../../assets/svgs/sparkle_v2_hot.svg';
import SettingsSVG from '../../assets/svgs/settings.svg';
import PROPLUSSVG from '../../assets/svgs/PRO+.svg';
import PROSVG from '../../assets/svgs/PRO.svg';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { openSettings } from "expo-linking";
import { ISO_TO_LANGUAGE } from "@/assets/languages";
import ProgressCircle from '@/components/ProgressCircle';
import { useTranslation } from 'react-i18next';
import { FlashList } from "@shopify/flash-list";
import { differenceInHours } from "date-fns";
import { BreathingIcon } from "@/components/BreathingIcon";

// Add these to your existing imports
import { LinearGradient } from 'expo-linear-gradient';
import { SpinningIcon } from "@/components/SpinningIcon";
import Animated, { cancelAnimation, Easing, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { POLLING_INTERVAL_MS } from "@/constants";
import { usePostHog } from "posthog-react-native";
import { getActiveEntitlement, presentPaywall } from "@/revenuecat/paywallUtils";
import Purchases, { CustomerInfo, LOG_LEVEL, PurchasesEntitlementInfo } from "react-native-purchases";
import { useIsFocused } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import { PAYWALL_RESULT } from "react-native-purchases-ui";
import { registerForPushNotificationsAsync } from "@/services/push";
import i18n from "@/i18n";

// Add these to your existing imports

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});




interface Note {
  id: string;
  note_type: 'text' | 'image' | 'audio' | 'pdf' | 'youtube' | 'test' | 'multi';
  name: string;
  created_at: string;
  language?: string;
  note_progress?: number;
  quiz_alerts_enabled?: boolean;
  processing_error_message?: string;
  status?: 'transcribed' | 'failed' | 'draft' | 'uploaded';

}

const isNoteInLoadingState = (note: Note) => {
  // Your existing condition
  if (note.status !== 'failed' && note.status !== 'transcribed' && note.status !== 'draft') {
    console.log(`Note ${note?.id} ${note?.name} is in loading state: ${note?.status}`);

  }
  return note.status !== 'failed' && note.status !== 'transcribed' && note.status !== 'draft';
  // Example statuses that are "loading": 'processing', 'pending', 'uploading'
  // Example statuses that are "not loading": 'failed', 'transcribed', 'completed', 'error'
};

export default function Index() {
  const { t } = useTranslation();
  const isLoggedIn = useUserStore(store => store.isLoggedIn);
  const email = useUserStore(store => store.email);
  const userName = useUserStore(store => store.userName);
  const userId = useUserStore(store => store.userId);
  const companyId = useUserStore(store => store.companyId);
  const [newNoteTypeSelection, setNewNoteTypeSelection] = useState<number | undefined>(undefined);
  const subscriptionLastCheckedDate = useUserStore(store => store.subscriptionLastCheckedDate);
  // const notificationsDenied = useUserStore(store => store.notificationsDenied);
  // const setNotificationsDenied = useUserStore(store => store.setNotificationsDenied);
  // const setPushToken = useUserStore(store => store.setPushToken);
  if (!isLoggedIn || !companyId) {
    return <Redirect href="/(auth)/login" />;
  }
  const postHog = usePostHog()
  // const notificationListener = useRef<Notifications.EventSubscription>();
  // const responseListener = useRef<Notifications.EventSubscription>();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const isFocused = useIsFocused()
  // Here we donot request access but just renew token as needed. request is done on quiz menu
  // useEffect(() => {
  //   if (userId && companyId) {
  //     console.log('Registering for push notifications..', userId, companyId);
  //     registerForPushNotificationsAsync(userId, companyId, setPushToken)
  //       .catch((error: any) => {
  //         console.log('Error getting or setting push token:', error);
  //       });

  //     notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
  //       console.log('Receiver handler called', notification);
  //     });
    
  //     responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
  //       console.log('Response handler called', response);
  //       console.log(response);
  //     });
  //   }
  //   }, [userId, companyId]);

  //     return () => {
  //       notificationListener.current &&
  //         Notifications.removeNotificationSubscription(notificationListener.current);
  //       responseListener.current &&
  //         Notifications.removeNotificationSubscription(responseListener.current);
  //     };
  //   }
  // }, [userId, companyId]);

    //  useEffect(() => { 
    //   setTimeout(() => {
    //     router.push({pathname: "/notequiz/takequiz", params: { view: 'modal', noteId: 834, complexity: 'bonus', quizId: 3804 }});
    //   }, 1000)
    // }, [])

  const searchNotes = async (query: string) => {
    try {
      console.log('Searching notes with query:', query);
      return new Promise<Note[]>((resolve) => {
        setTimeout(() => {
          const filteredNotes = (notesQuery.data?.data?.notes || []).filter(note =>
            note.name.toLowerCase().includes(query.toLowerCase())
          );
          console.log('Filtered Notes:', filteredNotes.length);
          resolve(filteredNotes);
        }, 500);
      });
    } catch (error) {
      throw new Error(t('Failed to search notes'));
    }
  };

  const notesQuery = useQuery({
    queryKey: ['notes'],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    queryFn: async () => {
      return axiosInstance.get(API_BASE_URL + `/company/${companyId}/notes/all`);
    },
    enabled: !!companyId,
    refetchInterval: (data, query) => {
      // For React Query v5+, the argument `query` is the Query object itself.
      // The actual data is in `query.state.data`.
      // For React Query v3/v4, the first argument was `data` directly.
      // console.log('Polling check:', query.data?.data?.notes, data);
      const notes = data?.data?.notes; // This will be the array of notes returned by queryFn

      if (!notes || !Array.isArray(notes) || notes.length === 0) {
        // No data yet, or not an array, or empty array: don't poll
        return false;
      }

      const hasLoadingNotes = notes.some(isNoteInLoadingState);

      if (hasLoadingNotes && isFocused) {
        console.log('Some notes are still processing.. Polling enabled.');
        return POLLING_INTERVAL_MS;
      } else {
        console.log('All notes processed or failed. Polling disabled.');
        return false; // Stop polling if no notes are in a loading state
      }
    },
    onError: (error) => {
      console.error('Get notes error:', error);
    },
  });

  const searchNotesQuery = useQuery({
    queryKey: ['searchNotes', searchQuery],
    queryFn: () => { return searchNotes(searchQuery) },
    enabled: true,
    onError: (error) => {
      console.error('Search error:', error);
      Sentry.captureException(error);
    },
  });

  const profileInfoQuery = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      return axiosInstance.get(API_BASE_URL + `/company/${companyId}/overview`);
    },
    enabled: !!companyId,
    onError: (error) => {
      console.error('Profile get error:', error);
      Sentry.captureException(error);
    },
  });
  // default_daily_note_limit = deprecated
  const { subscription, today_created_notes_count, default_daily_note_limit,  default_total_note_limit, total_created_notes_count, enforced_daily_note_limit, enforced_daily_audio_hours_limit } = profileInfoQuery.data?.data || {};
  const note_daily_limit_hit = ( enforced_daily_note_limit != null && enforced_daily_note_limit > 0 && today_created_notes_count != null && today_created_notes_count >= enforced_daily_note_limit)
  const free_and_note_limit_hit = (subscription && subscription === 'free' && (total_created_notes_count != null && total_created_notes_count >= default_total_note_limit))
  // console.log('Search Notes:', searchNotesQuery.data?.length,  searchQuery);
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleOpenBottomSheet = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const handleCloseBottomSheet = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const customerInfoListener = useCallback((customerInfo: CustomerInfo) => {
      console.log('Customer info updated:', customerInfo);
      profileInfoQuery.refetch();
      const entitlement: PurchasesEntitlementInfo | undefined = getActiveEntitlement(customerInfo);
      console.log('[Index] Active Entitlements:', entitlement);
      if (entitlement) {
        postHog?.capture('user_subscription_updated', {
          userId,
          companyId,
          subscription: "pro",
          activeTill: entitlement?.expirationDate || null,
        });
      } else {
        console.log('No active entitlement found on customer info update');
      }
    }, [userId, companyId]);
  useEffect(() => {
    Sentry.setUser({
      email,
      username: (email || '') + (companyId + ''),
      name: userName,
    });
    postHog.identify(userId, {
      email,
      // name: userName,
      companyId: companyId,
      subscriptionLastCheckedDate: subscriptionLastCheckedDate || null,
    });
    Sentry.setExtra('user_data', {
      company_id: companyId,
      subscriptionLastCheckedDate,
      userId: -1,
    });
    try {
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
      Purchases.isConfigured().then((isConfigured) => {
        console.log('Purchases is configured:', isConfigured);
        try {
          if (Platform.OS === 'ios') {
            Purchases.configure({ apiKey: 'appl_XRfpMRwceOWfPPHBpUYPfLipqAx', appUserID: userId.toString() });
          } else if (Platform.OS === 'android') {
            Purchases.configure({ apiKey: 'appl_XRfpMRwceOWfPPHBpUYPfLipqAx', appUserID: userId.toString() });

            // OR: if building for Amazon, be sure to follow the installation instructions then:
            //  Purchases.configure({ apiKey: <revenuecat_project_amazon_api_key>, useAmazon: true });
          }
          Purchases.setDisplayName(userName || 'Anonymous User');
        } catch (e) {
          console.error('Error configuring Purchases:', e);
          Alert.alert(
            t('Error'),
            t('There was an error configuring the purchases. Please try to re-launch the app.'),
            [{ text: t('OK'), onPress: () => { } }]
          );
          Sentry.captureException(e, {
            extra: {
              userId,
              companyId,
            },
          });
        }
      });
    } catch (e) {
      console.error('Error configuring Purchases:', e);
      Alert.alert(
        t('Error'),
        t('There was an error fetching the purchase history. Please try to re-launch the app.'),
        [{ text: t('OK'), onPress: () => { } }]
      );
      Sentry.captureException(e, {
        extra: {
          userId,
          companyId,
        },
      });
    }
    // presentPaywall()
    Purchases.addCustomerInfoUpdateListener(customerInfoListener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
      debouncedSearch.cancel();
    };
  }, []);

  const setTheme = () => {
    const themeToBeSet = colorScheme === 'light' ? 'dark' : 'light';
    Appearance.setColorScheme(themeToBeSet);
  };

  const goSettings = () => {
    router.push({ pathname: '/(home)/settings' });
  };

  const onCreateNewNote = () => {
    console.log('Create New Note button pressed', subscription);
    console.log('Note Limits:', { note_daily_limit_hit, free_and_note_limit_hit, today_created_notes_count, default_total_note_limit: default_total_note_limit, total_created_notes_count, default_daily_note_limit, enforced_daily_note_limit, enforced_daily_audio_hours_limit });
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(now.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    const hoursDiff = differenceInHours(
      tomorrow,
      now,
    ) + 1
    
    console.log('To tomorrow:', tomorrow, ' Now:', now, ' hours diff: ', hoursDiff, subscription, today_created_notes_count, default_daily_note_limit, enforced_daily_note_limit, enforced_daily_audio_hours_limit);
    if (note_daily_limit_hit) {
      // calculate hours till tomorrow date 00 00 UTC

      console.log('Difference To Lift Limit:', hoursDiff);
      let message = t('You have reached your daily limit of {{limit}} notes. Please try again in {{till_tomorrow_h}} hours.', {
        limit: default_daily_note_limit,
        till_tomorrow_h: hoursDiff,
      })
      if (subscription === 'free'){
        message = t('You have reached your daily limit of {{limit}} notes. Please subscribe or try again in {{till_tomorrow_h}} hours.', {
          limit: default_daily_note_limit,
          till_tomorrow_h: hoursDiff,
        })
        
      }

      Alert.alert(
        t('Daily Limit Reached'),
        message,
        [{ text: t('OK'), onPress: async () => { 
          
          
        } }]
      );

      return;
    }
    if (free_and_note_limit_hit) {
      // calculate hours till tomorrow date 00 00 UTC
      Alert.alert(
        t('Free Limit Reached'),
        t('You have reached your free limit of {{limit}} notes', {
          limit: default_total_note_limit,
        }),
        [{ text: t('OK'), onPress: () => {
          if (subscription === 'free') 
            presentPaywall().then((paywallResult: PAYWALL_RESULT) => {
              if (paywallResult == PAYWALL_RESULT.PURCHASED || paywallResult == PAYWALL_RESULT.RESTORED){
                setInterval(() => {
                    profileInfoQuery.refetch();
                }, 2000)
                Alert.alert(
                  t('Thank you!'),
                  t('Your subscription has been updated.'),
                  [{ text: t('OK'), onPress: () => { } }]
                );
                console.log('Paywall presented')
                
              }
            }).catch((error) => {; 
              console.error('Error presenting paywall or processing transaction?:', error);
              Sentry.captureException(error, {
                extra: {
                  userId,
                  companyId,
                },
              });
              Alert.alert(
                t('Error'),
                t('There was an error getting information about your purchases. Please try again later.'),
                [{ text: t('OK'), onPress: () => { } }]
              );
            })
         } }]
      );
      return;
    }
    if (enforced_daily_audio_hours_limit != null && enforced_daily_audio_hours_limit > 0) {
      Alert.alert(
        t('Audio Limit Reached'),
        t('You have reached your daily limit of {{audio_hours_limit}} audio hours. Please try again tomorrow.',
          {
            audio_hours_limit: enforced_daily_audio_hours_limit,
          }
        ),
        [{ text: t('OK'), onPress: () => { } }]
      );
      return;
    }
    handleOpenBottomSheet();
  };

  const handleBottomSheetOption = (option: string) => {
    handleCloseBottomSheet();
    switch (option) {
      // case 'startRecording':
      //   router.push({ pathname: '/(home)/noterecord', params: { noteType: 'audio' } });
      //   break;
      // case 'importRecording':
      //   router.push({ pathname: '/(home)/importrecording', params: { noteType: 'audio' } });
      //   break;
      case 'importYouTube':
        router.push({ pathname: '/(home)/importyoutube', params: { noteType: 'youtube' } });
        break;
      // case 'importPDF':
      //   router.push({ pathname: '/(home)/importimage', params: { noteType: 'pdf' } });
      //   break;
      // case 'importExam':
      //   router.push({ pathname: '/(home)/importimage', params: { noteType: 'test' } });
      //   break;
      case 'createMultinote':
        router.push({ pathname: '/(home)/multinote', params: { noteType: 'multi' } });
        break;
    }
  };

  const NoteItemWithShimmer = ({ item, onPress }: { item: Note, onPress: () => void }) => {
    let isDraft = item.status === 'draft';
    let isItemProcessing = item.status !== 'failed' && item.status !== 'transcribed' && item.status !== 'draft';
    const animatedValue = useSharedValue(0);
    const [itemWidth, setItemWidth] = useState(0); // State to store the item's width

    // Get the item width on layout
    const handleLayout = (event: { nativeEvent: { layout: { width: number } } }) => {
      const { width } = event.nativeEvent.layout;
      if (width > 0 && itemWidth !== width) { // Only set if different and valid
        setItemWidth(width);
      }
    };

    useEffect(() => {
      if (isItemProcessing && itemWidth > 0) {
        animatedValue.value = withRepeat(
          withTiming(1, {
            duration: 5000,
            easing: Easing.linear, // Use Easing from Reanimated
          }),
          -1, // Loop indefinitely (-1)
          false // Do not reverse
        );
      } else {
        // If not processing or width not set, ensure animation is stopped and reset
        cancelAnimation(animatedValue);
        animatedValue.value = 0;
      }

      return () => {
        // Cleanup: cancel animation and reset value when component unmounts
        // or dependencies change leading to re-evaluation of this effect
        cancelAnimation(animatedValue);
        animatedValue.value = 0;
      };
    }, [isItemProcessing, itemWidth, animatedValue]); // animatedValue is a stable shared
    // Calculate translateX based on the actual itemWidth
    // The animated view is 200% of itemWidth.
    // To make it sweep from being entirely to the left to entirely to the right of the item:
    // Start: its left edge at -2 * itemWidth (so it's completely off-screen left)
    // End: its left edge at +itemWidth (so it has completely passed the item to the right)
    // This matches the visual effect of your original percentage-based outputRange: ['-100%', '50%']
    // where -100% of (2 * itemWidth) = -2 * itemWidth
    // and 50% of (2 * itemWidth) = 1 * itemWidth
    // const translateX = itemWidth > 0 ? animatedValue.interpolate({
    //   inputRange: [0, 1],
    //   outputRange: [-5 * itemWidth, itemWidth],
    // }) : 0; // Default to 0 if width is not known, preventing animation
    const animatedShimmerStyle = useAnimatedStyle(() => {
      if (itemWidth <= 0) {
        // Default to no transform if width is unknown or invalid
        return {
          transform: [{ translateX: 0 }],
        };
      }
      const translateXValue = interpolate(
        animatedValue.value, // Access .value for shared values
        [0, 1],
        [-5 * itemWidth, itemWidth] // Your original outputRange logic
      );
      return {
        transform: [{ translateX: translateXValue }],
      };
    });

    const getIcon = () => {
      let icon;
      switch (item.note_type) {
        case 'text':
        case 'audio':
          icon = <RecordingIconDarkSVG width={s(20)} height={s(20)} />;
          break;
        case 'image':
          icon = <ImageTypeIconDarkSVG width={s(20)} height={s(20)} />;
          break;
        case 'pdf':
          icon = <PdfTypeIconDarkSVG width={s(20)} height={s(20)} />;
          break;
        case 'youtube':
          icon = <YoutubeTypeIconDarkSVG width={s(20)} height={s(20)} />;
          break;
        case 'test':
          icon = <ExamTypeIconDarkSVG width={s(20)} height={s(20)} />;
          break;
        case 'multi':
          icon = <MultiNoteStackIconDarkSVG width={s(20)} height={s(20)} />;
          break;
        default:
          icon = null;
      }

      // If item is processing, wrap the icon in SpinningIcon, otherwise return the original icon
      if (isItemProcessing) {
        return (
          <BreathingIcon isAnimating={true}>
            {icon || <SparkSingleDarkSVG width={s(30)} height={s(30)} />}
          </BreathingIcon>
        );
      }

      return icon;
    };

    const noteLanguageIso = (item?.language || 'en').toUpperCase();
    const created_at = new Date(item.created_at);
    const progress = item?.note_progress || 0;
    const formattedDate = created_at.toLocaleDateString('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    });
    return (
      <TouchableOpacity
        style={[styles.noteItem, { backgroundColor: theme.colors.surface }]}
        onPress={onPress}
        onLayout={handleLayout} // Add onLayout here
      >
        {/* ... (rest of your NoteItemWithShimmer JSX is the same) ... */}
        <View style={[styles.noteIconContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
          {getIcon()}
        </View>
        {!isItemProcessing && <View style={styles.noteContent}>
          <View style={styles.noteHeader}>
            {item.processing_error_message && <Ionicons name="warning-outline" size={ms(20)} style={{ marginRight: s(10) }} color={theme.colors.error} />}
            {<Text style={[styles.noteTitle, { color: theme.colors.onSurface }]} numberOfLines={1} ellipsizeMode="tail">
              {isDraft ? t('Draft {{id}}', { id: item.id }) : item.name}
            </Text>}
            {item?.quiz_alerts_enabled && (
              <SubscribedNotificationNoteIconDarkSVG style={{ flex: 1 }} width={s(22)} height={s(22)} />
            )}
          </View>
          <Text style={[styles.noteDate, { color: theme.colors.onSurfaceVariant }]}>{formattedDate}</Text>
          <View style={styles.subNoteContent}>
            {ISO_TO_LANGUAGE[noteLanguageIso] && <Text style={[styles.languageText, { color: theme.colors.onSurface }]}>
              {ISO_TO_LANGUAGE[noteLanguageIso].flag}{'  '}{ISO_TO_LANGUAGE[noteLanguageIso].language}
            </Text>}
            {progress > 0.0 && progress < 1.0 && !isItemProcessing && <ProgressCircle progress={Math.round(progress * 100)} size={s(22)} strokeWidth={2} theme={theme} />}
          </View>
        </View>}
        {isItemProcessing && (
          <View style={styles.noteContent}>
            <View style={[styles.noteHeader, { justifyContent: 'center', alignItems: 'center' }]}>
              {/* <BreathingIcon isAnimating={isItemProcessing} iconSize={s(20)} > */}
              <Text style={[styles.noteTitle, { color: theme.colors.outline }]} numberOfLines={1} ellipsizeMode="tail">
                {t('Processing')}
              </Text>
              <SpinningIcon spinDuration={5000} pulsating={true} pulseDuration={1000}>
                <SparkSingleDarkSVG width={s(32)} height={s(32)} />
              </SpinningIcon>
              {/* </BreathingIcon> */}
            </View>

          </View>
        )}
        {isItemProcessing && itemWidth > 0 && ( // Also ensure itemWidth > 0 before rendering shimmer
          <View
            style={{
              // ...StyleSheet.absoluteFillObject,
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              // backgroundColor: theme.colors.surface,
              bottom: 0,
              borderRadius: styles.noteItem.borderRadius,
              overflow: 'hidden',
            }}
            pointerEvents="none"
          >
            <Animated.View
              style={[
                {
                  width: '600%', // Keep your original width
                  height: '100%',
                },
                animatedShimmerStyle, // Apply the Reanimated style
              ]}
            >
              <LinearGradient
                colors={[
                  'rgba(207, 75, 99, 0)',
                  // 'rgba(30, 30, 30, 0.0)',
                  'rgba(0, 0, 0, 0.25)',
                  'rgba(0, 0, 0, 0.25)',
                  'rgba(50, 10, 20, 0.0)',
                ]}
                locations={[0.2, 0.4, 0.6, 0.8]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderNoteItem = useCallback(({ item }: { item: Note }) => {
    return (
      <NoteItemWithShimmer
        item={item}
        onPress={() => router.push({ pathname: '/(home)/notedetail', params: { noteId: item.id } })}
      />
    );
  }, [theme]);

  const renderBottomSheetContent = () => (
    <BottomSheetView style={[styles.bottomSheetContent, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.bottomSheetOptionsContainer}>
        <View>
          <Text style={[styles.bottomSheetTitle, { color: newNoteTypeSelection === 0 ? theme.colors.secondary : theme.colors.onSurface }]}>{t('Youtube')}</Text>
          <TouchableOpacity
            ph-label="youtube-selection"
            style={[styles.bottomSheetSquareOption, { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: newNoteTypeSelection === 0 ? theme.colors.secondary : theme.colors.onSurface }]}
            onPress={() => setNewNoteTypeSelection(0)}
          >
            <Ionicons name="logo-youtube" size={s(40)} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        <View>
          <Text style={[styles.bottomSheetTitle, { color: newNoteTypeSelection === 1 ? theme.colors.secondary : theme.colors.onSurface }]}>{t('Multi-note')}</Text>
          <TouchableOpacity
            ph-label="multi-note-selection"
            style={[styles.bottomSheetSquareOption, { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: newNoteTypeSelection === 1 ? theme.colors.secondary : theme.colors.onSurface }]}
            onPress={() => setNewNoteTypeSelection(1)}
          >
            <View style={styles.multiIconContainer}>
              <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'space-between', alignItems: 'center', gap: s(20) }}>
                <SignInMicDark width={s(32)} height={s(32)} />
                <SignInPdfAIDark width={s(32)} height={s(32)} />
              </View>
              <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'space-between', alignItems: 'center', gap: s(20) }}>
                <SignInPenAIDark width={s(32)} height={s(32)} />
                <ImageTypeIconSimpleDarkSVG width={s(30)} height={s(30)} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        ph-label="create-new-note-bottom-sheet"
        disabled={newNoteTypeSelection === undefined}
        style={[styles.bottomSheetCreateButton, { backgroundColor: newNoteTypeSelection == undefined ? theme.colors.surface : theme.colors.primary }]}
        onPress={() => {
          const selectedOption = newNoteTypeSelection === 0 ? 'importYouTube' : 'createMultinote';
          handleBottomSheetOption(selectedOption);
        }}
      >
        <Text style={[styles.bottomSheetCreateButtonText, { color: newNoteTypeSelection == undefined ? theme.colors.surface : theme.colors.onPrimary }]}>
          {t('Create note')}


        </Text>
        {/* <SparkAISVG width={s(18)} height={s(18)} style={{ marginLeft: s(8.75) }} /> */}
      </TouchableOpacity>
    </BottomSheetView>
  );

  const onRefresh = useCallback(() => {
    notesQuery.refetch();
    if (searchQuery) {
      queryClient.invalidateQueries(['searchNotes']);
      queryClient.invalidateQueries(['profile', companyId]);
    }
  }, [notesQuery, searchQuery, queryClient]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(8.75), flex: 1 }}>
            <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>{t('All notes')}</Text>
            {/* <Ionicons
              name="chevron-down"
              size={s(22)}
              color={theme.colors.primary}
            /> */}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(18) }}>
            <View>
            {profileInfoQuery.data?.data?.subscription != "pro" && <PROSVG style={{zIndex: 4}} width={s(30)} height={s(30)} color={theme.colors.primary} onPress={() => {
              // Alert.alert(t('Upgrade to PRO'));
              presentPaywall().then((paywallResult: PAYWALL_RESULT) => {
                
                console.log('Paywall presented')
                if (paywallResult === PAYWALL_RESULT.PURCHASED || paywallResult === PAYWALL_RESULT.RESTORED) {
                  profileInfoQuery.refetch();
                  setInterval(() => {
                    profileInfoQuery.refetch();
                  }, 2000)
                  Alert.alert(
                    t('Thank you!'),
                    t('Your subscription has been updated.'),
                    [{ text: t('OK'), onPress: () => { 
                      profileInfoQuery.refetch();
                      Purchases.syncPurchases();
                    } }]
                  );
                  
                }
              }).catch((error) => {; 
                console.error('Error presenting paywall or processing transaction?:', error);
                Sentry.captureException(error, {
                  extra: {
                    userId,
                    companyId,
                  },
                });
                Alert.alert(
                  t('Error'),
                  t('There was an error getting information about your purchases. Please try again later.'),
                  [{ text: t('OK'), onPress: () => { } }]
                );
              })
            }} />}
            {profileInfoQuery.data?.data?.subscription != "pro" &&<LottieView
              speed={0.5}
            style={{
              // backgroundColor: 'red',
              // opacity: 0.5,
              position: 'absolute',
              // right: 0,
              width: s(35),
              // right: 40,
              // left: '50%',
              // backgroundColor: 'red',
              height: vs(35),
              // zIndex: 10,
              // marginLeft: 30,
              top: -s(6),
              // backgroundColor: 'red',
              alignSelf: 'flex-end',
              transform: [{ rotate: '45deg' }]

            }}
            // speed={1}
            // source={require('../../animations/circle-gradient-border-dark.json')}
            source={require('../../assets/lotties/sparkles.json')}

            autoPlay
            loop={true}
          // loop={false}
          />}

            </View>
            <TouchableOpacity onPress={goSettings}>
              <SettingsSVG width={s(23)} height={s(23)} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={s(17)}
            color={theme.colors.primary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, {
              color: theme.colors.onSurface,
              backgroundColor: theme.colors.surface,
            }]}
            placeholder={t("Search transcripts..")}
            placeholderTextColor={theme.colors.onSurface}
            onChangeText={debouncedSearch}
            clearButtonMode="while-editing"
          />
        </View>
        <FlashList
          data={searchQuery ? (searchNotesQuery.data || []) : (notesQuery.data?.data?.notes || [])}
          renderItem={renderNoteItem}
          estimatedItemSize={10}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={{ flex: 1, marginBottom: s(100), justifyContent: 'center', alignItems: 'center' }}>
              {(notesQuery.isLoading || searchNotesQuery.isLoading) && <ActivityIndicator />}
              {searchNotesQuery.isError && (
                <Text style={[{ color: theme.colors.error }]}>{t('Failed to search notes')}</Text>
              )}
              {!notesQuery.isLoading && !searchNotesQuery.isLoading && !notesQuery.data?.data?.notes.length && !searchQuery && (
                <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>{t('No notes available')}</Text>
              )}
              {searchQuery && !searchNotesQuery.isLoading && !searchNotesQuery.data?.length && (
                <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>{t('No results found')}</Text>
              )}
            </View>
          )}
          ListFooterComponent={() => (
            <View style={{ height: s(100) }} />
          )}
          extraData={colorScheme}
          refreshControl={
            <RefreshControl
              refreshing={isFocused && notesQuery.isRefetching || searchNotesQuery.isRefetching}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        />
        {!note_daily_limit_hit && !free_and_note_limit_hit && <TouchableOpacity ph-label="create-new-note" onPress={onCreateNewNote} style={[styles.createButton, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.createButtonText, { color: theme.colors.onPrimary }]}>{t('Create new note')}</Text>
          {__DEV__ && <Text style={{ color: theme.colors.onPrimary, marginLeft: s(8.75) }}>{today_created_notes_count}/{default_daily_note_limit} </Text>}
          <SparkAISVG width={s(18)} height={s(18)} style={{ marginLeft: s(8.75) }} />
        </TouchableOpacity>}
        {note_daily_limit_hit && <TouchableOpacity onPress={onCreateNewNote} style={[styles.createButton, { backgroundColor: theme.colors.error }]}>
          <Text style={[styles.createButtonText, { color: theme.colors.onPrimary }]}>{t('Daily Limit Reached')}</Text>
          {/* <ProgressCircle
            style={{ position: 'absolute', right: s(10) }}
            progress={100}
            size={s(27)}
            strokeWidth={2}
            theme={theme}
          /> */}
          {/* <SparkAISVG width={s(20)} height={s(20)} style={{ marginLeft: s(8.75) }} /> */}
        </TouchableOpacity>}
        {free_and_note_limit_hit && <TouchableOpacity onPress={onCreateNewNote} style={[styles.createButton, { backgroundColor: theme.colors.error }]}>
          <Text style={[styles.createButtonText, { color: theme.colors.onPrimary }]}>{t('Free Limit Reached')}</Text>
          {/* <ProgressCircle
            style={{ position: 'absolute', right: s(10) }}
            progress={100}
            size={s(27)}
            strokeWidth={2}
            theme={theme}
          /> */}
          {/* <SparkAISVG width={s(20)} height={s(20)} style={{ marginLeft: s(8.75) }} /> */}
        </TouchableOpacity>}
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          enablePanDownToClose={true}
          enableDynamicSizing={true}
          backgroundStyle={{ backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.elevation.level1 }}
          handleIndicatorStyle={{ backgroundColor: theme.colors.primary }}
        >
          {renderBottomSheetContent()}
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: vs(20),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: s(17.5),
    paddingBottom: vs(17.5),
  },
  headerTitle: {
    fontSize: ms(27),
    fontFamily: 'Inter_700Bold',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: s(17.5),
    paddingBottom: vs(17.5),
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: s(14),
    marginBottom: vs(10.5),
    // shadowColor: '#000000',
  },
  noteIconContainer: {
    width: s(38),
    height: vs(38),
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginRight: s(14.5),
  },
  noteHeader: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    flex: 10,
    fontSize: ms(14.4),
    fontFamily: 'Inter_700Bold',
  },
  noteDate: {
    fontSize: ms(10.8),
    marginTop: vs(3.5),
  },
  subNoteContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: vs(10),
  },
  createButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: vs(26),
    left: s(17.5),
    right: s(17.5),
    borderRadius: 12,
    paddingVertical: vs(14),
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: ms(17),
    fontWeight: '700',
  },
  bottomSheetContent: {
    flex: 1,
    padding: s(17.5),
  },
  bottomSheetTitle: {
    fontSize: ms(18),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: vs(17.5),
  },
  bottomSheetOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vs(17.5),
  },
  bottomSheetSquareOption: {
    width: s(140),
    height: s(140),
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  multiIconContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  bottomSheetCreateButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: vs(14),
    alignItems: 'center',
  },
  bottomSheetCreateButtonText: {
    fontSize: ms(17),
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: s(17.5),
    marginBottom: vs(26),
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchIcon: {
    position: 'absolute',
    left: s(21),
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: vs(12),
    paddingLeft: s(52),
    paddingRight: s(10.5),
    fontSize: ms(15),
    borderRadius: 12,
  },
  emptyText: {
    fontSize: ms(14.4),
    fontFamily: 'Inter_700Bold',
  },
  languageText: {
    fontSize: ms(12, 0.9),
    fontFamily: 'Inter_400Regular',
    fontWeight: '500',
  },
});