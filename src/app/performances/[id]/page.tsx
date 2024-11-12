'use client';

import React, { useEffect, useState } from 'react';
import { getPerfomanceById } from '@/app/services/filmService';
import { IPerfomance } from '@/app/types/perfomance';
import PerformanceIndividual from '@/components/performance/performance-individual';
import { useParams } from 'next/navigation';
import Footer from '@/components/footer/footer';
import Header from '@/components/main/header/header';

export default function PerformancePage() {
  const params = useParams();
  const [performance, setPerformance] = useState<IPerfomance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        if (params && typeof params.id === 'string') {
          const data = await getPerfomanceById(Number(params.id));
          setPerformance(data);
        } else {
          console.error('Невірний формат параметра id');
        }
      } catch (error) {
        console.error('Помилка завантаження вистави:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerformance();
  }, [params]);

  if (isLoading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  if (!performance) {
    return <div>Виставу не знайдено</div>;
  }

  return (
    <>
      <Header />
      <PerformanceIndividual performance={performance} />
      <Footer />
    </>
  );
}