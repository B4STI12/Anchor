import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'onboarding',
    loadComponent: () =>
      import('./modules/onboarding/onboarding.component').then(m => m.OnboardingComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./core/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'app',
    loadComponent: () =>
      import('./layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'bundles', pathMatch: 'full' },
      {
        path: 'bundles',
        loadComponent: () =>
          import('./modules/bundles/bundles.component').then(m => m.BundlesComponent),
      },
      {
        path: 'notes',
        loadComponent: () =>
          import('./modules/notes/notes.component').then(m => m.NotesComponent),
      },
      {
        path: 'snippets',
        loadComponent: () =>
          import('./modules/snippets/snippets.component').then(m => m.SnippetsComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./settings/settings.component').then(m => m.SettingsComponent),
      },
      {
        path: 'email',
        loadComponent: () =>
          import('./modules/email/email.component').then(m => m.EmailComponent),
      },
      {
        path: 'email-triad',
        loadComponent: () =>
          import('./modules/email-triad/email-triad.component').then(m => m.EmailTriadComponent),
      },
    ],
  },
  { path: '**', redirectTo: '/login' },
];
