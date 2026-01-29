import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  navItems = [
    {
      label: 'Generator',
      route: '/generator',
      icon: 'pi pi-palette',
      preserveParams: true,
    },
    { label: 'Dashboard', route: '/dashboard', icon: 'pi pi-home' },
    {
      label: 'Contact',
      route: 'https://debanjansaha.in/contact',
      icon: 'pi pi-envelope',
      external: true,
    },
  ];
}
