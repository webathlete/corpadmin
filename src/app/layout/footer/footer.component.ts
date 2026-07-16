import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterConfig, DEFAULT_FOOTER } from '../layout.config';

/**
 * Global application footer, pinned to the bottom of the shell.
 * Content is driven by the `footer` input — bind your own FooterConfig
 * or rely on the default.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  readonly footer = input<FooterConfig>(DEFAULT_FOOTER);
}
