import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform
} from 'react-native';
// import Modal from 'react-native-modal';
import * as Sentry from '@sentry/react-native';
import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../../styles/theme';
import { useUserStore } from '@/store/userStore';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from 'react-query';
import { axiosInstance } from '@/services/auth';
import { API_BASE_URL } from '@/services/config';
import { unzip } from 'react-native-zip-archive';
import * as FileSystem from 'expo-file-system';
import { AudioPlayer } from '@/components/audio';
import { s, vs, ms } from 'react-native-size-matters';
import MaterialDownloadSVG from '../../assets/svgs/material-symbols_download.svg';

import RecordingIconDarkSVG from '../../assets/svgs/recordingTypeIconDark.svg';
import ImageTypeIconDarkSVG from '../../assets/svgs/imageTypeIconDark.svg';
import PdfTypeIconDarkSVG from '../../assets/svgs/pdfTypeIconDark.svg';
import YoutubeTypeIconDarkSVG from '../../assets/svgs/youtubeTypeIconDark.svg';
import AIOldPenGradientDark from '../../assets/svgs/aioldpengradientdark.svg';
import AIBrainBlueDark from '../../assets/svgs/aibrainbluedark.svg';
import NewFeatureIconDarkSVG from '../../assets/svgs/newfeatureicondark.svg';
import Markdown from 'react-native-markdown-display';
import ProgressCircle from '@/components/ProgressCircle';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { noteLogger } from '@/services/logger';
import { ISO_TO_LANGUAGE } from '@/assets/languages';
import YoutubePlayer from "react-native-youtube-iframe";
import { useTranslation } from 'react-i18next';
import QuizAlertsBottomSheet from '@/components/QuizAlertsBottomSheet';
import { POLLING_INTERVAL_MS } from '@/constants';
import { Header } from "@react-navigation/elements";
import { GenericAILoadingComponent } from '@/components/GenericAILoadingComponent';

const windowWidth = Dimensions.get('window').width * 0.9;
const videoHeight = windowWidth * (9 / 16); // Calculate height based on 16:9 aspect ratio

interface Note {
  id: string;
  title: string;
  overview: string;
  keyPoints: string[];
  transcript: string;
  type: 'text' | 'image';
  file_url?: string;
  input_token_count?: number;
  thoughts_token_count?: number;
  output_token_count?: number;
  total_token_count?: number;
}


