import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/models/user.model';
import { IconComponent } from '../../../shared/icon/icon';

type Mode = 'signin' | 'signup-user' | 'signup-admin';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  mode = signal<Mode>('signin');
  loading = signal(false);
  error = signal<string | null>(null);
  year = new Date().getFullYear();

  signin = { username: '', password: '' };
  signup = { username: '', password: '', theaterName: '', theaterLocation: '' };

  setMode(m: Mode) {
    this.mode.set(m);
    this.error.set(null);
  }

  canSubmitSignup(): boolean {
    if (this.mode() === 'signup-admin') {
      return !!this.signup.theaterName?.trim();
    }
    return true;
  }

  signIn() {
    this.error.set(null);
    this.loading.set(true);
    this.auth.login(this.signin.username, this.signin.password).subscribe({
      next: u => this.handleAuthed(u),
      error: err => this.fail(err)
    });
  }

  signUp() {
    this.error.set(null);
    this.loading.set(true);
    const obs = this.mode() === 'signup-admin'
      ? this.auth.registerAdmin({
          username: this.signup.username,
          password: this.signup.password,
          theaterName: this.signup.theaterName,
          theaterLocation: this.signup.theaterLocation
        })
      : this.auth.register({
          username: this.signup.username,
          password: this.signup.password
        });

    obs.subscribe({
      next: u => this.handleAuthed(u),
      error: err => this.fail(err)
    });
  }

  private handleAuthed(res: { role: Role }) {
    this.loading.set(false);
    this.router.navigate([res.role === 'ADMIN' ? '/admin' : '/movies']);
  }

  private fail(err: any) {
    this.loading.set(false);
    this.error.set(err?.error?.error ?? err?.message ?? 'Something went wrong');
  }
}
