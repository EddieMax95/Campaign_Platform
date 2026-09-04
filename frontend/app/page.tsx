'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const loginTimestamp = localStorage.getItem('loginTimestamp');
    const THREE_DAYS = 259200000;

    if (!token || !loginTimestamp || Date.now() - parseInt(loginTimestamp, 10) > THREE_DAYS) {
      localStorage.clear();
      router.replace('/login');
    } else {
      router.replace('/dashboard');
    }
  }, [router]);

  return null;
}