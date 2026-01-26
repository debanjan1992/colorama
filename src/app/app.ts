import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Toast } from 'primeng/toast';

@Component({
  standalone: true,
  imports: [RouterOutlet, Toast],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
