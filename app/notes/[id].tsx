import React, { useCallback, useEffect, useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../../styles/theme';
import { useUserStore } from '../../store/userStore';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from 'react-query';
import { axiosInstance } from '../../services/auth';
import { API_BASE_URL } from '../../services/config';
import { useTranslation } from 'react-i18next';

interface Note {
  id: string;
  name: string;
  note_type: 'text' | 'image' | 'audio' | 'pdf' | 'youtube' | 'test' | 'multi';
  transcript: string;
  md_summary_ai: string;
  status?: 'transcribed' | 'failed' | 'draft' | 'uploaded';
  processing_error_message?: string;
  youtube_id?: string;
  youtube_url?: string;
  questions?: any[];
  quiz_status?: string;
}

export default function NoteDetail() {
  const isLoggedIn = useUserStore((store) => store.isLoggedIn);
  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

  const { t } = useTranslation();
  const { id: noteId }: { id: string } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const companyId = useUserStore((store) => store.companyId);

  const [activeTab, setActiveTab] = useState<'overview' | 'transcript' | 'attachments'>('overview');

  const noteQuery = useQuery({
    queryKey: [`notes-${noteId}`],
    queryFn: async () => {
      return axiosInstance.get(API_BASE_URL + `/company/${companyId}/notes/${noteId}`);
    },
    enabled: !!companyId && !!noteId,
    refetchInterval: (data) => {
      const note = data?.data || {};
      const isNoteLoading = note.status !== 'failed' && note.status !== 'transcribed' && note.status !== 'draft';
      return isNoteLoading ? 5000 : false; // Poll every 5 seconds if still processing
    },
  });

  const noteData: Note | undefined = noteQuery.data?.data;
  const noteName = noteData?.name || t('Unknown Note');
  const isProcessingNote = noteData?.status !== 'failed' && noteData?.status !== 'transcribed' && noteData?.status !== 'draft';
  const isLoadingNote = noteQuery?.isLoading;
  const isFailed = noteData?.status === 'failed';

  const getIcon = () => {
    switch (noteData?.note_type) {
      case 'text':
      case 'audio':
        return 'mic-outline';
      case 'image':
        return 'image-outline';
      case 'pdf':
        return 'document-text-outline';
      case 'youtube':
        return 'logo-youtube';
      case 'test':
        return 'school-outline';
      case 'multi':
        return 'layers-outline';
      default:
        return 'document-outline';
    }
  };

  const renderTabContent = () => {
    if (isProcessingNote) {
      return (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.processingText, { color: theme.colors.outline }]}>
            {t('Processing')}
          </Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <ScrollView style={styles.contentContainer}>
            <Text style={[styles.contentText, { color: theme.colors.onSurface }]}>
              {noteData?.md_summary_ai || t('No summary available')}
            </Text>
          </ScrollView>
        );
      case 'transcript':
        return (
          <ScrollView style={styles.contentContainer}>
            <Text style={[styles.contentText, { color: theme.colors.onSurface }]}>
              {noteData?.transcript || t('No transcript available')}
            </Text>
          </ScrollView>
        );
      case 'attachments':
        return (
          <View style={styles.contentContainer}>
            {noteData?.youtube_id && (
              <View style={styles.attachmentItem}>
                <Ionicons name="logo-youtube" size={24} color={theme.colors.primary} />
                <Text style={[styles.attachmentText, { color: theme.colors.onSurface }]}>
                  {t('YouTube Video')}
                </Text>
              </View>
            )}
            {!noteData?.youtube_id && (
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                {t('No attachments')}
              </Text>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Ionicons name={getIcon()} size={20} color={theme.colors.primary} />
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {noteName}
          </Text>
        </View>
        
        <TouchableOpacity onPress={() => Alert.alert('More options', 'Coming soon')}>
          <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
      </View>

      {noteData?.processing_error_message && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {noteData.processing_error_message}
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => Alert.alert('AI Quiz', 'Quiz functionality coming soon')}
          style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
          disabled={isLoadingNote || isProcessingNote || isFailed}
        >
          <Ionicons name="school-outline" size={20} color={theme.colors.onSurface} />
          <Text style={[styles.actionButtonText, { 
            color: isLoadingNote || isProcessingNote ? theme.colors.onSurfaceVariant : theme.colors.onSurface 
          }]}>
            {t('AI Quiz')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => Alert.alert('Flashcards', 'Flashcards functionality coming soon')}
          style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
          disabled={isLoadingNote || isProcessingNote || isFailed}
        >
          <Ionicons name="layers-outline" size={20} color={theme.colors.onSurface} />
          <Text style={[styles.actionButtonText, { 
            color: isLoadingNote || isProcessingNote ? theme.colors.onSurfaceVariant : theme.colors.onSurface 
          }]}>
            {t('Flashcards')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={styles.tabButton} 
          onPress={() => setActiveTab('overview')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'overview' ? theme.colors.primary : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {t('Overview')}
          </Text>
          {activeTab === 'overview' && (
            <View style={[styles.tabIndicator, { backgroundColor: theme.colors.primary }]} />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabButton} 
          onPress={() => setActiveTab('transcript')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'transcript' ? theme.colors.primary : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {t('Transcript')}
          </Text>
          {activeTab === 'transcript' && (
            <View style={[styles.tabIndicator, { backgroundColor: theme.colors.primary }]} />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabButton} 
          onPress={() => setActiveTab('attachments')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'attachments' ? theme.colors.primary : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {t('Attachments')}
          </Text>
          {activeTab === 'attachments' && (
            <View style={[styles.tabIndicator, { backgroundColor: theme.colors.primary }]} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.contentSection}>
        {renderTabContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    textAlign: 'center',
  },
  errorContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: '80%',
    borderRadius: 1,
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    flex: 1,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    fontSize: 16,
    marginTop: 16,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    marginBottom: 12,
  },
  attachmentText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});