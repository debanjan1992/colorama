import { Component, HostListener, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ColorPanelComponent } from './components/color-panel/color-panel.component';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { ColorStore } from './store/color.store';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ColorPanelComponent,
    HeaderComponent,
    ToolbarComponent,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  readonly store = inject(ColorStore);

  ngOnInit() {
    this.store.generateColors();
  }

  @HostListener('window:keydown.space', ['$event'])
  handleSpace(event: Event) {
    if (this.store.activeShadesPanelId()) return;

    event.preventDefault();
    this.store.generateColors();
  }

  insertColor(index: number) {
    this.store.insertColor(index);
  }
}
