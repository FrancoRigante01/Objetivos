import { Component, inject } from '@angular/core';

import { ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.component.html'
})
export class ThemeToggleComponent {
  protected readonly theme = inject(ThemeService);
}
