"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { requestPasswordReset, resetPassword } from '@/app/services/authService';
import './restore-pass.styles.css';

function RestorePassWithToken({ 
  onTokenFound 
}: { 
  onTokenFound: (token: string) => void 
}) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    if (searchParams) {
      const tokenParam = searchParams.get('token');
      
      if (tokenParam) {
        onTokenFound(tokenParam);
      }
    }
  }, [searchParams, onTokenFound]);
  
  return null;
}

export default function RestorePass() {
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [token, setToken] = useState('');
    const router = useRouter();
    const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');

    const handleTokenFound = (foundToken: string) => {
        setToken(foundToken);
        setStep('reset');
    };

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const response = await requestPasswordReset(email);
            setMessage({ 
                text: response.message || 'Інструкції з відновлення паролю відправлені на вашу електронну пошту', 
                type: 'success' 
            });
        } catch (error: any) {
            setMessage({ 
                text: error.message || 'Виникла помилка при відправці запиту. Спробуйте ще раз.', 
                type: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        if (newPassword !== confirmPassword) {
            setMessage({ 
                text: 'Паролі не співпадають. Перевірте введені дані.', 
                type: 'error' 
            });
            setLoading(false);
            return;
        }

        try {
            const response = await resetPassword(token, newPassword, confirmPassword);
            setMessage({ 
                text: response.message || 'Пароль успішно змінено', 
                type: 'success' 
            });
            setStep('success');
        } catch (error: any) {
            setMessage({ 
                text: error.message || 'Виникла помилка при зміні паролю. Спробуйте ще раз.', 
                type: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        router.push('/');
    };

    const handleLogin = () => {
        router.push('/');
    };

    return (
        <div className="restore-container">
            <Suspense fallback={null}>
                <RestorePassWithToken onTokenFound={handleTokenFound} />
            </Suspense>

            <div className="restore-content">
                <button className="close-button" onClick={handleClose}>&times;</button>
                
                {step === 'request' && (
                    <>
                        <h2 className="restore-title">Відновлення паролю</h2>
                        <p className="restore-subtitle">
                            Введіть вашу електронну адресу і ми надішлемо вам інструкції з відновлення паролю
                        </p>
                        
                        {message.text && (
                            <div className={`${message.type}-message`}>{message.text}</div>
                        )}
                        
                        {loading && <div className="loading-spinner"></div>}
                        
                        <form onSubmit={handleRequestReset}>
                            <div className="form-group">
                                <label className="form-label">Електронна пошта</label>
                                <input 
                                    type="email" 
                                    className="form-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="Введіть вашу електронну пошту"
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                className="restore-button" 
                                disabled={loading}
                            >
                                Відновити пароль
                            </button>
                        </form>
                    </>
                )}
                
                {step === 'reset' && (
                    <>
                        <h2 className="restore-title">Створення нового паролю</h2>
                        <p className="restore-subtitle">
                            Введіть та підтвердіть ваш новий пароль
                        </p>
                        
                        {message.text && (
                            <div className={`${message.type}-message`}>{message.text}</div>
                        )}
                        
                        {loading && <div className="loading-spinner"></div>}
                        
                        <form onSubmit={handleResetPassword}>
                            <div className="form-group">
                                <label className="form-label">Новий пароль</label>
                                <input 
                                    type="password" 
                                    className="form-input"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    placeholder="Введіть новий пароль"
                                    minLength={6}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Підтвердження паролю</label>
                                <input 
                                    type="password" 
                                    className="form-input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Підтвердіть новий пароль"
                                    minLength={6}
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                className="restore-button" 
                                disabled={loading}
                            >
                                Зберегти новий пароль
                            </button>
                        </form>
                    </>
                )}
                
                {step === 'success' && (
                    <>
                        <h2 className="restore-title">Пароль успішно відновлено</h2>
                        <p className="restore-subtitle">
                            Ваш пароль був успішно змінений. Тепер ви можете увійти в систему, використовуючи ваш новий пароль.
                        </p>
                        
                        <button 
                            className="restore-button" 
                            onClick={handleLogin}
                        >
                            Увійти в систему
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}