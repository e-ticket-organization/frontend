import React, { useState } from 'react';
import { validatePromoCode } from '@/app/services/filmService';
import './PromoCodeInput.styles.css';

interface PromoCodeInputProps {
  onPromoCodeApplied: (discount: any) => void;
  onContinueWithoutPromo: () => void;
  totalAmount: number;
}

export default function PromoCodeInput({ 
  onPromoCodeApplied, 
  onContinueWithoutPromo, 
  totalAmount 
}: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);

  const handlePromoCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setPromoCode(value);
    setError(null);
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setError('Введіть промокод');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const discount = await validatePromoCode(promoCode.trim());
      console.log('Отримано знижку:', discount);
      console.log('Поля знижки:', Object.keys(discount));
      console.log('Percentage значення:', discount.percentage);
      
      setAppliedDiscount(discount);
      // НЕ викликаємо onPromoCodeApplied тут, щоб користувач міг побачити оновлену ціну
    } catch (err: any) {
      setError(err.message || 'Промокод недійсний');
      setAppliedDiscount(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (appliedDiscount) {
      onPromoCodeApplied(appliedDiscount);
    } else {
      onContinueWithoutPromo();
    }
  };

  const handleRemovePromoCode = () => {
    setAppliedDiscount(null);
    setPromoCode('');
    setError(null);
  };

  const calculateDiscountAmount = () => {
    if (!appliedDiscount) return 0;
    
    console.log('Розрахунок знижки для:', appliedDiscount);
    console.log('Total amount:', totalAmount);
    
    // Підтримуємо як нову структуру API (з percentage), так і стару (з discount_type/discount_value)
    if (appliedDiscount.percentage) {
      // Нова структура API з полем percentage
      const percentageValue = parseFloat(appliedDiscount.percentage);
      const discountAmount = Math.round((totalAmount * percentageValue) / 100);
      console.log('Використано percentage:', percentageValue, '%, знижка:', discountAmount);
      return discountAmount;
    } else if (appliedDiscount.discount_type === 'percentage') {
      // Стара структура API
      const discountAmount = Math.round((totalAmount * appliedDiscount.discount_value) / 100);
      console.log('Використано discount_value:', appliedDiscount.discount_value, '%, знижка:', discountAmount);
      return discountAmount;
    } else if (appliedDiscount.discount_type === 'fixed') {
      // Стара структура API для фіксованої знижки
      const discountAmount = Math.min(appliedDiscount.discount_value, totalAmount);
      console.log('Використано фіксовану знижку:', discountAmount);
      return discountAmount;
    }
    
    console.log('Жодна умова не виконалась, повертаю 0');
    return 0;
  };

  const discountAmount = calculateDiscountAmount();
  const finalAmount = totalAmount - discountAmount;

  return (
    <div className="promo-code-container">
      <div className="promo-code-header">
        <h3>Промокод</h3>
        <p>Маєте промокод? Введіть його нижче для отримання знижки</p>
      </div>

      <div className="promo-code-input-section">
        <div className="input-group">
          <input
            type="text"
            value={promoCode}
            onChange={handlePromoCodeChange}
            placeholder="Введіть промокод"
            className={`promo-input ${error ? 'error' : ''} ${appliedDiscount ? 'success' : ''}`}
            disabled={isLoading || appliedDiscount}
            maxLength={20}
          />
          <button
            onClick={handleApplyPromoCode}
            disabled={isLoading || !promoCode.trim() || appliedDiscount}
            className="apply-button"
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : appliedDiscount ? (
              '✓'
            ) : (
              'Застосувати'
            )}
          </button>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠</span>
            {error}
          </div>
        )}

        {appliedDiscount && (
          <div className="success-message">
            <span className="success-icon">✓</span>
            <span>Промокод "{promoCode}" успішно застосовано!</span>
            <button 
              onClick={handleRemovePromoCode}
              className="remove-promo-button"
              title="Видалити промокод"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <div className="price-summary">
        <div className="price-row">
          <span>Вартість квитків:</span>
          <span>{totalAmount} грн</span>
        </div>
        
        {appliedDiscount && (
          <>
            <div className="price-row discount-row">
              <span>Знижка ({appliedDiscount.percentage ? `${appliedDiscount.percentage}%` : appliedDiscount.discount_type === 'percentage' ? `${appliedDiscount.discount_value}%` : `${appliedDiscount.discount_value} грн`}):</span>
              <span className="discount-amount">-{discountAmount} грн</span>
            </div>
            <div className="price-divider"></div>
          </>
        )}
        
        <div className="price-row total-row">
          <span>До сплати:</span>
          <span className="final-amount">{finalAmount} грн</span>
        </div>
      </div>

      <div className="promo-code-actions">
        <button 
          onClick={onContinueWithoutPromo}
          className="skip-button"
          disabled={isLoading}
        >
          Продовжити без промокоду
        </button>
        <button 
          onClick={handleContinue}
          className={`continue-button ${appliedDiscount ? 'with-discount' : ''}`}
          disabled={isLoading}
        >
          {appliedDiscount ? `Продовжити до оплати (економія ${discountAmount} грн)` : 'Продовжити до оплати'}
        </button>
      </div>
    </div>
  );
} 