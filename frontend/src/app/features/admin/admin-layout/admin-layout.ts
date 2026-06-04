import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/icon/icon';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.css']
})
export class AdminLayoutComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  setupOpen = signal(false);
  setupSaving = signal(false);
  setupError = signal<string | null>(null);
  setupForm = { name: '', location: '' };

  initials(): string {
    const u = this.auth.currentUser()?.username ?? '?';
    return u.slice(0, 2).toUpperCase();
  }

  openSetup() {
    this.setupOpen.set(true);
    this.setupError.set(null);
    this.setupForm = { name: '', location: '' };
  }
  closeSetup() {
    if (this.setupSaving()) return;
    this.setupOpen.set(false);
  }
  saveTheater() {
    this.setupSaving.set(true);
    this.setupError.set(null);
    this.auth.setupTheater(this.setupForm.name, this.setupForm.location).subscribe({
      next: () => {
        this.setupSaving.set(false);
        this.closeSetup();
      },
      error: e => {
        this.setupSaving.set(false);
        this.setupError.set(e?.error?.error ?? 'Failed to create theater');
      }
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
