'use client'
import React, { useState, useEffect } from 'react';
import { getNewsletterStats, getAnalytics, getDashboardAnalytics } from '@/app/services/analyticsService';
import { NewsletterStats, AnalyticsData, DashboardData } from '@/app/types/analytics';
import './Analytics.styles.css';

export default function Analytics() {
  const [newsletterStats, setNewsletterStats] = useState<NewsletterStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'detailed' | 'newsletter'>('dashboard');
  const [error, setError] = useState<string | null>(null);

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
      } catch (error) {
        console.error('Помилка завантаження аналітичних даних:', error);
        setError('Не вдалося завантажити аналітичні дані');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: string) => {
    return `${value}%`;
  };

  const renderLoader = () => (
    <div className="analytics-loader">
      <div className="loader-spinner"></div>
      <p>Завантаження аналітичних даних...</p>
    </div>
  );

  const renderError = () => (
    <div className="analytics-error">
      <p>{error}</p>
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
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,17H13V16H14A1,1 0 0,0 1,1 0 0,0 14,14H10A1,1 0 0,1 9,13A1,1 0 0,1 10,12H14A3,3 0 0,1 17,15A3,3 0 0,1 14,18H13V19H11V18H10A1,1 0 0,1 9,17A1,1 0 0,1 10,16H14A1,1 0 0,0 15,15A1,1 0 0,0 14,14H10A3,3 0 0,0 7,11A3,3 0 0,0 10,8H11V7H13V8H14A1,1 0 0,0 15,9A1,1 0 0,0 14,10H10A1,1 0 0,1 9,9A1,1 0 0,1 10,8H14A3,3 0 0,1 17,11A3,3 0 0,1 14,14H13V15H11V14Z"/>
              </svg>
            </div>
            <div className="card-content">
              <h3>Загальний дохід</h3>
              <p className="card-value">{formatCurrency(dashboardData.summary.totalRevenue)}</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon tickets">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M15.58,16.8L12,14.5L8.42,16.8L9.5,12.68L6.21,10H10.46L12,6L13.54,10H17.79L14.5,12.68L15.58,16.8M20,12C20,16.4 17.6,20 17.6,20H6.4C6.4,20 4,16.4 4,12V8H6L7,6H17L18,8H20V12Z"/>
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
                <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/>
              </svg>
            </div>
            <div className="card-content">
              <h3>Заповненість</h3>
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

          <div className="chart-container">
            <h3>Продажі за днями тижня</h3>
            <div className="weekday-chart">
              {Array.isArray(dashboardData.weekdaySales) && dashboardData.weekdaySales.length > 0 ? (
                dashboardData.weekdaySales.map((day, index) => {
                  const maxTickets = Math.max(...dashboardData.weekdaySales.map(d => parseInt(d.ticketCount) || 0));
                  const currentTickets = parseInt(day.ticketCount) || 0;
                  const percentage = maxTickets > 0 ? Math.min(100, (currentTickets / maxTickets) * 100) : 0;
                  
                  return (
                    <div key={index} className="weekday-item">
                      <div className="weekday-name">{day.weekday || 'Невідомо'}</div>
                      <div className="weekday-bar">
                        <div 
                          className="weekday-fill" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="weekday-value">{day.ticketCount}</div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">Немає даних про продажі</div>
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
        </div>
      </div>

      <div className="analytics-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'detailed' && renderDetailedAnalytics()}
        {activeTab === 'newsletter' && renderNewsletterStats()}
      </div>
    </div>
  );
} 