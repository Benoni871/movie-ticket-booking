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
  templateUrl: './icon.html',
  styleUrls: ['./icon.css']
})
export class IconComponent {
  @Input({ required: true }) name!: IconName;
  @Input() size: number | string = 16;
  @Input() strokeWidth: number = 2;
  @Input() ariaLabel: string | null = null;
}
