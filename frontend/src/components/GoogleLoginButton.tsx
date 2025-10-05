// components/GoogleLoginButton.tsx
'use client';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/src/lib/firebase';
import { useRouter } from 'next/navigation';

export default function GoogleLoginButton() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Gửi đến backend
      await fetch('http://localhost:5000/api/auth/google/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL, // ✅ Gửi ảnh đến backend
          idToken: await user.getIdToken(), // Token để verify
        }),
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="px-4 py-2 bg-white border rounded-lg"
    >
      Login with Google
    </button>
  );
}
