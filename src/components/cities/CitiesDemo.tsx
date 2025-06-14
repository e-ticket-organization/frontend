import React, { useState } from 'react';
import CitiesWithShows from './CitiesWithShows';
import './CitiesDemo.styles.css';

type DemoMode = 'all-shows' | 'upcoming-shows' | 'api-examples';

export default function CitiesDemo() {
  const [currentMode, setCurrentMode] = useState<DemoMode>('upcoming-shows');

  const renderApiExamples = () => (
    <div className="api-examples">
      <h2>Приклади використання API ендпоінтів</h2>
      
      <div className="api-section">
        <h3>Доступні ендпоінти:</h3>
        
        <div className="endpoints-grid">
          <div className="endpoint-card">
            <h4>GET /cities/with-shows</h4>
            <p>Отримує всі міста, що мають принаймні один показ</p>
            <code>getCitiesWithShows()</code>
          </div>
          
          <div className="endpoint-card">
            <h4>GET /cities/with-upcoming-shows</h4>
            <p>Отримує міста з майбутніми показами (після поточної дати)</p>
            <code>getCitiesWithUpcomingShows()</code>
          </div>
          
          <div className="endpoint-card">
            <h4>GET /cities/:id/with-shows</h4>
            <p>Отримує конкретне місто з усіма його показами</p>
            <code>getCityWithShows(cityId)</code>
          </div>
          
          <div className="endpoint-card">
            <h4>GET /cities/:id/with-upcoming-shows</h4>
            <p>Отримує конкретне місто з майбутніми показами</p>
            <code>getCityWithUpcomingShows(cityId)</code>
          </div>
        </div>
      </div>

      <div className="usage-examples">
        <h3>Приклади використання в коді:</h3>
        
        <div className="code-example">
          <h4>Базове використання:</h4>
          <pre>
{`import { getCitiesWithUpcomingShows } from '@/app/services/filmService';

const cities = await getCitiesWithUpcomingShows();`}
          </pre>
        </div>

        <div className="code-example">
          <h4>Використання з хуком:</h4>
          <pre>
{`import useCities from '@/hooks/useCities';

const { cities, isLoading, error } = useCities({ 
  includeShows: true, 
  upcomingOnly: true 
});`}
          </pre>
        </div>

        <div className="code-example">
          <h4>Отримання деталей міста:</h4>
          <pre>
{`const cityDetails = await getCityWithUpcomingShows(cityId);
console.log('Покази міста:', cityDetails.upcomingShows);`}
          </pre>
        </div>
      </div>

      <div className="features-section">
        <h3>Особливості нових ендпоінтів:</h3>
        <ul>
          <li>Автоматична фільтрація за датою для upcoming показів</li>
          <li>Включення інформації про театри</li>
          <li>Лічильники кількості показів</li>
          <li>Підтримка зв'язків з Performance і Theater</li>
          <li>Оптимізовані запити до бази даних</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="cities-demo">
      <div className="demo-header">
        <h1>Демонстрація нових ендпоінтів для міст</h1>
        <p>Тестування API для отримання міст з показами</p>
        
        <div className="mode-selector">
          <button 
            className={currentMode === 'upcoming-shows' ? 'active' : ''}
            onClick={() => setCurrentMode('upcoming-shows')}
          >
            Міста з майбутніми показами
          </button>
          <button 
            className={currentMode === 'all-shows' ? 'active' : ''}
            onClick={() => setCurrentMode('all-shows')}
          >
            Міста з усіма показами
          </button>
          <button 
            className={currentMode === 'api-examples' ? 'active' : ''}
            onClick={() => setCurrentMode('api-examples')}
          >
            Документація API
          </button>
        </div>
      </div>

      <div className="demo-content">
        {currentMode === 'upcoming-shows' && (
          <CitiesWithShows showUpcomingOnly={true} />
        )}
        
        {currentMode === 'all-shows' && (
          <CitiesWithShows showUpcomingOnly={false} />
        )}
        
        {currentMode === 'api-examples' && renderApiExamples()}
      </div>
    </div>
  );
} 