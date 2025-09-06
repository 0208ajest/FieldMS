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

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      if (user) {
        setFirestoreUser(convertFirebaseUserToFirestoreUser(user));
      } else {
        setFirestoreUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { 
    user, 
    firestoreUser, 
    loading,
    isAuthenticated: !!user
  };
};
