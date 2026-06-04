import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import {
  AnalyticsService, AnalyticsOverview, DailyPoint, RevenueByMovie, ShowFillRate
} from '../../../core/services/analytics.service';
import { InterestService, InterestDashboardEntry } from '../../../core/services/interest.service';
import { IconComponent } from '../../../shared/icon/icon';

const AUTO_REFRESH_MS = 30_000;

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, NgChartsModule, CurrencyPipe, DatePipe, DecimalPipe, IconComponent],
  templateUrl: './analytics.html',
  styleUrls: ['./analytics.css']
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  private analyticsService = inject(AnalyticsService);
  private interestService = inject(InterestService);

  range = signal<number>(30);
  overview = signal<AnalyticsOverview | null>(null);
  overTime = signal<DailyPoint[]>([]);
  revenueByMovie = signal<RevenueByMovie[]>([]);
  fillRate = signal<ShowFillRate[]>([]);
  interestRows = signal<InterestDashboardEntry[]>([]);
  loading = signal(false);
  loadError = signal<string | null>(null);
  lastUpdated = signal<number>(0);
  now = signal<number>(Date.now());

  totalInterestSignups = computed(() =>
    this.interestRows().reduce((sum, r) => sum + (r.count ?? 0), 0));

  private pollHandle: any = null;
  private tickHandle: any = null;

  dayRanges = [
    { label: '7d', value: 7 },
    { label: '30d', value: 30 },
    { label: '90d', value: 90 }
  ];

  lastUpdatedLabel = computed<string>(() => {
    if (this.lastUpdated() === 0) return 'never';
    const sec = Math.max(0, Math.round((this.now() - this.lastUpdated()) / 1000));
    if (sec < 5) return 'just now';
    if (sec < 60) return `${sec}s ago`;
    const min = Math.round(sec / 60);
    return `${min}m ago`;
  });

  overTimeData = computed<ChartData<'line'>>(() => ({
    labels: this.overTime().map(p => p.date.slice(5)),
    datasets: [
      {
        label: 'Bookings',
        data: this.overTime().map(p => p.bookings),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        fill: true,
        tension: 0.35,
        yAxisID: 'y',
        pointRadius: 3
      },
      {
        label: 'Revenue (₹)',
        data: this.overTime().map(p => Number(p.revenue)),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: false,
        tension: 0.35,
        yAxisID: 'y1',
        pointRadius: 3
      }
    ]
  }));

  overTimeOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11 } } }
    },
    scales: {
      y: { type: 'linear', position: 'left', beginAtZero: true,
           title: { display: true, text: 'Bookings', font: { size: 10 } } },
      y1: { type: 'linear', position: 'right', beginAtZero: true,
            title: { display: true, text: 'Revenue (₹)', font: { size: 10 } },
            grid: { drawOnChartArea: false } }
    }
  };

  revenueData = computed<ChartData<'bar'>>(() => ({
    labels: this.revenueByMovie().map(r => r.title),
    datasets: [{
      label: 'Revenue (₹)',
      data: this.revenueByMovie().map(r => Number(r.revenue)),
      backgroundColor: '#6366f1',
      borderRadius: 6
    }]
  }));

  revenueOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true } }
  };

  statusData = computed<ChartData<'doughnut'>>(() => {
    const o = this.overview();
    return {
      labels: ['Confirmed', 'Cancelled'],
      datasets: [{
        data: [o?.confirmedBookings ?? 0, o?.cancelledBookings ?? 0],
        backgroundColor: ['#10b981', '#f43f5e'],
        borderWidth: 0
      }]
    };
  });

  statusOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    cutout: '60%'
  };

  ngOnInit() {
    this.reload();
    this.pollHandle = setInterval(() => this.reload(), AUTO_REFRESH_MS);
    this.tickHandle = setInterval(() => this.now.set(Date.now()), 1000);
  }

  ngOnDestroy() {
    if (this.pollHandle) clearInterval(this.pollHandle);
    if (this.tickHandle) clearInterval(this.tickHandle);
  }

  setRange(days: number) {
    this.range.set(days);
    this.reload();
  }

  reload() {
    if (this.loading()) return;
    this.loading.set(true);
    this.loadError.set(null);

    let pending = 5;
    const done = () => {
      if (--pending === 0) {
        this.loading.set(false);
        this.lastUpdated.set(Date.now());
        this.now.set(Date.now());
      }
    };
    const fail = (label: string, err: any) => {
      const status = err?.status ?? '?';
      const msg = err?.error?.error ?? err?.message ?? 'unknown error';
      this.loadError.set(`[${label}] HTTP ${status} — ${msg}`);
      console.error(`[analytics:${label}]`, err);
      done();
    };

    this.analyticsService.overview().subscribe({
      next: d => { this.overview.set(d); done(); },
      error: e => fail('overview', e)
    });
    this.analyticsService.bookingsOverTime(this.range()).subscribe({
      next: d => { this.overTime.set(d); done(); },
      error: e => fail('bookings-over-time', e)
    });
    this.analyticsService.revenueByMovie().subscribe({
      next: d => { this.revenueByMovie.set(d); done(); },
      error: e => fail('revenue-by-movie', e)
    });
    this.analyticsService.showFillRate().subscribe({
      next: d => { this.fillRate.set(d); done(); },
      error: e => fail('show-fillrate', e)
    });
    this.interestService.dashboard().subscribe({
      next: d => { this.interestRows.set(d); done(); },
      error: e => fail('interest-dashboard', e)
    });
  }
}
