import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialog } from 'primeng/confirmdialog';

@Component({
  selector: 'app-confirm-delete',
  standalone: true,
  imports: [CommonModule, ConfirmDialog],
  templateUrl: './confirm-delete.component.html',
})
export class ConfirmDeleteComponent {}
