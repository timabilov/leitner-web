import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useQuery, useQueryClient } from 'react-query';
import { useUserStore } from '../../store/userStore';
import { axiosInstance } from '../../services/auth';
import { API_BASE_URL } from '../../services/config';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../../styles/theme';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import debounce from 'lodash.debounce';

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
  return note.status !== 'failed' && note.status !== 'transcribed' && note.status !== 'draft';
};

export default function NotesIndex() {
  const { t } = useTranslation();
  const isLoggedIn = useUserStore(store => store.isLoggedIn);
  const email = useUserStore(store => store.email);
  const userName = useUserStore(store => store.userName);
  const userId = useUserStore(store => store.userId);
  const companyId = useUserStore(store => store.companyId);
  
  if (!isLoggedIn || !companyId) {
    return <Redirect href="/login" />;
  }

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const queryClient = useQueryClient();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

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
    refetchInterval: (data) => {
      const notes = data?.data?.notes;
      if (!notes || !Array.isArray(notes) || notes.length === 0) {
        return false;
      }
      const hasLoadingNotes = notes.some(isNoteInLoadingState);
      return hasLoadingNotes ? 5000 : false; // Poll every 5 seconds if there are loading notes
    },
    onError: (error) => {
      console.error('Get notes error:', error);
    },
  });

  const searchNotesQuery = useQuery({
    queryKey: ['searchNotes', searchQuery],
    queryFn: () => searchNotes(searchQuery),
    enabled: true,
    onError: (error) => {
      console.error('Search error:', error);
    },
  });

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  const onRefresh = useCallback(() => {
    notesQuery.refetch();
    if (searchQuery) {
      queryClient.invalidateQueries(['searchNotes']);
    }
  }, [notesQuery, searchQuery, queryClient]);

  const getIcon = (noteType: string) => {
    switch (noteType) {
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

  const renderNoteItem = ({ item }: { item: Note }) => {
    const isDraft = item.status === 'draft';
    const isItemProcessing = isNoteInLoadingState(item);
    const created_at = new Date(item.created_at);
    const formattedDate = created_at.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        style={[styles.noteItem, { backgroundColor: theme.colors.surface }]}
        onPress={() => router.push(`/notes/${item.id}`)}
      >
        <View style={[styles.noteIconContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Ionicons
            name={getIcon(item.note_type)}
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
        </View>
        
        <View style={styles.noteContent}>
          <View style={styles.noteHeader}>
            {item.processing_error_message && (
              <Ionicons name="warning-outline" size={20} color={theme.colors.error} style={{ marginRight: 10 }} />
            )}
            <Text style={[styles.noteTitle, { color: theme.colors.onSurface }]} numberOfLines={1} ellipsizeMode="tail">
              {isDraft ? t('Draft {{id}}', { id: item.id }) : item.name}
            </Text>
            {item?.quiz_alerts_enabled && (
              <Ionicons name="notifications" size={16} color={theme.colors.primary} />
            )}
          </View>
          <Text style={[styles.noteDate, { color: theme.colors.onSurfaceVariant }]}>{formattedDate}</Text>
        </View>

        {isItemProcessing && (
          <View style={styles.processingIndicator}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.processingText, { color: theme.colors.outline }]}>
              {t('Processing')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const onCreateNewNote = () => {
    // For now, just show an alert. Later you can implement note creation
    Alert.alert(t('Create New Note'), t('Note creation will be implemented next'));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          {t('All notes')}
        </Text>
        <TouchableOpacity onPress={() => Alert.alert('Settings', 'Settings coming soon')}>
          <Ionicons name="settings-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color={theme.colors.primary}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, {
            color: theme.colors.onSurface,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline,
          }]}
          placeholder={t("Search transcripts..")}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          onChangeText={debouncedSearch}
        />
      </View>

      <FlatList
        data={searchQuery ? (searchNotesQuery.data || []) : (notesQuery.data?.data?.notes || [])}
        renderItem={renderNoteItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            {(notesQuery.isLoading || searchNotesQuery.isLoading) && <ActivityIndicator size="large" />}
            {searchNotesQuery.isError && (
              <Text style={[styles.emptyText, { color: theme.colors.error }]}>{t('Failed to search notes')}</Text>
            )}
            {!notesQuery.isLoading && !searchNotesQuery.isLoading && !notesQuery.data?.data?.notes.length && !searchQuery && (
              <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>{t('No notes available')}</Text>
            )}
            {searchQuery && !searchNotesQuery.isLoading && !searchNotesQuery.data?.length && (
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>{t('No results found')}</Text>
            )}
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={notesQuery.isRefetching || searchNotesQuery.isRefetching}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      />

      <TouchableOpacity 
        onPress={onCreateNewNote} 
        style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
      >
        <Text style={[styles.createButtonText, { color: theme.colors.onPrimary }]}>
          {t('Create new note')}
        </Text>
        <Ionicons name="add" size={18} color={theme.colors.onPrimary} style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchIcon: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 45,
    paddingRight: 15,
    fontSize: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  noteIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  noteContent: {
    flex: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  noteTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  noteDate: {
    fontSize: 12,
    marginTop: 2,
  },
  processingIndicator: {
    alignItems: 'center',
    marginLeft: 10,
  },
  processingText: {
    fontSize: 10,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});