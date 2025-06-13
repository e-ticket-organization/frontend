'use client'
import React from 'react';
import SideBar from '@/components/admin/side-bar/side-bar';
import Analytics from '@/components/admin/analytics/Analytics';
import './analytics.styles.css'; 

export default function AnalyticsPage() {
  return (
    <div className="analytics-page">
      <SideBar />
      <main className="analytics-main">
        <Analytics />
      </main>
    </div>
  );
} 