export default function NoteDetail() {
  const isLoggedIn = useUserStore((store) => store.isLoggedIn);
  if (!isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }
  const { t } = useTranslation();
  const { noteId }: { noteId: string } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const navigation = useNavigation();
  const fullAdminAccess = useUserStore((store) => store.fullAdminAccess);
  const router = useRouter();
  const companyId = useUserStore((store) => store.companyId);

  const [activeTab, setActiveTab] = useState<'overview' | 'keyPoints' | 'transcript' | 'attachments'>('overview');
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [audioPaths, setAudioPaths] = useState<string[]>([]); // Changed from recordingUri
  const [pdfPaths, setPdfPaths] = useState<string[]>([]);
  const [textContent, setTextContent] = useState<string>('');
  // const [recordingUri, setRecordingUri] = useState<string>('');
  const [isProcessingFiles, setProcessingFiles] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const previewLoadingAlreadyFired = useRef(false);
  const [youtubePlaying, setYoutubePlaying] = useState(false);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleOpenBottomSheet = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);


  const noteQuery = useQuery({
    queryKey: [`notes-${noteId}`],
    queryFn: async () => {
      return axiosInstance.get(API_BASE_URL + `/company/${companyId}/notes/${noteId}`);
    },
    enabled: !!companyId,
    refetchInterval: (data, query) => {
      const note = data?.data || {};
      const isNoteLoading = note.status !== 'failed' && note.status !== 'transcribed' && note.status !== 'draft'
      if (isNoteLoading) {
        console.log('Note is still processing.. Polling enabled.');
        return POLLING_INTERVAL_MS;
      } else {
        console.log(`Note is ${note.status}. Polling disabled.`);
        return false; // Stop polling if no notes are in a loading state
      }
    },
  });
  const noteType = noteQuery?.data?.data.note_type
  const noteIdResponse = noteQuery.data?.data?.id || '';
  const noteFilesRequest = useQuery({
    queryKey: [`notes`, `${noteId}`, 'file'],
    queryFn: async () => {
      return axiosInstance.get(API_BASE_URL + `/company/${companyId}/notes/${noteId}/documents-url`);
    },
    enabled: !!noteIdResponse && noteType !== 'youtube',
    refetchInterval: (data, query) => {

      const note = data?.data || {};

      if (noteType == 'youtube') {
        return false
      }
      const isNoteFileProcessed = !!note.file_url;
      if (!isNoteFileProcessed) {
        noteLogger.note(noteId, 'Note files are still processing.. Get note polling enabled.');
        return POLLING_INTERVAL_MS;
      } else {
        noteLogger.note(noteId, 'Note files are processed..use them')
        return false; // Stop polling if no notes are in a loading state
      }
    },
  });

  // youtube
  const onStateChange = useCallback((state) => {
    if (state === "ended") {
      setYoutubePlaying(false);
      // Alert.alert("video has finished playing!");
    }
  }, []);
  // scroll to top
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    // Show button after scrolling past approximately 2-3 slides (adjust threshold as needed)
    setShowScrollTop(offsetY > 600);
  };
  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };
  const questions = (noteQuery.data?.data?.questions || []);
  const isGeneratingMaterial = noteQuery.data?.data?.quiz_status === 'in_progress';
  const correctly_answered_q = questions.filter((question: any) => question.user_answer !== null && question.user_answer === question.answer);
  const noteName = noteQuery.data?.data?.name || t('Unknown Note');
  const noteLanguageIso = (noteQuery.data?.data?.language || 'en').toUpperCase();
  const quizAlertEnabled = noteQuery.data?.data?.quiz_alerts_enabled || false;
  const isProcessingNote = noteQuery?.data?.data.status !== 'failed' && noteQuery?.data?.data.status !== 'transcribed' && noteQuery?.data?.data.status !== 'draft';
  const isLoadingNote = noteQuery?.isLoading;
  const isFailed = noteQuery?.data?.data.status === 'failed'
  const isFocused = useIsFocused();

  useEffect(() => {
    noteQuery.refetch();
    // noteFilesRequest
  }, [isFocused, noteId]);

  // Refactored preview file handling
  const handlePreviewFiles = async (noteFileRequestData: any) => {
    const noteData = noteQuery.data?.data;
    if (!noteFileRequestData?.file_url && !noteData?.youtube_url) {
      noteLogger.warn(noteId, 'Preview loading skipped: already processing or no file URL');
      return;
    }
    if (noteData?.youtube_url) {
      return;
    }

    setProcessingFiles(true);
    const notesDir = `${FileSystem.documentDirectory}notes/${noteId}/`;
    const fileUrl = noteFileRequestData?.file_url;
    const fileName = fileUrl?.split('/')?.pop()?.split('?')[0] || 'file.zip';
    const localFilePath = `${notesDir}${fileName}`;

    if (!fileName) {
      noteLogger.error(noteId, 'File name could not be determined from URL:', fileUrl);
      Sentry.captureMessage('File name could not be determined from URL', {
        extra: { noteId, fileUrl },
      });
      Alert.alert(t('Error'), t('Sorry cannot find this note preview, please try to refresh the app'));
      return;
    }

    try {
      noteLogger.note(noteId, 'Local file path:', localFilePath);
      await FileSystem.makeDirectoryAsync(notesDir, { intermediates: true });


      let fileExists = false;
      try {
        const fileInfo = await FileSystem.getInfoAsync(localFilePath);
        fileExists = fileInfo.exists;
        noteLogger.note(noteId, 'Local file check: ', fileInfo);
      } catch (error) {
        console.warn('Error checking local file:', error);
      }

      if (!fileExists) {
        noteLogger.note(noteId, 'Downloading file from:', fileUrl);
        await FileSystem.downloadAsync(fileUrl, localFilePath);
        noteLogger.note(noteId, 'File downloaded to:', localFilePath);
      } else {
        noteLogger.note(noteId, 'Using existing local file');
      }

      const unzipDir = `${notesDir}unzipped/`;
      await FileSystem.makeDirectoryAsync(unzipDir, { intermediates: true });

      noteLogger.note(noteId, 'Unzipping file to:', unzipDir);
      await unzip(localFilePath, unzipDir, 'UTF-8');

      noteLogger.note(noteId, 'Reading unzipped directory:', unzipDir);
      const files = await FileSystem.readDirectoryAsync(unzipDir);

      // Categorize files
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp'];
      const audioExtensions = ['.m4a', '.mp3', '.ogg', '.wav'];
      const pdfExtensions = ['.pdf'];
      const textExtensions = ['.txt'];

      const newImagePaths: string[] = [];
      const newAudioPaths: string[] = [];
      const newPdfPaths: string[] = [];
      let newTextContent = '';

      for (const file of files) {
        const filePath = `${unzipDir}${file}`;
        const extension = file.toLowerCase().match(/\.[^\.]+$/)?.[0] || '';

        if (imageExtensions.includes(extension)) {
          newImagePaths.push(filePath);
        } else if (audioExtensions.includes(extension)) {
          newAudioPaths.push(filePath);
        } else if (pdfExtensions.includes(extension)) {
          newPdfPaths.push(filePath);
        } else if (textExtensions.includes(extension)) {
          try {
            const content = await FileSystem.readAsStringAsync(filePath, { encoding: FileSystem.EncodingType.UTF8 });
            newTextContent += content + '\n';
          } catch (error) {
            noteLogger.warn(noteId, `Error reading text file ${file}:`, error);
          }
        }
      }

      noteLogger.note(noteId, 'Found files:', {
        images: newImagePaths.length,
        audios: newAudioPaths.length,
        pdfs: newPdfPaths.length,
        hasText: !!newTextContent,
      });

      setImagePaths(newImagePaths);
      setAudioPaths(newAudioPaths);
      setPdfPaths(newPdfPaths);
      setTextContent(newTextContent);

      FileSystem.deleteAsync(localFilePath, { idempotent: true }).catch((error) => {
        noteLogger.warn(noteId, 'Error cleaning up downloaded file:', error);
      });

    } catch (error) {
      console.error('Preview processing error:', error);
      FileSystem.deleteAsync(localFilePath, { idempotent: true }).catch((error) => {
        noteLogger.warn(noteId, 'Error cleaning up downloaded file:', error);
      });
      Sentry.captureException(error);
      Alert.alert('Error', t('Failed to open preview files, please reload the app'));
    } finally {
      setProcessingFiles(false);
      console.log('Preview processing completed');
    }
  };

  // Handle image/audio note preview
  useEffect(() => {
    if (noteFilesRequest.isSuccess && noteFilesRequest.data?.data && !previewLoadingAlreadyFired.current) {
      previewLoadingAlreadyFired.current = true;
      handlePreviewFiles(noteFilesRequest.data.data);
    }
  }, [noteFilesRequest.isSuccess, noteFilesRequest.data]);

  // Set navigation header options
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerBackTitleVisible: false,
      headerTitleAlign: 'center',
      style: { justifyContent: 'center' },
      headerTitle: () => (
        <View style={styles.titleContainer}>
          {getIcon()}
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {noteName}
          </Text>
        </View>
      ),

    });
  }, [navigation, noteName]);



  const getIcon = () => {
    switch (noteQuery.data?.data?.note_type) {
      case 'text':
        return <RecordingIconDarkSVG width={s(23)} height={s(23)} />;
      case 'image':
        return <ImageTypeIconDarkSVG width={s(23)} height={s(23)} />;
      case 'audio':
        return <RecordingIconDarkSVG width={s(23)} height={s(23)} />;
      case 'pdf':
        return <PdfTypeIconDarkSVG width={s(23)} height={s(23)} />;
      case 'youtube':
        return <YoutubeTypeIconDarkSVG width={s(23)} height={s(23)} />;
      default:
        return null;
    }
  };


    const markdownTranscript = useMemo(() => {
      if (noteType == 'youtube' || (noteQuery.data?.data?.transcript && noteQuery.data?.data?.transcript?.length > 20000) ) {
        return <Text style={{ color: theme.colors.onSurface, fontSize: ms(14), lineHeight: ms(20), fontFamily: styles.common.fontFamily }} numberOfLines={4200}>{noteQuery.data?.data?.transcript || t('No transcript available')}</Text>
      } 
      return (
        <Markdown 
          style={{
            body: { color: theme.colors.onSurface, fontSize: ms(14), lineHeight: ms(20), fontFamily: styles.common.fontFamily },
            text: { lineHeight: ms(25),  fontFamily: styles.common.fontFamily  },
            blockquote: { color: theme.colors.black },
            heading1: { color: theme.colors.tertiary, fontSize: ms(17), fontFamily: styles.boldFont.fontFamily, marginBottom: ms(7) },
            heading2: { color: theme.colors.tertiary, fontSize: ms(15), fontFamily: styles.boldFont.fontFamily, marginBottom: ms(5) },
            heading3: { color: theme.colors.tertiary, fontSize: ms(13), fontFamily: styles.boldFont.fontFamily, marginBottom: ms(3) },
            code_inline: { color: theme.colors.tertiary, backgroundColor: theme.colors.background },
            strong: { fontWeight: '600', fontFamily: styles.common.fontFamily },
            bullet_list: { marginVertical: ms(7), fontFamily: styles.common.fontFamily },
            list_item: { color: theme.colors.onSurface, fontSize: ms(14), lineHeight: ms(20), fontFamily: styles.common.fontFamily },
            hr: {
              backgroundColor: theme.colors.onSurface,
              height: 1
            },
            table: {
              borderWidth: 1,
              borderColor: theme.colors.onSurface,
              borderRadius: 3,
            },
            tr: {
              borderBottomWidth: 1,
              borderColor: theme.colors.onSurface,
              flexDirection: 'row',
            },
             fence: { color: theme.colors.tertiary , backgroundColor: theme.colors.background }
          }}

        >
        {/* <Text style={[styles.transcriptText, { color: theme.colors.onSurface }]}> */}

          {noteQuery.data?.data?.transcript || t('No transcript available')}
        {/* </Text> */}
        </Markdown>
      )
  }, [noteId, noteQuery.data?.data?.transcript]);

  const markdownOverview = useMemo(() => {
    return (
      <Markdown
        style={{
          body: { color: theme.colors.onSurface, fontSize: ms(14), lineHeight: ms(20), fontFamily: styles.common.fontFamily },
          text: { lineHeight: ms(25), fontFamily: styles.common.fontFamily },
          blockquote: { color: theme.colors.black },
          heading1: { color: theme.colors.tertiary, fontSize: ms(17), fontFamily: styles.boldFont.fontFamily, marginBottom: ms(7) },
          heading2: { color: theme.colors.tertiary, fontSize: ms(15), fontFamily: styles.boldFont.fontFamily, marginBottom: ms(5) },
          heading3: { color: theme.colors.tertiary, fontSize: ms(13), fontFamily: styles.boldFont.fontFamily, marginBottom: ms(3) },
          code_inline: { color: theme.colors.tertiary, backgroundColor: theme.colors.background },
          strong: { fontWeight: '600', fontFamily: styles.common.fontFamily },
          bullet_list: { marginVertical: ms(7), fontFamily: styles.common.fontFamily },
          list_item: { color: theme.colors.onSurface, fontSize: ms(14), lineHeight: ms(20), fontFamily: styles.common.fontFamily },
          hr: {
            backgroundColor: theme.colors.onSurface,
            height: 1
          },
          table: {
            borderWidth: 1,
            borderColor: theme.colors.onSurface,
            borderRadius: 3,
          },
          tr: {
            borderBottomWidth: 1,
            borderColor: theme.colors.onSurface,
            flexDirection: 'row',
          },
           fence: { color: theme.colors.tertiary , backgroundColor: theme.colors.background }
        }}

      >
        {/* <Text style={[styles.transcriptText, { color: theme.colors.onSurface }]}> */}
        {noteQuery.data?.data?.md_summary_ai || t('No summary available')}
        {/* </Text> */}
      </Markdown>
    )
  }, [noteId, noteQuery.data?.data?.md_summary_ai]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View>

        <Modal
          // presentationStyle="pageSheet"
          // key={selectedImage || 'modal'}
          visible={!!selectedImage}
          // onBackButtonPress={() => setSelectedImage(null)}
          // backdropColor='red'
          transparent={false}
          animationType="fade"

          onRequestClose={() => setSelectedImage(null)}
        >
          <View style={styles.fullScreenImageContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="close" size={s(30)} color="#fff" />
            </TouchableOpacity>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </View>

        </Modal>
      </View>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          onScroll={handleScroll}
          keyboardShouldPersistTaps="handled"
          // scrollEventThrottle={16}
          ref={scrollViewRef}
        >
          {/* <View style={styles.headerStyle}>
            <TouchableOpacity>
              <Ionicons
                name="arrow-back"
                size={s(20)}
                color={theme.colors.onSurface}
                onPress={() => router.back()}
                style={{ marginBottom: vs(8) }}
              />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              {getIcon()}
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                {noteName}
              </Text>
            </View>
            <View>
              <Ionicons
                name="ellipsis-vertical"
                size={s(20)}
                color={theme.colors.onSurface}
                onPress={() => console.log('More options')}
                style={{ marginBottom: vs(8) }}
              />
            </View>
          </View> */}
          <View style={styles.topButtonsContainer}>
            {/* <TouchableOpacity
              onPress={() => router.push({ pathname: '/(home)/notequiz/quizscreen', params: { noteId } })}
              style={[styles.languageButton]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {ISO_TO_LANGUAGE[noteLanguageIso] && <Text style={[styles.actionButtonText, { color: isLoadingNote  || isProcessingNote ?  theme.colors.elevation.level5 : theme.colors.onSurface  }]}>
                  {ISO_TO_LANGUAGE[noteLanguageIso].flag}{'  '}{ISO_TO_LANGUAGE[noteLanguageIso].language}
                </Text>}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="chevron-down" size={s(20)} color={theme.colors.primary} />
              </View>
            </TouchableOpacity> */}
            <TouchableOpacity
              ph-label="note-alerts"
              onPress={handleOpenBottomSheet}
              style={[styles.actionButton, { gap: s(1), marginLeft: s(5) }]}
              disabled={isLoadingNote || isProcessingNote}
            >
              <View style={{ gap: s(5), flexDirection: 'row', alignItems: 'center' }}>
                <View>
                  <NewFeatureIconDarkSVG
                    width={s(12)}
                    height={s(12)}
                    style={{ position: 'absolute', bottom: s(10), left: s(10), zIndex: 1 }}
                  />
                  <Ionicons name="notifications-outline" size={s(20)} color={theme.colors.primary} />
                </View>
                <Text style={[styles.actionButtonText, { fontSize: ms(15, 0.6), color: isLoadingNote || isProcessingNote ? theme.colors.elevation.level5 : theme.colors.onSurface }]}>
                  {t('Quiz Alerts')}
                </Text>
                <Ionicons name="chevron-down" size={s(20)} color={theme.colors.primary} />
              </View>
            </TouchableOpacity>
          </View>
          {noteQuery.data?.data?.processing_error_message && <Text style={{ alignSelf: 'center', textAlign: 'center', marginBottom: s(30), fontSize: ms(14), color: theme.colors.error }}>
            {noteQuery.data?.data?.processing_error_message}
          </Text>}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(home)/notequiz/quizscreen', params: { noteId } })}
              style={[styles.actionButton, styles.actionButtonBordered, { marginRight: s(5), backgroundColor: theme.colors.surface }]}
              disabled={isLoadingNote || isProcessingNote || isFailed}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {
                  !isLoadingNote && <AIOldPenGradientDark width={s(23)} height={s(23)} />
                }
                <Text style={[styles.actionButtonText, { color: isLoadingNote || isProcessingNote ? theme.colors.elevation.level5 : theme.colors.onSurface }]}>
                  {t('AI Quiz')}
                </Text>
              </View>
              {questions.length > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', color: theme.colors.onSurface, fontSize: ms(10, 0.9) }}>
                    {correctly_answered_q.length}/{questions.length}
                  </Text>
                  <ProgressCircle
                    progress={(correctly_answered_q.length / questions.length) * 100 || 0}
                    size={s(22)}
                    strokeWidth={2}
                    theme={theme}
                  />
                </View>
              )}
              {isGeneratingMaterial && <ActivityIndicator />}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(home)/notequiz/flashcards', params: { noteId } })}
              style={[styles.actionButton, styles.actionButtonBordered, { marginLeft: s(5), backgroundColor: theme.colors.surface }]}
              disabled={isLoadingNote || isProcessingNote || isFailed}
            >
              <View style={{ gap: s(15), flexDirection: 'row', alignItems: 'center' }}>
                {
                  !isLoadingNote && <AIBrainBlueDark width={s(23)} height={s(23)} />
                }

                <Text style={[styles.actionButtonText, { color: isLoadingNote || isProcessingNote ? theme.colors.elevation.level5 : theme.colors.onSurface }]}>
                  {t('Flashcards')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={{ marginVertical: vs(8) }}>
            {isProcessingFiles && <View style={styles.imagePreviewContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>}
            {noteQuery.data?.data?.youtube_id && (
              <View style={{ marginVertical: vs(8), alignItems: 'center' }}>

                <YoutubePlayer
                  width={windowWidth - 34 }
                  height={videoHeight- 20}
                  webViewStyle={{ borderRadius: 10 }}
                  play={youtubePlaying}
                  videoId={noteQuery.data?.data?.youtube_id}
                  // videoId={"7HZsPCQaNZI"}
                  onChangeState={onStateChange}
                />
              </View>
            )}
            {imagePaths && imagePaths.length > 0 && (
              <View style={styles.imagePreviewContainer}>
                {isProcessingFiles ? (
                  <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
                    {t('Loading images...')}
                  </Text>
                ) :
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {imagePaths.map((path, index) => (
                      <TouchableOpacity key={index} onPress={() => setSelectedImage(path)}>
                        <Image
                          source={{ uri: path }}
                          style={styles.previewImage}
                        // resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>}
              </View>
            )}
            {audioPaths && (<View >
              {audioPaths.map((recordingUri, index) => <AudioPlayer viewStyle={{ marginBottom: vs(8) }} key={'audio' + index} source={recordingUri} />)}
            </View>
            )}
          </View>
          {fullAdminAccess && (
            <View style={[styles.tokenContainer, { borderColor: theme.colors.surfaceVariant, borderWidth: 1 }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                {t('Token Breakdown')}
              </Text>
              <View style={styles.tokenItem}>
                <Ionicons name="log-in-outline" size={s(17)} color={theme.colors.primary} style={styles.tokenIcon} />
                <Text style={[styles.tokenLabel, { color: theme.colors.onSurface }]}>
                  {t('Input Tokens')}:
                </Text>
                <Text style={[styles.tokenValue, { color: theme.colors.onSurface }]}>
                  {noteQuery.data?.data?.prompt_token_count ?? 'N/A'}
                </Text>
              </View>
              <View style={styles.tokenItem}>
                <Ionicons name="bulb-outline" size={s(17)} color={theme.colors.primary} style={styles.tokenIcon} />
                <Text style={[styles.tokenLabel, { color: theme.colors.onSurface }]}>
                  {`${t('Thoughts Tokens')}:`}
                </Text>
                <Text style={[styles.tokenValue, { color: theme.colors.onSurface }]}>
                  {noteQuery.data?.data?.thoughts_token_count ?? 'N/A'}
                </Text>
              </View>
              <View style={styles.tokenItem}>
                <Ionicons name="log-out-outline" size={s(17)} color={theme.colors.primary} style={styles.tokenIcon} />
                <Text style={[styles.tokenLabel, { color: theme.colors.onSurface }]}>
                  {`${t('Output Tokens')}:`}
                </Text>
                <Text style={[styles.tokenValue, { color: theme.colors.onSurface }]}>
                  {noteQuery.data?.data?.output_token_count ?? 'N/A'}
                </Text>
              </View>
              <View style={styles.tokenItem}>
                <Ionicons name="stats-chart-outline" size={s(17)} color={theme.colors.primary} style={styles.tokenIcon} />
                <Text style={[styles.tokenLabel, { color: theme.colors.onSurface }]}>
                  {`${t('Total Tokens')}:`}
                </Text>
                <Text style={[styles.tokenValue, { color: theme.colors.onSurface }]}>
                  {noteQuery.data?.data?.total_token_count ?? 'N/A'}
                </Text>
              </View>
            </View>
          )}
          <View style={styles.tabContainer}>
            <TouchableOpacity ph-label="overview" style={[styles.tabButton]} onPress={() => setActiveTab('overview')}>
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === 'overview' ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {t('Overview')}
              </Text>
              {activeTab === 'overview' && (
                <View style={[styles.tabIndicator, { backgroundColor: theme.colors.secondary }]} />
              )}
            </TouchableOpacity>
            <TouchableOpacity ph-label="transcript" style={[styles.tabButton]} onPress={() => setActiveTab('transcript')}>
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === 'transcript' ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {t('Transcript')}
              </Text>
              {activeTab === 'transcript' && (
                <View style={[styles.tabIndicator, { backgroundColor: theme.colors.secondary }]} />
              )}
            </TouchableOpacity>
            <TouchableOpacity ph-label="attachments" style={[styles.tabButton]} onPress={() => setActiveTab('attachments')}>
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === 'attachments' ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {t('Attachments')}
              </Text>
              {activeTab === 'attachments' && (
                <View style={[styles.tabIndicator, { backgroundColor: theme.colors.secondary }]} />
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.section}>
            <View style={[styles.contentContainer]}>
              {
                isProcessingNote ? <GenericAILoadingComponent subtitle={t('Processing')} /> :
                  (
                    activeTab === 'overview' ? markdownOverview : activeTab == 'transcript' ? markdownTranscript : <View>
                      {noteType != 'youtube' ? <View style={{ justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'center', marginBottom: vs(10) }}>

                        <TouchableOpacity
                          onPress={async () => {
                            // REFACTOR WHOLE ATTACHMENTS SECTION Separate to component properly, refactor test carefully. add icons to items and style file names cards a bit better
                            if (imagePaths.length > 0 || audioPaths.length > 0 || pdfPaths.length > 0 || textContent) {
                              const allPaths = [...imagePaths, ...audioPaths, ...pdfPaths];
                              const zipFileName = `note_${noteId}_attachments.zip`;
                              const zipFilePath = `${FileSystem.documentDirectory}${zipFileName}`;
                              const resp = await axiosInstance.get(API_BASE_URL + `/company/${companyId}/notes/${noteId}/documents-url`);
                              resp.status === 200 && noteLogger.note(noteId, 'Received zip URL:', resp.data.file_url);
                              if (resp.status !== 200 || !resp.data.file_url) {
                                Alert.alert(t('Download Failed'), t('Failed to retrieve attachments zip URL.'));
                                return;
                              }
                              noteLogger.note(noteId, 'Downloading attachments zip from:', resp.data.file_url);
                              const fileUrl = resp.data.file_url;

                              // we have zip url 
                              FileSystem.makeDirectoryAsync(FileSystem.documentDirectory, { intermediates: true })
                                .then(() => {
                                  return FileSystem.downloadAsync(
                                    fileUrl,
                                    zipFilePath
                                  );
                                })
                                .then(async (r) => {
                                  console.log(r)
                                  const shareAvailable = await Sharing.isAvailableAsync();
                                  console.log('Share available:', shareAvailable);
                                  if (!shareAvailable) {
                                    Alert.alert(t('Sharing Not Available'), t('Please install a file manager app to open the downloaded file.'));
                                    return;
                                  }
                                  if (Platform.OS === 'ios' && shareAvailable) {
                                    await Sharing.shareAsync(r.uri, {
                                      mimeType: 'application/zip', // or appropriate mime type
                                      dialogTitle: 'Save downloaded file'
                                    });
                                  }
                                  Alert.alert(t('Download Complete'), t('All attachments have been downloaded successfully.'));
                                })
                                .catch((error) => {
                                  console.error('Download error:', error);
                                  Alert.alert(t('Download Failed'), t('Failed to download attachments.'));
                                });
                            }
                          }}
                        // style={[styles.downloadAllButton, { backgroundColor: theme.colors.primary }]}
                        >
                          <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>
                            {t('Download All')}
                          </Text>
                        </TouchableOpacity>
                        {/* <MaterialDownloadSVG width={s(20)} height={s(20)} style={{ marginLeft: s(5) }} /> */}
                      </View> : <View>
                        <Text style={[{ textAlign: 'center', alignSelf: 'center' }, { color: theme.colors.onSurface }]}>
                          {t('No attachments')}
                        </Text>
                      </View>}
                      {audioPaths.length > 0 && audioPaths.map((path, index) => (

                        <View key={index} style={{
                          backgroundColor: theme.colors.surface,
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: 16,
                          // marginTop: 16,
                          marginVertical: vs(5),
                          borderRadius: 12,
                          // marginTop: 20,
                        }}>
                          <Ionicons name="musical-notes" size={s(20)} color={theme.colors.onSurface} style={{ marginRight: s(10) }} />
                          <Text style={[styles.attachmentTitle, { color: theme.colors.onSurface }]}>
                            {path.split('/').pop()}
                          </Text>
                        </View>
                      ))}
                      {imagePaths.length > 0 && imagePaths.map((path, index) => (

                        <View style={{
                          backgroundColor: theme.colors.surface,
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: 16,
                          // marginTop: 16,
                          borderRadius: 12,
                          marginVertical: vs(5),
                          // marginTop: 20,
                        }}>
                          <Ionicons name="image" size={s(20)} color={theme.colors.onSurface} style={{ marginRight: s(10) }} />
                          <Text style={[styles.attachmentTitle, { color: theme.colors.onSurface }]}>
                            {path.split('/').pop()}
                          </Text>
                        </View>
                      ))}
                      {pdfPaths.length > 0 && pdfPaths.map((path, index) => (

                        <View style={{
                          backgroundColor: theme.colors.surface,
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: 16,
                          // marginTop: 16,
                          marginVertical: vs(5),
                          borderRadius: 12,
                          // marginTop: 20,
                        }}>
                          <Ionicons name="document-text" size={s(20)} color={theme.colors.onSurface} style={{ marginRight: s(10) }} />
                          <Text style={[styles.attachmentTitle, { color: theme.colors.onSurface }]}>
                            {path.split('/').pop()}
                          </Text>
                        </View>
                      ))}
                      {textContent && (
                        <View style={{
                          backgroundColor: theme.colors.surface,
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: 16,
                          // marginTop: 16,
                          marginVertical: vs(5),
                          borderRadius: 12,
                          // marginTop: 20,
                        }}>
                          <Ionicons name="text" size={s(20)} color={theme.colors.onSurface} style={{ marginRight: s(10) }} />
                          <Text style={[styles.attachmentTitle, { color: theme.colors.onSurface }]}>
                            {t('Text Content')}
                          </Text>
                        </View>
                      )}
                    </View>
                  )
              }
            </View>
          </View>
        </ScrollView>
        {/* <TouchableOpacity style={[styles.challengeButton, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.challengeButtonText, { color: theme.colors.onPrimary }]}>
            {t('Challenge AI')}
          </Text>
          <SparkAISVG width={s(16)} height={s(16)} />
        </TouchableOpacity> */}
        {showScrollTop && <TouchableOpacity
          style={[
            styles.scrollTopButton,
            { backgroundColor: theme.colors.primary }
          ]}
          onPress={scrollToTop}
        >
          <Ionicons name="chevron-up" size={s(24)} color={theme.colors.onPrimary} />
        </TouchableOpacity>}
        <QuizAlertsBottomSheet
          ref={bottomSheetRef}
          quizAlertEnabled={quizAlertEnabled}
          noteName={noteName}
          noteId={noteId}
          companyId={companyId}
        />
      </View>

    </GestureHandlerRootView>
  );
}

// Styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerStyle: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: 'yellow'
  },
  titleContainer: {
    flexDirection: 'row',
    gap: s(11),
    alignItems: 'center',
    justifyContent: 'space-around',
    textAlign: 'center',
    maxWidth: '95%',
    paddingHorizontal: 5
  },
  common: {
    fontFamily: 'Inter_400Regular',
  },
  boldFont: {
    fontFamily: 'Inter_700Bold',
  },
  scrollContent: {
    // backgroundColor: 
    paddingHorizontal: s(17),
    paddingTop: vs(17),
    paddingBottom: vs(85),
  },
  imagePreviewContainer: {
    marginTop: vs(15),
  },
  previewImage: {
    width: s(100),
    height: vs(70),
    borderRadius: 8,
    // marginTop: vs(20),
    marginRight: s(8),
  },
  loadingText: {
    fontSize: ms(14),
    textAlign: 'center',
  },
  loadingContent: {
    textAlign: 'left',
    fontSize: ms(15),
    fontFamily: 'Inter_500Medium'
  },
  languageButton: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: vs(10),
    gap: s(5),
    marginHorizontal: s(5),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topButtonsContainer: {
    flexDirection: 'row',
    marginBottom: vs(10),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: ms(10),
    alignItems: 'center',
    gap: s(5),
    justifyContent: 'center',
  },
  actionButtonBordered: {
    borderWidth: 1,
    borderColor: '#363636',
  },
  actionButtonText: {
    fontSize: ms(15, 0.6),
    fontFamily: 'Inter_700Bold',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: vs(14),
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: vs(10),
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: ms(15),
    fontFamily: 'Inter_700Bold',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '90%',
    borderRadius: 2,
  },
  section: {
    marginBottom: vs(20),
  },
  contentContainer: {
    borderRadius: 12,
    padding: s(14),
  },
  attachmentTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: ms(15),
  },
  transcriptText: {
    fontSize: ms(12),
    fontFamily: 'Inter_400Regular',
    lineHeight: ms(19),
  },
  challengeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: vs(25),
    left: s(17),
    right: s(17),
    borderRadius: 12,
    paddingVertical: vs(14),
    alignItems: 'center',
  },
  challengeButtonText: {
    fontSize: ms(15, 0.9),
    fontFamily: 'Inter_700Bold',
    fontWeight: '600',
  },
  tokenContainer: {
    borderRadius: 12,
    padding: s(14),
    marginBottom: vs(14),
  },
  sectionTitle: {
    fontSize: ms(15),
    fontWeight: '600',
    textAlign: 'center',
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(7),
  },
  tokenIcon: {
    marginRight: s(7),
  },
  tokenLabel: {
    fontSize: ms(14),
    fontWeight: '500',
    flex: 1,
  },
  tokenValue: {
    fontSize: ms(14),
    fontWeight: '600',
  },
  bottomButtonContainer: {
    paddingVertical: vs(16),
    paddingHorizontal: s(20),
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  bottomSheetContent: {
    flex: 1,
    padding: s(17.5),
  },
  bottomSheetTitle: {
    fontSize: ms(18),
    fontWeight: '600',
    marginBottom: vs(17.5),
    textAlign: 'center',
  },
  bottomSheetIllustrationContainer: {
    alignItems: 'center',
  },
  bottomSheetNoteName: {
    fontSize: ms(16),
    fontWeight: '500',
    textAlign: 'center',
    marginTop: vs(10),
  },
  enableButton: {
    paddingVertical: vs(12),
    paddingHorizontal: s(24),
    alignItems: 'center',
  },
  enableButtonText: {
    fontSize: ms(18),
    fontWeight: '600',
  },
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '90%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: vs(40),
    right: s(20),
    zIndex: 1,
  },
  scrollTopButton: {
    position: 'absolute',
    bottom: vs(100),
    right: s(17),
    borderRadius: 50,
    width: s(50),
    height: s(50),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});