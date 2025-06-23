'use client'
import React, { useState, useEffect } from 'react';
import { getNewsletterStats, getAnalytics, getDashboardAnalytics, exportExcelData, exportPdfData, exportCsvData } from '@/app/services/analyticsService';
import { NewsletterStats, AnalyticsData, DashboardData } from '@/app/types/analytics';
import './Analytics.styles.css';

export default function Analytics() {
  const [newsletterStats, setNewsletterStats] = useState<NewsletterStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'detailed' | 'newsletter' | 'export'>('dashboard');
  const [error, setError] = useState<string | null>(null);

  const [exportLoading, setExportLoading] = useState<{[key: string]: boolean}>({
    excel: false,
    pdf: false,
    csv: false,
    test: false
  });
  const [exportMessage, setExportMessage] = useState<{type: 'success' | 'error' | null, text: string}>({
    type: null,
    text: ''
  });
  const [apiTestResult, setApiTestResult] = useState<{status: string; message: string} | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const [newsletter, analytics, dashboard] = await Promise.all([
          getNewsletterStats(),
          getAnalytics(),
          getDashboardAnalytics()
        ]);
        
        setNewsletterStats(newsletter);
        setAnalyticsData(analytics);
        setDashboardData(dashboard);
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        setError(err.message || 'Помилка завантаження аналітичних даних');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setExportMessage({ type, text });
    setTimeout(() => {
      setExportMessage({ type: null, text: '' });
    }, 5000);
  };

  const testApiConnection = async () => {
    try {
      setExportLoading(prev => ({ ...prev, test: true }));
      
      // Базовий тест підключення
      const response = await fetch('/api/analytics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setApiTestResult({
          status: 'success', 
          message: `API доступне. Статус: ${response.status}`
        });
        showMessage('success', 'API підключення працює!');
      } else {
        setApiTestResult({
          status: 'error', 
          message: `API повертає помилку: ${response.status} ${response.statusText}`
        });
        showMessage('error', `API недоступне: ${response.status}`);
      }
    } catch (error: any) {
      console.error('API connection test failed:', error);
      setApiTestResult({
        status: 'error', 
        message: error.message || 'Не вдалося підключитися до API'
      });
      showMessage('error', 'Тест API не пройдено');
    } finally {
      setExportLoading(prev => ({ ...prev, test: false }));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: string) => {
    return `${parseFloat(value).toFixed(1)}%`;
  };

  const renderLoader = () => (
    <div className="analytics-loader">
      <div className="loader-spinner"></div>
      <p>Завантаження аналітичних даних...</p>
    </div>
  );

  const renderError = () => (
    <div className="analytics-error">
      <p>Помилка завантаження: {error}</p>
      <button onClick={() => window.location.reload()}>Спробувати знову</button>
    </div>
  );

  const renderDashboard = () => {
    if (!dashboardData) return null;

    return (
      <div className="dashboard-content">
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon revenue">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z"/>
              </svg>
            </div>
            <div className="card-content">
              <h3>Загальний дохід</h3>
              <p className="card-value">{formatCurrency(typeof dashboardData.summary.totalRevenue === 'string' ? parseFloat(dashboardData.summary.totalRevenue) : dashboardData.summary.totalRevenue)}</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon tickets">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M15.58,16.8L12,14.5L8.42,16.8L9.5,12.68L6.21,10H10.46L12,6L13.54,10H17.79L14.5,12.68L15.58,16.8M20,12C20,16.2 17.8,19.9 14.5,22.1L12,20L9.5,22.1C6.2,19.9 4,16.2 4,12C4,7.8 7.6,4.3 12,4.3C16.4,4.3 20,7.8 20,12Z"/>
              </svg>
            </div>
            <div className="card-content">
              <h3>Продано квитків</h3>
                              <p className="card-value">{dashboardData.summary.totalTicketsSold}</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon occupancy">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25M0,20V18.5C0,17.11 1.89,15.94 4.45,15.6C3.86,16.28 3.5,17.22 3.5,18.25V20H0M24,20H20.5V18.25C20.5,17.22 20.14,16.28 19.55,15.6C22.11,15.94 24,17.11 24,18.5V20Z"/>
              </svg>
            </div>
            <div className="card-content">
              <h3>Середня заповненість</h3>
                              <p className="card-value">{formatPercentage(dashboardData.summary.occupancyRate)}</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon avg-price">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z"/>
              </svg>
            </div>
            <div className="card-content">
              <h3>Середня ціна квитка</h3>
              <p className="card-value">{formatCurrency(parseFloat(dashboardData.summary.avgTicketPrice))}</p>
            </div>
          </div>
        </div>

        <div className="charts-section">
          <div className="chart-container">
            <h3>Топ вистави за продажами</h3>
            <div className="performances-list">
              {Array.isArray(dashboardData.topPerformances) && dashboardData.topPerformances.length > 0 ? (
                dashboardData.topPerformances.map((performance, index) => (
                  <div key={performance.performanceId} className="performance-item">
                    <div className="performance-rank">#{index + 1}</div>
                    <div className="performance-info">
                      <h4>{performance.performanceTitle}</h4>
                      <p>Квитків: {performance.ticketCount}</p>
                    </div>
                    <div className="performance-revenue">
                      {formatCurrency(parseFloat(performance.totalRevenue))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">Немає даних про вистави</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDetailedAnalytics = () => {
    if (!analyticsData) return null;

    return (
      <div className="detailed-content">
        <div className="time-periods">
          <h3>Статистика за періодами</h3>
          <div className="periods-grid">
            <div className="period-card">
              <h4>Сьогодні</h4>
              <p>Квитків: {analyticsData.timePeriods.today.tickets}</p>
              <p>Дохід: {formatCurrency(analyticsData.timePeriods.today.revenue)}</p>
            </div>
            <div className="period-card">
              <h4>Вчора</h4>
              <p>Квитків: {analyticsData.timePeriods.yesterday.tickets}</p>
              <p>Дохід: {formatCurrency(analyticsData.timePeriods.yesterday.revenue)}</p>
              <p className="change">Зміна: {analyticsData.timePeriods.yesterday.ticketsChange}%</p>
            </div>
            <div className="period-card">
              <h4>Тиждень</h4>
              <p>Квитків: {analyticsData.timePeriods.weekly.tickets}</p>
              <p>Дохід: {formatCurrency(analyticsData.timePeriods.weekly.revenue)}</p>
              <p className="change">Зміна: {analyticsData.timePeriods.weekly.ticketsChange}%</p>
            </div>
            <div className="period-card">
              <h4>Місяць</h4>
              <p>Квитків: {analyticsData.timePeriods.monthly.tickets}</p>
              <p>Дохід: {formatCurrency(analyticsData.timePeriods.monthly.revenue)}</p>
              <p className="change">Зміна: {analyticsData.timePeriods.monthly.ticketsChange}%</p>
            </div>
          </div>
        </div>

        <div className="halls-analytics">
          <h3>Аналітика по залах</h3>
          <div className="halls-list">
            {Array.isArray(analyticsData.halls) && analyticsData.halls.length > 0 ? (
              analyticsData.halls.map(hall => (
                <div key={hall.hallId} className="hall-item">
                  <div className="hall-number">Зал {hall.hallNumber}</div>
                  <div className="hall-stats">
                    <span>Квитків: {hall.ticketCount}</span>
                    <span>Дохід: {formatCurrency(parseFloat(hall.totalRevenue))}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">Немає даних про зали</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderNewsletterStats = () => {
    if (!newsletterStats) return null;
    return (
      <div className="newsletter-content">
        <h3>Статистика розсилки</h3>
        <div className="newsletter-stats">
          <div className="newsletter-card">
            <h4>Загальна кількість користувачів</h4>
            <p className="newsletter-value">{newsletterStats.totalUsers}</p>
          </div>
          <div className="newsletter-card">
            <h4>Підписані користувачі</h4>
            <p className="newsletter-value">{newsletterStats.subscribedUsers}</p>
          </div>
          <div className="newsletter-card">
            <h4>Відписані користувачі</h4>
            <p className="newsletter-value">{newsletterStats.unsubscribedUsers}</p>
          </div>
          <div className="newsletter-card">
            <h4>Коефіцієнт підписки</h4>
            <p className="newsletter-value">{formatPercentage(newsletterStats.subscriptionRate)}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderExport = () => {
    return (
      <div className="export-content">
        <div className="export-header">
          <h3>Експорт аналітичних даних</h3>
          <p className="export-description">
            Виберіть формат для експорту звітів. Файли автоматично завантажаться у вашу папку завантажень.
          </p>
        </div>

        {/* Повідомлення про результат експорту */}
        {exportMessage.type && (
          <div className={`export-message ${exportMessage.type}`}>
            <div className="message-icon">
              {exportMessage.type === 'success' ? (
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                </svg>
              )}
            </div>
            <span>{exportMessage.text}</span>
          </div>
        )}

        <div className="export-buttons">
          <div className="export-button-group">
            <button 
              className={`export-button excel ${exportLoading.excel ? 'loading' : ''}`}
              onClick={() => exportData('excel')}
              disabled={exportLoading.excel}
            >
              <div className="button-icon">
                {exportLoading.excel ? (
                  <div className="button-spinner"></div>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                )}
              </div>
              <div className="button-content">
                <span className="button-title">Excel</span>
                <span className="button-subtitle">Таблиця .xlsx</span>
              </div>
            </button>

            <button 
              className={`export-button pdf ${exportLoading.pdf ? 'loading' : ''}`}
              onClick={() => exportData('pdf')}
              disabled={exportLoading.pdf}
            >
              <div className="button-icon">
                {exportLoading.pdf ? (
                  <div className="button-spinner"></div>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M13,9V3.5L18.5,9M6,2C4.89,2 4,2.89 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2H6Z"/>
                  </svg>
                )}
              </div>
              <div className="button-content">
                <span className="button-title">PDF</span>
                <span className="button-subtitle">Документ .pdf</span>
              </div>
            </button>

            <button 
              className={`export-button csv ${exportLoading.csv ? 'loading' : ''}`}
              onClick={() => exportData('csv')}
              disabled={exportLoading.csv}
            >
              <div className="button-icon">
                {exportLoading.csv ? (
                  <div className="button-spinner"></div>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                )}
              </div>
              <div className="button-content">
                <span className="button-title">CSV</span>
                <span className="button-subtitle">Дані .csv</span>
              </div>
            </button>
          </div>
        </div>

        <div className="export-info">
          <div className="info-card">
            <h4>Що включається в звіт:</h4>
            <ul>
              <li>Загальна статистика продажів</li>
              <li>Дані за періодами (день, тиждень, місяць)</li>
              <li>Топ вистави за доходом</li>
              <li>Аналітика по залах</li>
              <li>Статистика розсилки</li>
            </ul>
          </div>
          
          <div className="info-card">
            <h4>Діагностика підключення:</h4>
            <button 
              className={`export-button test ${exportLoading.test ? 'loading' : ''}`}
              onClick={testApiConnection}
              disabled={exportLoading.test}
            >
              {exportLoading.test ? 'Тестування...' : 'Тест API підключення'}
            </button>
            
            {apiTestResult && (
              <div className={`api-test-result ${apiTestResult.status}`}>
                <strong>Результат тесту:</strong> {apiTestResult.message}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const exportData = async (format: string) => {
    try {
      // Встановлюємо стан завантаження для конкретної кнопки
      setExportLoading(prev => ({ ...prev, [format]: true }));
      
      if (format === 'excel') {
        await exportExcelData();
        showMessage('success', 'Excel файл успішно завантажено!');
      } else if (format === 'pdf') {
        await exportPdfData();
        showMessage('success', 'PDF файл успішно завантажено!');
      } else if (format === 'csv') {
        await exportCsvData();
        showMessage('success', 'CSV файл успішно завантажено!');
      }
    } catch (error: any) {
      console.error('Помилка експорту даних:', error);
      
      // Специфічна обробка для різних типів помилок
      let userMessage = '';
      
      if (error.message?.includes('socket hang up') || error.message?.includes('ECONNRESET')) {
        userMessage = `Помилка підключення до сервера. Перевірте з'єднання з інтернетом і спробуйте знову.`;
      } else if (error.message?.includes('502')) {
        userMessage = `Сервер тимчасово недоступний. Спробуйте експорт в іншому форматі або повторіть спробу через кілька хвилин.`;
      } else if (error.message?.includes('504') || error.message?.includes('Таймаут')) {
        userMessage = `Генерація файлу займає занадто багато часу. Спробуйте повторити спробу або використайте інший формат.`;
      } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        userMessage = `Помилка авторизації. Спробуйте перезавантажити сторінку.`;
      } else {
        userMessage = `Помилка експорту: ${error instanceof Error ? error.message : 'Невідома помилка'}`;
      }
      
      showMessage('error', userMessage);
    } finally {
      // Прибираємо стан завантаження
      setExportLoading(prev => ({ ...prev, [format]: false }));
    }
  };

  if (isLoading) return renderLoader();
  if (error) return renderError();

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Аналітика театру</h1>
        <div className="analytics-tabs">
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''} 
            onClick={() => setActiveTab('dashboard')}
          >
            Дашборд
          </button>
          <button 
            className={activeTab === 'detailed' ? 'active' : ''} 
            onClick={() => setActiveTab('detailed')}
          >
            Детальна аналітика
          </button>
          <button 
            className={activeTab === 'newsletter' ? 'active' : ''} 
            onClick={() => setActiveTab('newsletter')}
          >
            Розсилка
          </button>
          <button 
            className={activeTab === 'export' ? 'active' : ''} 
            onClick={() => setActiveTab('export')}
          >
            Експорт
          </button>
        </div>
      </div>

      <div className="analytics-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'detailed' && renderDetailedAnalytics()}
        {activeTab === 'newsletter' && renderNewsletterStats()}
        {activeTab === 'export' && renderExport()}
      </div>
    </div>
  );
} 