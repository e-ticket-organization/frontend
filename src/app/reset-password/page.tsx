import { Suspense } from 'react';
import RestorePass from '@/components/restore/restore-pass';

export const metadata = {
  title: 'Відновлення паролю | Театр',
  description: 'Сторінка відновлення паролю',
};

export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="loading-spinner-container"><div className="loading-spinner"></div></div>}>
      <RestorePass />
    </Suspense>
  );
} 