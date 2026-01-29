import { Route } from '@angular/router';
import { GeneratorComponent } from './features/generator/generator.component';

export const appRoutes: Route[] = [
  {
    path: 'generator',
    component: GeneratorComponent,
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
    children: [
      {
        path: 'palettes',
        loadComponent: () =>
          import('./features/dashboard/palettes/palettes.component').then(
            (m) => m.DashboardPalettesComponent,
          ),
      },
      {
        path: 'colors',
        loadComponent: () =>
          import('./features/dashboard/colors/colors.component').then(
            (m) => m.DashboardColorsComponent,
          ),
      },
      {
        path: '',
        redirectTo: 'palettes',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/generator',
    pathMatch: 'full',
  },
];
