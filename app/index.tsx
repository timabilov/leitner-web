import React from 'react';
import { Redirect } from 'expo-router';
import { useUserStore } from '../store/userStore';

export default function IndexScreen() {
  const isLoggedIn = useUserStore(state => state.isLoggedIn);
  const companyId = useUserStore(state => state.companyId);

  if (!isLoggedIn || !companyId) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/notes" />;
}