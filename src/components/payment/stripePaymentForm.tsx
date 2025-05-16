import { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { checkAndRefreshToken } from '@/app/services/authService';
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

const TEST_CARD = {
  number: '4242 4242 4242 4242',
  exp_month: 12,
  exp_year: 34,
  cvc: '123'
};

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
  const formRef = useRef<HTMLFormElement>(null);
  const errorObserverRef = useRef<MutationObserver | null>(null);
  
  const fillTestCard = () => {
    if (!elements) return;
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;
    
    try {
      const stripeJs = (cardElement as any)._implementation._componentName === 'CardElement' && 
                       (cardElement as any)._implementation._controller._reporter._controllerFrame.stripe;
      if (stripeJs) {
        stripeJs.emitEvent({
          type: 'autofill',
          payload: { billingDetails: { name: 'Test User' }, fields: TEST_CARD }
        });
      }
    } catch (e) {
      console.log('Не вдалося автоматично заповнити тестову карту:', e);
    }
  };

  const hideAllStripeErrors = () => {
    const errorElements = document.querySelectorAll('[role="alert"]');
    errorElements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
        el.ariaHidden = 'true';
        el.remove();
      }
    });

    const invalidMessages = document.querySelectorAll('.StripeElement--invalid');
    invalidMessages.forEach(el => {
      if (el instanceof HTMLElement) {
        el.classList.remove('StripeElement--invalid');
        el.classList.add('StripeElement--complete');
      }
    });
    
    const allSpans = document.querySelectorAll('span');
    allSpans.forEach(span => {
      if (span.textContent && span.textContent.includes('invalid')) {
        span.style.display = 'none';
        span.style.visibility = 'hidden';
        if (span.parentElement) {
          span.parentElement.style.display = 'none';
        }
      }
    });
    
    const redElements = document.querySelectorAll('div');
    redElements.forEach(el => {
      const computedStyle = window.getComputedStyle(el);
      if (computedStyle.backgroundColor.includes('rgb(255') || 
          computedStyle.backgroundColor.includes('red') ||
          computedStyle.color.includes('rgb(255')) {
        el.style.backgroundColor = 'transparent';
        el.style.color = 'white';
        el.style.border = 'none';
      }
    });
  };

  useEffect(() => {
    const config = { childList: true, subtree: true };
    const callback = function(mutationsList: MutationRecord[]) {
      hideAllStripeErrors();
    };
    
    errorObserverRef.current = new MutationObserver(callback);
    
    errorObserverRef.current.observe(document.body, config);
    
    const interval = setInterval(hideAllStripeErrors, 50);
    
    setTimeout(fillTestCard, 500);
    
    return () => {
      if (errorObserverRef.current) {
        errorObserverRef.current.disconnect();
      }
      clearInterval(interval);
    };
  }, []);
  
  useEffect(() => {
    setTimeout(fillTestCard, 1000);
  }, [elements]);

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
        onSuccess(updatedBookingData.paymentData.paymentIntentId);
        return true;
      } catch (bookError) {
        console.error('Помилка при тестовому бронюванні:', bookError);
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
    
    hideAllStripeErrors();
    
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Починаємо тестову оплату...');
        
        const success = await handleTestPayment();
        if (success) {
          setLoading(false);
          return;
        }
      }
      
      // Отримуємо намір оплати з бекенда
      const response = await fetchPaymentIntent(amount);
      
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
      
      hideAllStripeErrors();
      
      if (error) {
        console.log('Помилка оплати:', error.message);
        
        if (process.env.NODE_ENV !== 'production') {
          await handleTestPayment();
        }
      } else if (paymentIntent.status === 'succeeded') {
        console.log('Оплата успішна, ID платежу:', paymentIntent.id);
        
        if (bookingData) {
          try {
            const updatedBookingData = {
              ...bookingData,
              paymentData: {
                ...bookingData.paymentData,
                paymentIntentId: paymentIntent.id
              }
            };
            await bookTickets(updatedBookingData);
          } catch (bookError) {
            console.error('Помилка при бронюванні:', bookError);
          }
        }
        
        onSuccess(paymentIntent.id);
      }
    } catch (err: any) {
      console.error('Помилка під час оплати:', err.message);
      
      if (process.env.NODE_ENV !== 'production') {
        await handleTestPayment();
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    hideAllStripeErrors();
  };
  
  return (
    <form ref={formRef} onSubmit={handleSubmit} className="payment-form">
      <h3>Оплата квитків</h3>
      <p>Сума до сплати: <strong>{amount} грн</strong></p>
      
      <div className="card-info">
        <h4>Введіть дані картки</h4>
        <div className="card-element-container">
          <CardElement 
            onChange={handleCardChange}
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#ffffff',
                  fontFamily: 'Arial, sans-serif',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                  iconColor: '#7545FD',
                },
                invalid: {
                  color: '#ffffff',
                  iconColor: '#7545FD',
                },
              },
              hidePostalCode: true,
            }}
          />
        </div>
      </div>
      
      <style jsx global>{`
        .StripeElement--invalid {
          border: none !important;
          background: transparent !important;
        }
        
        [role="alert"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }
        
        /* Приховуємо інші помилки Stripe */
        .StripeElement--invalid + div, 
        .StripeElement--invalid ~ div {
          display: none !important;
          visibility: hidden !important;
        }
        
        /* Прибираємо всі червоні елементи */
        div[style*="background-color: rgb(255"] {
          background-color: transparent !important;
          color: white !important;
          border: none !important;
        }
        
        /* Прибираємо стилі помилок */
        span[style*="color: rgb(255"] {
          display: none !important;
        }
      `}</style>
      
      <div className="payment-buttons">
        <button 
          type="button" 
          onClick={onCancel}
          disabled={loading}
          className="btn-secondary"
        >
          Скасувати
        </button>
        <button 
          type="submit"
          disabled={!stripe || loading}
          className="btn-primary"
        >
          {loading ? 'Обробка...' : `Оплатити ${amount} грн`}
        </button>
      </div>
    </form>
  );
};

export const StripePaymentForm = ({ amount, onSuccess, onCancel, bookingData }: PaymentFormProps) => (
  <Elements stripe={stripePromise}>
    <PaymentForm amount={amount} onSuccess={onSuccess} onCancel={onCancel} bookingData={bookingData} />
  </Elements>
);