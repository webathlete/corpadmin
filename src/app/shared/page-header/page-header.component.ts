import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Compact page header: a title on the left and projected actions on the right.
 * Reusable on its own or composed inside <app-page-layout>.
 *
 *   <app-page-header title="Team">
 *     <button pageActions mat-raised-button color="primary">Invite</button>
 *   </app-page-header>
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
}
