import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import {
  AnalyticsService, AnalyticsOverview, DailyPoint, RevenueByMovie, ShowFillRate
} from '../../core/services/analytics.service';
import { InterestService, InterestDashboardEntry } from '../../core/services/interest.service';
import { IconComponent } from '../../shared/icon.component';

const AUTO_REFRESH_MS = 30_000;

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, NgChartsModule, CurrencyPipe, DatePipe, DecimalPipe, IconComponent],
  template: `
    <div class="flex items-end justify-between mb-6">
      <div>
        <h2 class="inline-flex items-center gap-2 text-2xl font-bold text-slate-900">
          <span class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
            <app-icon name="bar-chart-3" [size]="18"></app-icon>
          </span>
          Booking Analytics
        </h2>
        <p class="text-sm text-slate-500 mt-1">Live metrics across every show in your theater.</p>
      </div>
      <div class="flex items-center gap-2">
        @for (d of dayRanges; track d.value) {
          <button type="button" (click)="setRange(d.value)"
                  [ngClass]="range() === d.value
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'"
                  class="text-xs font-semibold px-3 py-1.5 rounded-full border transition">
            {{ d.label }}
          </button>
        }
        <button type="button" (click)="reload()"
                [disabled]="loading()"
                class="group/btn ml-2 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-300 bg-white text-slate-700 hover:border-indigo-400 hover:text-indigo-600 transition disabled:opacity-50">
          <app-icon name="refresh-cw" [size]="13"
                    [class.animate-spin]="loading()"
                    class="group-hover/btn:rotate-180 transition duration-500"></app-icon>
          {{ loading() ? 'Loading…' : 'Refresh' }}
        </button>
      </div>
    </div>
    <div class="text-[11px] text-slate-400 mb-4">
      Auto-refreshes every 30s · Last updated {{ lastUpdatedLabel() }}
    </div>

    @if (loadError()) {
      <div class="mb-4 rounded-lg border border-rose-300 bg-rose-50 text-rose-800 px-4 py-3 text-sm flex items-start gap-3">
        <app-icon name="alert-circle" [size]="20" class="shrink-0 mt-0.5"></app-icon>
        <div class="grow">
          <div class="font-semibold">Couldn't load analytics data</div>
          <div class="text-xs mt-1 font-mono break-all">{{ loadError() }}</div>
          <div class="text-xs mt-2 text-rose-700">
            Open DevTools → Network for the full error. The most common causes are:
            a stale JWT (log out and back in), the admin not owning a theater yet,
            or the backend not being restarted after the latest code changes.
          </div>
        </div>
      </div>
    }

    <!-- KPI cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="card p-5 hover:shadow-md transition">
        <div class="flex items-center justify-between">
          <div class="text-[10px] uppercase tracking-widest text-slate-400">Total Revenue</div>
          <span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <app-icon name="indian-rupee" [size]="16"></app-icon>
          </span>
        </div>
        <div class="text-2xl font-bold text-slate-900 mt-2">
          {{ (overview()?.totalRevenue ?? 0) | currency:'INR':'symbol':'1.0-0' }}
        </div>
        <div class="text-[11px] text-emerald-600 mt-1 inline-flex items-center gap-1">
          <app-icon name="trending-up" [size]="11"></app-icon>
          From {{ overview()?.confirmedBookings ?? 0 }} confirmed bookings
        </div>
      </div>
      <div class="card p-5 hover:shadow-md transition">
        <div class="flex items-center justify-between">
          <div class="text-[10px] uppercase tracking-widest text-slate-400">Seats Sold</div>
          <span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <app-icon name="armchair" [size]="16"></app-icon>
          </span>
        </div>
        <div class="text-2xl font-bold text-slate-900 mt-2">{{ overview()?.seatsSold ?? 0 }}</div>
        <div class="text-[11px] text-slate-500 mt-1">{{ overview()?.totalBookings ?? 0 }} bookings total</div>
      </div>
      <div class="card p-5 hover:shadow-md transition">
        <div class="flex items-center justify-between">
          <div class="text-[10px] uppercase tracking-widest text-slate-400">Upcoming Shows</div>
          <span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <app-icon name="calendar-clock" [size]="16"></app-icon>
          </span>
        </div>
        <div class="text-2xl font-bold text-slate-900 mt-2">{{ overview()?.upcomingShows ?? 0 }}</div>
        <div class="text-[11px] text-slate-500 mt-1">of {{ overview()?.totalShows ?? 0 }} scheduled</div>
      </div>
      <div class="card p-5 hover:shadow-md transition">
        <div class="flex items-center justify-between">
          <div class="text-[10px] uppercase tracking-widest text-slate-400">Cancellation Rate</div>
          <span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <app-icon name="percent" [size]="16"></app-icon>
          </span>
        </div>
        <div class="text-2xl font-bold text-slate-900 mt-2">{{ overview()?.cancellationRate ?? 0 }}%</div>
        <div class="text-[11px] text-rose-600 mt-1 inline-flex items-center gap-1">
          <app-icon name="circle-x" [size]="11"></app-icon>
          {{ overview()?.cancelledBookings ?? 0 }} cancelled
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Bookings + revenue over time -->
      <div class="card p-5 lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h3 class="inline-flex items-center gap-2 font-bold text-slate-900">
            <app-icon name="line-chart" [size]="16" class="text-indigo-500"></app-icon>
            Bookings & revenue over time
          </h3>
          <span class="text-xs text-slate-500">Last {{ range() }} days</span>
        </div>
        @if (overTime().length === 0) {
          <div class="h-64 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
        } @else {
          <div class="h-72">
            <canvas baseChart
                    [data]="overTimeData()"
                    [options]="overTimeOptions"
                    [type]="'line'"></canvas>
          </div>
        }
      </div>

      <!-- Revenue by movie -->
      <div class="card p-5">
        <h3 class="inline-flex items-center gap-2 font-bold text-slate-900 mb-4">
          <app-icon name="bar-chart-3" [size]="16" class="text-emerald-500"></app-icon>
          Revenue by movie
        </h3>
        @if (revenueByMovie().length === 0) {
          <div class="h-64 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
        } @else {
          <div class="h-72">
            <canvas baseChart
                    [data]="revenueData()"
                    [options]="revenueOptions"
                    [type]="'bar'"></canvas>
          </div>
        }
      </div>

      <!-- Status breakdown doughnut -->
      <div class="card p-5">
        <h3 class="inline-flex items-center gap-2 font-bold text-slate-900 mb-4">
          <app-icon name="pie-chart" [size]="16" class="text-rose-500"></app-icon>
          Booking status
        </h3>
        @if ((overview()?.totalBookings ?? 0) === 0) {
          <div class="h-64 flex items-center justify-center text-slate-400 text-sm">No bookings yet</div>
        } @else {
          <div class="h-72 flex items-center justify-center">
            <canvas baseChart
                    [data]="statusData()"
                    [options]="statusOptions"
                    [type]="'doughnut'"></canvas>
          </div>
        }
      </div>

      <!-- Fill rate per show -->
      <div class="card p-5 lg:col-span-2">
        <h3 class="inline-flex items-center gap-2 font-bold text-slate-900 mb-4">
          <app-icon name="armchair" [size]="16" class="text-amber-500"></app-icon>
          Seat fill rate by show
        </h3>
        @if (fillRate().length === 0) {
          <div class="h-32 flex items-center justify-center text-slate-400 text-sm">No shows yet</div>
        } @else {
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="text-xs uppercase text-slate-500">
                <tr class="text-left">
                  <th class="py-2 px-3">Movie</th>
                  <th class="py-2 px-3">Showtime</th>
                  <th class="py-2 px-3 text-center">Booked</th>
                  <th class="py-2 px-3">Fill rate</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (r of fillRate(); track r.showId) {
                  <tr>
                    <td class="py-2 px-3 font-medium text-slate-900">{{ r.movie }}</td>
                    <td class="py-2 px-3 text-slate-600">{{ r.showTime | date:'MMM d · h:mm a' }}</td>
                    <td class="py-2 px-3 text-center text-slate-600">{{ r.bookedSeats }} / {{ r.totalSeats }}</td>
                    <td class="py-2 px-3">
                      <div class="flex items-center gap-2 min-w-[140px]">
                        <div class="grow h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div class="h-full rounded-full"
                               [style.width.%]="r.fillPercent"
                               [class.bg-emerald-500]="r.fillPercent >= 70"
                               [class.bg-amber-500]="r.fillPercent >= 30 && r.fillPercent < 70"
                               [class.bg-rose-500]="r.fillPercent < 30">
                          </div>
                        </div>
                        <span class="text-xs font-semibold text-slate-700 w-12 text-right">
                          {{ r.fillPercent | number:'1.0-1' }}%
                        </span>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Audience interest -->
      <div class="card p-5 lg:col-span-3">
        <div class="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 class="inline-flex items-center gap-2 font-bold text-slate-900">
              <app-icon name="heart" [size]="16" class="text-rose-500"></app-icon>
              Audience interest
            </h3>
            <p class="text-xs text-slate-500 mt-1">
              Movies that users are waiting to see — handy when deciding what to schedule next.
            </p>
          </div>
          @if (interestRows().length > 0) {
            <span class="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
              <app-icon name="users" [size]="12"></app-icon>
              {{ totalInterestSignups() }} signal(s)
            </span>
          }
        </div>

        @if (interestRows().length === 0) {
          <div class="h-32 flex items-center justify-center text-slate-400 text-sm">
            No "I'm interested" signals from users yet.
          </div>
        } @else {
          <ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            @for (row of interestRows(); track row.movieId) {
              <li class="flex items-center gap-3 rounded-lg ring-1 ring-slate-200 hover:ring-rose-300 hover:bg-rose-50/30 transition p-3">
                @if (row.posterUrl) {
                  <img [src]="row.posterUrl" alt="" class="h-14 w-10 rounded object-cover ring-1 ring-slate-200 shrink-0" />
                } @else {
                  <div class="h-14 w-10 rounded bg-slate-200 shrink-0"></div>
                }
                <div class="min-w-0 grow">
                  <div class="font-semibold text-slate-900 truncate">{{ row.title }}</div>
                  <div class="text-[11px] text-slate-500">
                    {{ row.count }} {{ row.count === 1 ? 'person waiting' : 'people waiting' }}
                  </div>
                </div>
                <span class="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-xs font-bold">
                  <app-icon name="flame" [size]="12"></app-icon>
                  {{ row.count }}
                </span>
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `
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
