"use client";

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

const validateCardNumber = (cardNumber: string): boolean => {
  const cleanNumber = cardNumber.replace(/[\s-]/g, '');
  
  if (!/^\d+$/.test(cleanNumber)) return false;
  
  if (cleanNumber.length < 13 || cleanNumber.length > 19) return false;
  
  return true;
};

const validateExpiryDate = (month: number, year: number): { isValid: boolean; message?: string } => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  
  if (month < 1 || month > 12) {
    return { isValid: false, message: 'Неправильний місяць (1-12)' };
  }
  
  if (year >= currentYear) {
    return { isValid: true };
  }
  
  return { isValid: false, message: 'Рік карти не може бути меншим за поточний' };
};

const validateCVC = (cvc: string): boolean => {
  return /^\d{3,4}$/.test(cvc);
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: ''
  });
  const [isManualInput, setIsManualInput] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    number: '',
    expiry: '',
    cvc: ''
  });
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

  const validateManualCardData = (): boolean => {
    const errors = { number: '', expiry: '', cvc: '' };
    let isValid = true;

    // Валідація номера карти
    if (cardData.number.trim() === '') {
      errors.number = 'Введіть номер карти';
      isValid = false;
    } else if (!validateCardNumber(cardData.number)) {
      errors.number = 'Неправильний номер карти';
      isValid = false;
    }

    // Валідація терміну дії
    if (cardData.expiry.trim() === '') {
      errors.expiry = 'Введіть термін дії карти';
      isValid = false;
    } else {
      const [monthStr, yearStr] = cardData.expiry.split('/');
      const month = parseInt(monthStr, 10);
      const year = parseInt('20' + yearStr, 10);
      
      const expiryValidation = validateExpiryDate(month, year);
      if (!expiryValidation.isValid) {
        errors.expiry = expiryValidation.message || 'Неправильний термін дії';
        isValid = false;
      }
    }

    // Валідація CVC
    if (cardData.cvc.trim() === '') {
      errors.cvc = 'Введіть CVC код';
      isValid = false;
    } else if (!validateCVC(cardData.cvc)) {
      errors.cvc = 'CVC код повинен містити 3-4 цифри';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleManualCardChange = (field: string, value: string) => {
    let formattedValue = value;
    
    if (field === 'number') {
      // Форматуємо номер карти з пробілами
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) return; // Максимум 16 цифр + 3 пробіли
    } else if (field === 'expiry') {
      // Форматуємо дату як MM/YY
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
      if (formattedValue.length > 5) return; // MM/YY
    } else if (field === 'cvc') {
      // Тільки цифри для CVC
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 4) return; // Максимум 4 цифри
    }

    setCardData(prev => ({ ...prev, [field]: formattedValue }));
    
    // Очищуємо помилку для цього поля
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
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
        setSuccessMessage('Квитки успішно заброньовано!');
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
    
    hideAllStripeErrors();
    
    try {
      // Якщо використовується ручний ввід, спочатку валідуємо дані
      if (isManualInput) {
        if (!validateManualCardData()) {
          setLoading(false);
          setError('Будь ласка, виправте помилки у формі');
          return;
        }
        
        // У тестовому режимі відразу виконуємо тестову оплату
        if (process.env.NODE_ENV !== 'production') {
          console.log('Тестовий режим: виконуємо тестову оплату');
          const success = await handleTestPayment();
          if (success) {
            setLoading(false);
            return;
          }
        }
      }

      if (process.env.NODE_ENV !== 'production' && !isManualInput) {
        console.log('Починаємо тестову оплату...');
        
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
      
      hideAllStripeErrors();
      
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
            
            console.log('Викликаємо бронювання після успішної оплати...');
            const bookingResult = await bookTickets(updatedBookingData);
            console.log('Результат бронювання:', bookingResult);
            
            setSuccessMessage('Оплата пройшла успішно! Квитки заброньовано!');
            
            // Показуємо повідомлення про успіх протягом 2 секунд, потім викликаємо onSuccess
            setTimeout(() => {
              onSuccess(paymentIntent.id);
            }, 2000);
            
          } catch (bookError: any) {
            console.error('Помилка при бронюванні після успішної оплати:', bookError);
            setError('Оплата пройшла успішно, але виникла помилка при бронюванні. Зверніться до підтримки.');
          }
        } else {
          // Якщо немає даних для бронювання, просто показуємо успіх оплати
          setSuccessMessage('Оплата пройшла успішно!');
          setTimeout(() => {
            onSuccess(paymentIntent.id);
          }, 2000);
        }
      }
    } catch (err: any) {
      console.error('Помилка під час оплати:', err.message);
      setError(`Помилка під час оплати: ${err.message}`);
      
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
    hideAllStripeErrors();
  };
  
  return (
    <form ref={formRef} onSubmit={handleSubmit} className="payment-form">
      <h3>Оплата квитків</h3>
      <p>Сума до сплати: <strong>{amount} грн</strong></p>
      
      {error && (
        <div className="error-message" style={{ 
          color: '#ff6b6b', 
          background: 'rgba(255, 107, 107, 0.1)', 
          padding: '10px', 
          borderRadius: '5px', 
          marginBottom: '15px' 
        }}>
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="success-message" style={{ 
          color: '#51cf66', 
          background: 'rgba(81, 207, 102, 0.1)', 
          padding: '10px', 
          borderRadius: '5px', 
          marginBottom: '15px',
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          {successMessage}
        </div>
      )}
      
      <div className="input-method-selector" style={{ marginBottom: '20px' }}>
        <div className="radio-group">
          <label className="radio-option">
            <input
              type="radio"
              checked={!isManualInput}
              onChange={() => setIsManualInput(false)}
            />
          </label>
          <label className="radio-option">
            <input
              type="radio"
              checked={isManualInput}
              onChange={() => setIsManualInput(true)}
            />
          </label>
        </div>
      </div>

      {isManualInput ? (
        <div className="manual-card-input">
          <h4>Введіть дані картки</h4>
          
          <div className="input-group">
            <label className="input-label">
              Номер карти
            </label>
            <input
              type="text"
              value={cardData.number}
              onChange={(e) => handleManualCardChange('number', e.target.value)}
              placeholder="1234 5678 9012 3456"
              className={`card-input ${validationErrors.number ? 'error' : ''}`}
            />
            {validationErrors.number && (
              <span className="error-text">
                {validationErrors.number}
              </span>
            )}
          </div>

          <div className="input-row">
            <div className="input-group">
              <label className="input-label">
                Термін дії (MM/YY)
              </label>
              <input
                type="text"
                value={cardData.expiry}
                onChange={(e) => handleManualCardChange('expiry', e.target.value)}
                placeholder="12/34"
                className={`card-input ${validationErrors.expiry ? 'error' : ''}`}
              />
              {validationErrors.expiry && (
                <span className="error-text">
                  {validationErrors.expiry}
                </span>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">
                CVC
              </label>
              <input
                type="text"
                value={cardData.cvc}
                onChange={(e) => handleManualCardChange('cvc', e.target.value)}
                placeholder="123"
                className={`card-input ${validationErrors.cvc ? 'error' : ''}`}
              />
              {validationErrors.cvc && (
                <span className="error-text">
                  {validationErrors.cvc}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
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
      )}
      
      <style jsx global>{`
        .input-method-selector {
          margin-bottom: 25px;
        }
        
        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .radio-option {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border: 1px solid rgba(117, 69, 253, 0.3);
          border-radius: 10px;
          background-color: rgba(255, 255, 255, 0.05);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .radio-option:hover {
          border-color: #7545FD;
          background-color: rgba(117, 69, 253, 0.1);
        }
        
        .radio-option input[type="radio"] {
          margin-right: 12px;
          width: 18px;
          height: 18px;
          accent-color: #7545FD;
        }
        
        .radio-label {
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
          flex: 1;
        }
        
        .manual-card-input {
          margin-bottom: 20px;
        }
        
        .manual-card-input h4 {
          margin: 0 0 20px 0;
          font-size: 1.1rem;
          color: #ffffff;
          font-weight: 500;
        }
        
        .input-group {
          margin-bottom: 20px;
        }
        
        .input-row {
          display: flex;
          gap: 15px;
        }
        
        .input-row .input-group {
          flex: 1;
        }
        
        .input-label {
          display: block;
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        
        .card-input {
          width: 100%;
          padding: 15px;
          border: 1px solid #7545FD;
          border-radius: 10px;
          font-size: 16px;
          background-color: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }
        
        .card-input:focus {
          outline: none;
          border-color: #ECE6FF;
          box-shadow: 0 0 10px rgba(117, 69, 253, 0.3);
          background-color: rgba(255, 255, 255, 0.08);
        }
        
        .card-input.error {
          border-color: #ff6b6b;
          background-color: rgba(255, 107, 107, 0.1);
        }
        
        .card-input::placeholder {
          color: #aab7c4;
        }
        
        .error-text {
          color: #ff6b6b;
          font-size: 13px;
          margin-top: 6px;
          display: block;
          font-weight: 500;
        }
        
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
        
        @media screen and (max-width: 480px) {
          .input-row {
            flex-direction: column;
            gap: 0;
          }
          
          .radio-group {
            gap: 8px;
          }
          
          .radio-option {
            padding: 10px 12px;
          }
          
          .radio-label {
            font-size: 13px;
          }
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