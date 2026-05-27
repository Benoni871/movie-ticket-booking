import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/models/user.model';

type Mode = 'signin' | 'signup-user' | 'signup-admin';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex bg-slate-50">
      <!-- Marketing side -->
      <div class="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white relative overflow-hidden">
        <div class="absolute -top-32 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl"></div>
        <div class="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-pink-500/20 blur-3xl"></div>

        <div class="relative flex items-center gap-2">
          <span class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur font-bold">C</span>
          <span class="text-xl font-bold tracking-tight">CineBook</span>
        </div>

        <div class="relative space-y-4">
          <h1 class="text-4xl xl:text-5xl font-bold leading-tight">
            Book your seats.<br />
            <span class="text-amber-300">Run your theater.</span>
          </h1>
          <p class="text-indigo-100 max-w-md">
            Moviegoers reserve seats in seconds. Theater owners get their own admin console to manage movies, schedule shows, and track every booking.
          </p>
          <ul class="space-y-2 text-sm text-indigo-100 pt-2">
            <li class="flex items-center gap-2">✓ Interactive seat picker</li>
            <li class="flex items-center gap-2">✓ Transparent cancellation refunds</li>
            <li class="flex items-center gap-2">✓ Multi-theater management</li>
          </ul>
        </div>

        <div class="relative text-xs text-indigo-200">© {{ year }} CineBook · Demo MVP</div>
      </div>

      <!-- Form side -->
      <div class="flex flex-1 items-center justify-center px-6 py-12">
        <div class="w-full max-w-md">
          <div class="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold shadow">C</span>
            <span class="text-xl font-bold text-slate-900">CineBook</span>
          </div>

          <!-- Top tabs: Sign In / Sign Up -->
          <div class="flex bg-slate-100 rounded-lg p-1 mb-6">
            <button type="button" (click)="setMode('signin')"
                    [ngClass]="mode() === 'signin'
                      ? 'bg-white shadow text-slate-900'
                      : 'text-slate-500 hover:text-slate-700'"
                    class="flex-1 text-sm font-semibold py-2 rounded-md transition">
              Sign In
            </button>
            <button type="button" (click)="setMode('signup-user')"
                    [ngClass]="mode() !== 'signin'
                      ? 'bg-white shadow text-slate-900'
                      : 'text-slate-500 hover:text-slate-700'"
                    class="flex-1 text-sm font-semibold py-2 rounded-md transition">
              Create Account
            </button>
          </div>

          @if (mode() === 'signin') {
            <h2 class="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p class="text-sm text-slate-500 mt-1">Sign in to book or manage your theater.</p>

            <form (ngSubmit)="signIn()" #f="ngForm" class="space-y-4 mt-6">
              <div>
                <label class="label" for="su">Username</label>
                <input class="input" id="su" name="su" [(ngModel)]="signin.username" required autofocus />
              </div>
              <div>
                <label class="label" for="sp">Password</label>
                <input class="input" id="sp" name="sp" type="password" [(ngModel)]="signin.password" required />
              </div>

              @if (error()) {
                <div class="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md p-3">{{ error() }}</div>
              }

              <button type="submit" class="btn-primary w-full" [disabled]="loading() || !f.valid">
                {{ loading() ? 'Signing in…' : 'Sign In' }}
              </button>
            </form>
          } @else {
            <h2 class="text-2xl font-bold text-slate-900">Create an account</h2>
            <p class="text-sm text-slate-500 mt-1">Choose how you'd like to use CineBook.</p>

            <!-- Role selector cards -->
            <div class="grid grid-cols-2 gap-3 mt-5">
              <button type="button" (click)="setMode('signup-user')"
                      [ngClass]="mode() === 'signup-user'
                        ? 'ring-2 ring-indigo-500 bg-indigo-50'
                        : 'ring-1 ring-slate-200 hover:ring-indigo-300'"
                      class="rounded-lg p-3 text-left transition">
                <div class="text-2xl">🎬</div>
                <div class="font-semibold text-sm text-slate-900 mt-1">Moviegoer</div>
                <div class="text-[10px] text-slate-500">Book tickets at any theater</div>
              </button>
              <button type="button" (click)="setMode('signup-admin')"
                      [ngClass]="mode() === 'signup-admin'
                        ? 'ring-2 ring-indigo-500 bg-indigo-50'
                        : 'ring-1 ring-slate-200 hover:ring-indigo-300'"
                      class="rounded-lg p-3 text-left transition">
                <div class="text-2xl">🏛</div>
                <div class="font-semibold text-sm text-slate-900 mt-1">Theater Owner</div>
                <div class="text-[10px] text-slate-500">Run your own cinema admin</div>
              </button>
            </div>

            <form (ngSubmit)="signUp()" #g="ngForm" class="space-y-4 mt-5">
              <div>
                <label class="label" for="ru">Username</label>
                <input class="input" id="ru" name="ru" [(ngModel)]="signup.username" required minlength="3" placeholder="At least 3 characters" />
              </div>
              <div>
                <label class="label" for="rp">Password</label>
                <input class="input" id="rp" name="rp" type="password" [(ngModel)]="signup.password" required minlength="4" placeholder="At least 4 characters" />
              </div>

              @if (mode() === 'signup-admin') {
                <div class="pt-2 border-t border-slate-100">
                  <p class="text-xs text-slate-500 mb-3">Your theater details — these are visible to moviegoers when they pick a show.</p>
                  <div class="space-y-3">
                    <div>
                      <label class="label" for="tn">Theater name</label>
                      <input class="input" id="tn" name="tn" [(ngModel)]="signup.theaterName" required placeholder="e.g. PVR Downtown" />
                    </div>
                    <div>
                      <label class="label" for="tl">Location</label>
                      <input class="input" id="tl" name="tl" [(ngModel)]="signup.theaterLocation" placeholder="e.g. 12 Main St, Boston" />
                    </div>
                  </div>
                </div>
              }

              @if (error()) {
                <div class="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md p-3">{{ error() }}</div>
              }

              <button type="submit" class="btn-primary w-full" [disabled]="loading() || !g.valid || !canSubmitSignup()">
                {{ loading() ? 'Creating…' : (mode() === 'signup-admin' ? 'Create theater & sign in' : 'Sign up & start booking') }}
              </button>

              <p class="text-[11px] text-slate-400 text-center">
                Already have an account?
                <button type="button" class="text-indigo-600 hover:underline font-semibold" (click)="setMode('signin')">Sign in</button>
              </p>
            </form>
          }
        </div>
      </div>
    </div>
  `
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
