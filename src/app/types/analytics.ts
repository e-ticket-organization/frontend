export interface NewsletterStats {
  totalUsers: number;
  subscribedUsers: number;
  unsubscribedUsers: number;
  subscriptionRate: string;
}

export interface SummaryStats {
  totalTicketsSold: number;
  totalTicketsAvailable: number;
  totalRevenue: number;
  occupancyRate: string;
  avgTicketPrice: string;
}

export interface TimePeriodStats {
  tickets: number;
  revenue: number;
  ticketsChange?: string;
  revenueChange?: string;
  prevPeriodTickets?: number;
  prevPeriodRevenue?: number;
}

export interface PerformanceAnalytics {
  performanceId: string;
  performanceTitle: string;
  ticketCount: string;
  totalRevenue: string;
}

export interface HallAnalytics {
  hallId: string;
  hallNumber: number;
  ticketCount: string;
  totalRevenue: string;
}

export interface WeekdayStats {
  weekday: string | null;
  ticketCount: string;
  revenue: string;
}

export interface AnalyticsData {
  summary: SummaryStats;
  timePeriods: {
    monthly: TimePeriodStats;
    weekly: TimePeriodStats;
    yesterday: TimePeriodStats;
    today: Omit<TimePeriodStats, 'ticketsChange' | 'revenueChange' | 'prevPeriodTickets' | 'prevPeriodRevenue'>;
  };
  performances: PerformanceAnalytics[];
  halls: HallAnalytics[];
  monthlyStats: any[];
  weekdayStats: WeekdayStats[];
}

export interface DashboardData {
  summary: SummaryStats;
  recentStats: {
    today: Omit<TimePeriodStats, 'ticketsChange' | 'revenueChange' | 'prevPeriodTickets' | 'prevPeriodRevenue'>;
    yesterday: TimePeriodStats;
    weekly: TimePeriodStats;
    monthly: TimePeriodStats;
  };
  topPerformances: PerformanceAnalytics[];
  monthlySales: any[];
  weekdaySales: WeekdayStats[];
} 