import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Lightweight inline-SVG icon component (Lucide-style stroke icons).
 * Use `class` on the host for color (currentColor) and additional spacing.
 *
 * Example: <app-icon name="film" class="w-4 h-4 text-indigo-600"></app-icon>
 */
export type IconName =
  | 'film' | 'ticket' | 'ticket-percent' | 'receipt' | 'calendar' | 'calendar-clock'
  | 'building-2' | 'map-pin' | 'user' | 'users' | 'search' | 'x' | 'plus' | 'minus'
  | 'check' | 'check-circle' | 'check-circle-2' | 'chevron-right' | 'chevron-left' | 'chevron-down' | 'chevron-up'
  | 'arrow-right' | 'arrow-left' | 'log-out' | 'log-in'
  | 'clock' | 'alarm-clock' | 'play' | 'play-circle' | 'edit' | 'trash-2' | 'save'
  | 'refresh-cw' | 'eye' | 'eye-off' | 'copy' | 'alert-circle' | 'alert-triangle'
  | 'info' | 'sparkles' | 'flame' | 'star' | 'trending-up' | 'trending-down'
  | 'bar-chart-3' | 'line-chart' | 'pie-chart' | 'indian-rupee' | 'percent'
  | 'image' | 'video' | 'hand' | 'heart' | 'qr-code' | 'armchair'
  | 'tag' | 'gift' | 'megaphone' | 'shield-check' | 'lock' | 'unlock'
  | 'sun' | 'settings' | 'home' | 'list' | 'grid' | 'mail'
  | 'arrow-up-right' | 'external-link' | 'printer' | 'download' | 'upload'
  | 'circle' | 'circle-check' | 'circle-x' | 'circle-help';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24"
         fill="none" stroke="currentColor"
         [attr.stroke-width]="strokeWidth"
         stroke-linecap="round" stroke-linejoin="round"
         [attr.aria-hidden]="ariaLabel ? null : 'true'"
         [attr.role]="ariaLabel ? 'img' : null"
         [attr.aria-label]="ariaLabel"
         class="inline-block">
      <ng-container [ngSwitch]="name">
        <ng-container *ngSwitchCase="'film'"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></ng-container>
        <ng-container *ngSwitchCase="'ticket'"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></ng-container>
        <ng-container *ngSwitchCase="'ticket-percent'"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M9 9h.01"/><path d="m15 9-6 6"/><path d="M15 15h.01"/></ng-container>
        <ng-container *ngSwitchCase="'receipt'"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/></ng-container>
        <ng-container *ngSwitchCase="'calendar'"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></ng-container>
        <ng-container *ngSwitchCase="'calendar-clock'"><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h5"/><path d="M17.5 17.5 16 16.3V14"/><circle cx="16" cy="16" r="6"/></ng-container>
        <ng-container *ngSwitchCase="'building-2'"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></ng-container>
        <ng-container *ngSwitchCase="'map-pin'"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></ng-container>
        <ng-container *ngSwitchCase="'user'"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></ng-container>
        <ng-container *ngSwitchCase="'users'"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></ng-container>
        <ng-container *ngSwitchCase="'search'"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></ng-container>
        <ng-container *ngSwitchCase="'x'"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></ng-container>
        <ng-container *ngSwitchCase="'plus'"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></ng-container>
        <ng-container *ngSwitchCase="'minus'"><line x1="5" y1="12" x2="19" y2="12"/></ng-container>
        <ng-container *ngSwitchCase="'check'"><polyline points="20 6 9 17 4 12"/></ng-container>
        <ng-container *ngSwitchCase="'check-circle'"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></ng-container>
        <ng-container *ngSwitchCase="'check-circle-2'"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></ng-container>
        <ng-container *ngSwitchCase="'chevron-right'"><polyline points="9 18 15 12 9 6"/></ng-container>
        <ng-container *ngSwitchCase="'chevron-left'"><polyline points="15 18 9 12 15 6"/></ng-container>
        <ng-container *ngSwitchCase="'chevron-down'"><polyline points="6 9 12 15 18 9"/></ng-container>
        <ng-container *ngSwitchCase="'chevron-up'"><polyline points="18 15 12 9 6 15"/></ng-container>
        <ng-container *ngSwitchCase="'arrow-right'"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></ng-container>
        <ng-container *ngSwitchCase="'arrow-left'"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></ng-container>
        <ng-container *ngSwitchCase="'log-out'"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></ng-container>
        <ng-container *ngSwitchCase="'log-in'"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></ng-container>
        <ng-container *ngSwitchCase="'clock'"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></ng-container>
        <ng-container *ngSwitchCase="'alarm-clock'"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/></ng-container>
        <ng-container *ngSwitchCase="'play'"><polygon points="6 3 20 12 6 21 6 3"/></ng-container>
        <ng-container *ngSwitchCase="'play-circle'"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></ng-container>
        <ng-container *ngSwitchCase="'edit'"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></ng-container>
        <ng-container *ngSwitchCase="'trash-2'"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></ng-container>
        <ng-container *ngSwitchCase="'save'"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></ng-container>
        <ng-container *ngSwitchCase="'refresh-cw'"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></ng-container>
        <ng-container *ngSwitchCase="'eye'"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></ng-container>
        <ng-container *ngSwitchCase="'eye-off'"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></ng-container>
        <ng-container *ngSwitchCase="'copy'"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></ng-container>
        <ng-container *ngSwitchCase="'alert-circle'"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></ng-container>
        <ng-container *ngSwitchCase="'alert-triangle'"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></ng-container>
        <ng-container *ngSwitchCase="'info'"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></ng-container>
        <ng-container *ngSwitchCase="'sparkles'"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></ng-container>
        <ng-container *ngSwitchCase="'flame'"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></ng-container>
        <ng-container *ngSwitchCase="'star'"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></ng-container>
        <ng-container *ngSwitchCase="'trending-up'"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></ng-container>
        <ng-container *ngSwitchCase="'trending-down'"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></ng-container>
        <ng-container *ngSwitchCase="'bar-chart-3'"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></ng-container>
        <ng-container *ngSwitchCase="'line-chart'"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></ng-container>
        <ng-container *ngSwitchCase="'pie-chart'"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></ng-container>
        <ng-container *ngSwitchCase="'indian-rupee'"><path d="M6 3h12"/><path d="M6 8h12"/><path d="m6 13 8.5 8"/><path d="M6 13h3"/><path d="M9 13c6.667 0 6.667-10 0-10"/></ng-container>
        <ng-container *ngSwitchCase="'percent'"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></ng-container>
        <ng-container *ngSwitchCase="'image'"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></ng-container>
        <ng-container *ngSwitchCase="'video'"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></ng-container>
        <ng-container *ngSwitchCase="'hand'"><path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></ng-container>
        <ng-container *ngSwitchCase="'heart'"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></ng-container>
        <ng-container *ngSwitchCase="'qr-code'"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></ng-container>
        <ng-container *ngSwitchCase="'armchair'"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3H3z"/><path d="M5 18v2"/><path d="M19 18v2"/></ng-container>
        <ng-container *ngSwitchCase="'tag'"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></ng-container>
        <ng-container *ngSwitchCase="'gift'"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></ng-container>
        <ng-container *ngSwitchCase="'megaphone'"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></ng-container>
        <ng-container *ngSwitchCase="'shield-check'"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><polyline points="9 12 11 14 15 10"/></ng-container>
        <ng-container *ngSwitchCase="'lock'"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></ng-container>
        <ng-container *ngSwitchCase="'unlock'"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></ng-container>
        <ng-container *ngSwitchCase="'sun'"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></ng-container>
        <ng-container *ngSwitchCase="'settings'"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"/><circle cx="12" cy="12" r="3"/></ng-container>
        <ng-container *ngSwitchCase="'home'"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></ng-container>
        <ng-container *ngSwitchCase="'list'"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></ng-container>
        <ng-container *ngSwitchCase="'grid'"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></ng-container>
        <ng-container *ngSwitchCase="'mail'"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 5L2 7"/></ng-container>
        <ng-container *ngSwitchCase="'arrow-up-right'"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></ng-container>
        <ng-container *ngSwitchCase="'external-link'"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></ng-container>
        <ng-container *ngSwitchCase="'printer'"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></ng-container>
        <ng-container *ngSwitchCase="'download'"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></ng-container>
        <ng-container *ngSwitchCase="'upload'"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></ng-container>
        <ng-container *ngSwitchCase="'circle'"><circle cx="12" cy="12" r="10"/></ng-container>
        <ng-container *ngSwitchCase="'circle-check'"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></ng-container>
        <ng-container *ngSwitchCase="'circle-x'"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></ng-container>
        <ng-container *ngSwitchCase="'circle-help'"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></ng-container>
      </ng-container>
    </svg>
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; justify-content: center; line-height: 0; }
    svg { transition: transform 150ms ease, color 150ms ease; }
  `]
})
export class IconComponent {
  @Input({ required: true }) name!: IconName;
  @Input() size: number | string = 16;
  @Input() strokeWidth: number = 2;
  @Input() ariaLabel: string | null = null;
}
