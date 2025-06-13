'use client';

import React, { useEffect, useContext, useState } from 'react';
import './page.module.css';
import Header from '@/components/main/header/header';
import Favorite from '@/components/main/favorite/favorite';
import Recomendation from '@/components/main/recomendations/recomendation';
import Footer from '@/components/footer/footer';
import { AuthContext } from '@/app/context/authContext';
import NewsletterPopup from '@/components/main/newsletter-popup/newsletter-popup';

export default function Page() {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [showNewsletterPopup, setShowNewsletterPopup] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const hasSeenNewsletterPopup = localStorage.getItem(`newsletterChoice_${user.id}`);
      
      if (user.status !== 'admin' && !hasSeenNewsletterPopup) {
        setTimeout(() => {
          setShowNewsletterPopup(true);
        }, 1000);
      }
    }
  }, [isAuthenticated, user]);

  const handleCloseNewsletterPopup = () => {
    setShowNewsletterPopup(false);
    
    if (user) {
      localStorage.setItem(`newsletterChoice_${user.id}`, 'seen');
    }
  };

  return (
    <div>
      <Header />
      <Favorite />
      <Footer />
      
      {showNewsletterPopup && (
        <NewsletterPopup onClose={handleCloseNewsletterPopup} />
      )}
    </div>
  );
}


