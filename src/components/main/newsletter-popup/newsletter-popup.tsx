"use client";

import React, { useState, useContext } from 'react';
import { updateNewsletterSubscription } from '@/app/services/filmService';
import { AuthContext } from '@/app/context/authContext';
import './newsletter-popup.styles.css';

interface NewsletterPopupProps {
    onClose: () => void;
}

export default function NewsletterPopup({ onClose }: NewsletterPopupProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { user, updateUserData } = useContext(AuthContext);

    const handleSubscribe = async (subscribe: boolean) => {
        setIsLoading(true);
        try {
            await updateNewsletterSubscription(subscribe);
            console.log(`Користувач ${subscribe ? 'підписався' : 'відмовився'} від розсилки`);
            
            // Оновлюємо дані користувача в контексті
            if (user && updateUserData) {
                updateUserData({
                    ...user,
                    newsletterSubscription: subscribe
                });
                
                // Зберігаємо інформацію про те, що користувач зробив вибір
                localStorage.setItem(`newsletterChoice_${user.id}`, 'chosen');
            }
        } catch (error) {
            console.error('Помилка при оновленні підписки:', error);
        } finally {
            setIsLoading(false);
            onClose();
        }
    };

    return (
        <div className="newsletter-popup-overlay">
            <div className="newsletter-popup-content">
                <div className="newsletter-popup-header">
                    <h3>Розсилка новин</h3>
                    <button className="close-button" onClick={() => handleSubscribe(false)}>
                        &times;
                    </button>
                </div>
                
                <div className="newsletter-popup-body">
                    <p>
                        Хочете отримувати повідомлення про нові вистави, спеціальні пропозиції та цікаві події нашого театру?
                    </p>
                    <p className="newsletter-subtitle">
                        Ми надсилаємо тільки корисну інформацію та не спамимо!
                    </p>
                </div>

                <div className="newsletter-popup-actions">
                    <button 
                        className="subscribe-button"
                        onClick={() => handleSubscribe(true)}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Підписуюсь...' : 'Так, підписатися'}
                    </button>
                    <button 
                        className="skip-button"
                        onClick={() => handleSubscribe(false)}
                        disabled={isLoading}
                    >
                        Ні, дякую
                    </button>
                </div>
            </div>
        </div>
    );
} 