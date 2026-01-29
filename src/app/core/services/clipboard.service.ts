import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { APP_CONFIG } from '../../config/app.config';

@Injectable({
  providedIn: 'root',
})
export class ClipboardService {
  private readonly messageService = inject(MessageService);

  async copyText(
    text: string,
    successMessage = 'Copied to clipboard',
  ): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.messageService.add({
        severity: 'success',
        summary: successMessage,
        life: APP_CONFIG.toast.life,
      });
    } catch (err) {
      console.error('Failed to copy text: ', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Failed to copy',
        detail: 'Please try again manually.',
        life: APP_CONFIG.toast.life,
      });
    }
  }
}
