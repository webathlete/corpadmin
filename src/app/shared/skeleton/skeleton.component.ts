import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonVariant =
  | 'text'      // a line of body text
  | 'title'     // a taller, wider heading bar
  | 'avatar'    // a circle
  | 'thumbnail' // a small rounded square
  | 'button'    // a pill
  | 'chart'     // a large block (chart / image area)
  | 'block';    // generic rectangle

/**
 * Modern ghost / shimmer skeleton placeholder.
 *
 * Usage:
 *   <app-skeleton variant="title"></app-skeleton>
 *   <app-skeleton variant="text" [count]="3"></app-skeleton>
 *   <app-skeleton variant="avatar" width="42px" height="42px"></app-skeleton>
 *   <app-skeleton variant="chart" height="180px"></app-skeleton>
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
})
export class SkeletonComponent {
  @Input() variant: SkeletonVariant = 'text';
  @Input() width?: string;
  @Input() height?: string;
  @Input() radius?: string;
  /** Render multiple stacked bars (handy for paragraphs / list rows). */
  @Input() count = 1;

  get repeat(): number[] {
    return Array.from({ length: Math.max(1, this.count) }, (_, i) => i);
  }

  /** Last line of a multi-line text block is shortened for a natural look. */
  resolvedWidth(i: number): string | null {
    if (this.width) return this.width;
    if (this.variant === 'text' && this.count > 1 && i === this.count - 1) {
      return '60%';
    }
    return null;
  }
}
