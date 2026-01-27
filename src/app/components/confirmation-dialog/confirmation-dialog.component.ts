import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { SharedModule } from 'primeng/api';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, ConfirmDialog, SharedModule],
  templateUrl: './confirmation-dialog.component.html',
})
export class ConfirmationDialogComponent {}
