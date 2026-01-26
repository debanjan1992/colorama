import { Route } from '@angular/router';
import { GeneratorComponent } from './pages/generator/generator.component';

export const appRoutes: Route[] = [
  {
    path: 'generator',
    component: GeneratorComponent,
  },
  {
    path: '',
    redirectTo: '/generator',
    pathMatch: 'full',
  },
];
