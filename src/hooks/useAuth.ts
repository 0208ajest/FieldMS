// Firebase認証フック
// UIに影響を与えない独立した認証フック

import { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChange, convertFirebaseUserToFirestoreUser } from '@/lib/auth';
import { FirestoreUser } from '@/types';

export const useAuth = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [firestoreUser, setFirestoreUser] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('🔄 useAuth hook initialized, loading:', loading);

  useEffect(() => {
    // タイムアウトを設定（10秒で強制的に読み込みを終了）
    const timeoutId = setTimeout(() => {
      console.log('⚠️ 認証タイムアウト: 強制的に読み込みを終了');
      setLoading(false);
    }, 10000);

    const unsubscribe = onAuthStateChange(async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
      setUser(user);
      if (user) {
        try {
          console.log('Converting Firebase user to Firestore user:', user.uid);
          const firestoreUserData = await convertFirebaseUserToFirestoreUser(user);
          console.log('Firestore user data:', firestoreUserData);
          setFirestoreUser(firestoreUserData);
        } catch (error) {
          console.error('Error converting user:', error);
          setFirestoreUser(null);
        }
      } else {
        setFirestoreUser(null);
      }
      setLoading(false);
      clearTimeout(timeoutId); // タイムアウトをクリア
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  return { 
    user, 
    firestoreUser, 
    loading,
    isAuthenticated: !!firestoreUser
  };
};
