import { Component, HostListener, inject, OnInit } from '@angular/core';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { ColorStore } from './store/color.store';
import { ColorPanelComponent } from './components/color-panel/color-panel.component';
import { SavePaletteComponent } from './components/save-palette/save-palette.component';

@Component({
  standalone: true,
  imports: [ColorPanelComponent, ToolbarComponent, SavePaletteComponent],
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
