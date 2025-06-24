"use client";

import { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { bookTickets } from '@/app/services/filmService';

const API_BASE = '/api';

async function fetchPaymentIntent(amount: number) {
  const url = `${API_BASE}/payment/create-payment-intent`;
  const token = localStorage.getItem('token');
  
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', '*/*');
  
  if (token) {
      headers.set('Authorization', `Bearer ${token}`);
  }
  
  const amountInSmallestUnits = Math.round(amount * 100);
  
  const payload = {
    amount: amountInSmallestUnits,
    currency: 'uah',
    description: 'Оплата квитків на виставу',
    metadata: {
      source: 'web-app',
      paymentType: 'tickets'
    }
  };
  
  console.log('Відправляємо запит на створення платежу:', payload);
  
  const response = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
          errorData = JSON.parse(errorText);
      } catch (e) {
          errorData = { message: errorText };
      }
      
      throw new Error(errorData.message || `Помилка запиту: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || 'pk_test_your_test_key');

interface PaymentFormProps {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
  bookingData?: any;
}

const PaymentForm = ({ amount, onSuccess, onCancel, bookingData }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleTestPayment = async () => {
    if (bookingData) {
      try {
        console.log('Викликаємо тестове бронювання з fake payment intent');
        const updatedBookingData = {
          ...bookingData,
          paymentData: {
            ...bookingData.paymentData,
            paymentIntentId: 'test_payment_' + Date.now()
          }
        };
        
        const result = await bookTickets(updatedBookingData);
        console.log('Результат тестового бронювання:', result);
        setSuccessMessage('🎉 Квитки успішно заброньовано!');
        setTimeout(() => {
          onSuccess(updatedBookingData.paymentData.paymentIntentId);
        }, 2000);
        return true;
      } catch (bookError) {
        console.error('Помилка при тестовому бронюванні:', bookError);
        setError('Помилка при бронюванні квитків. Спробуйте ще раз.');
        return false;
      }
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // У тестовому режимі відразу виконуємо тестову оплату
      if (process.env.NODE_ENV !== 'production') {
        console.log('Тестовий режим: виконуємо тестову оплату');
        const success = await handleTestPayment();
        if (success) {
          setLoading(false);
          return;
        }
      }
      
      // Отримуємо намір оплати з бекенда
      const response = await fetchPaymentIntent(amount);
      console.log('Payment intent створено:', response);
      
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Елемент карти не знайдено');
      
      // Підтверджуємо платіж
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        response.client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: 'Клієнт',
            },
          },
        }
      );
      
      if (error) {
        console.log('Помилка оплати:', error.message);
        setError(`Помилка оплати: ${error.message}`);
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('Fallback до тестової оплати...');
          await handleTestPayment();
        }
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Оплата успішна, ID платежу:', paymentIntent.id);
        
        // Тепер викликаємо бронювання після успішної оплати
        if (bookingData) {
          try {
            const updatedBookingData = {
              ...bookingData,
              paymentData: {
                ...bookingData.paymentData,
                paymentIntentId: paymentIntent.id
              }
            };
            
            const result = await bookTickets(updatedBookingData);
            console.log('Результат бронювання:', result);
            setSuccessMessage('🎉 Квитки успішно заброньовано!');
            
            setTimeout(() => {
              onSuccess(paymentIntent.id);
            }, 2000);
          } catch (bookError) {
            console.error('Помилка при бронюванні:', bookError);
            setError('Оплата пройшла, але виникла помилка при бронюванні. Зверніться до підтримки.');
          }
        }
      }
    } catch (err: any) {
      console.error('Помилка платежу:', err);
      setError(err.message || 'Помилка при обробці платежу');
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Fallback до тестової оплати через помилку...');
        await handleTestPayment();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    setError(event.error ? event.error.message : null);
  };

  return (
    <div className="modern-payment-container">
      <div className="payment-header">
        <div className="payment-icon">💳</div>
        <h3>Оплата квитків</h3>
        <p>До оплати: <strong>{amount.toFixed(2)} ₴</strong></p>
      </div>
      
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="success-message">
          <span className="success-icon">✅</span>
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="payment-form">
        <div className="card-section">
          <h4>💳 Дані банківської карти</h4>
          <div className="card-element-container">
            <CardElement 
              onChange={handleCardChange}
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#ffffff',
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
                    fontSmoothing: 'antialiased',
                    '::placeholder': {
                      color: '#9ca3af',
                    },
                    iconColor: '#7c3aed',
                  },
                  invalid: {
                    color: '#ef4444',
                    iconColor: '#ef4444',
                  },
                  complete: {
                    color: '#10b981',
                    iconColor: '#10b981',
                  },
                },
                hidePostalCode: true,
              }}
            />
          </div>
        </div>
        
        <div className="payment-actions">
          <button 
            type="button" 
            onClick={onCancel}
            className="btn-cancel"
            disabled={loading}
          >
            <span className="btn-icon">←</span>
            Назад
          </button>
          <button 
            type="submit" 
            className="btn-pay"
            disabled={loading || !stripe || !cardComplete}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Обробка...
              </>
            ) : (
              <>
                <span className="btn-icon">🔒</span>
                Оплатити {amount.toFixed(2)} ₴
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export const StripePaymentForm = ({ amount, onSuccess, onCancel, bookingData }: PaymentFormProps) => (
  <Elements stripe={stripePromise}>
    <PaymentForm 
      amount={amount} 
      onSuccess={onSuccess} 
      onCancel={onCancel} 
      bookingData={bookingData}
    />
  </Elements>
);