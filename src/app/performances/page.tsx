import React from 'react';
import PerformanceMain from '@/components/performance/performance';
import Header from '@/components/main/header/header';
import Footer from '@/components/footer/footer';

export default function page() {
    return (
        <div>
            <Header />
            <PerformanceMain />
            <Footer />
        </div>
    );
}