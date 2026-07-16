import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface FooterLink { label: string; url: string; }
export interface FooterColumn { title: string; links: FooterLink[]; }
export interface SocialLink { icon: string; url: string; label: string; }

export interface RichFooterConfig {
  brandName: string;
  brandIcon: string;
  tagline: string;
  columns: FooterColumn[];
  social: SocialLink[];
  copyright: string;
  legal: FooterLink[];
}

export const DEFAULT_RICH_FOOTER: RichFooterConfig = {
  brandName: 'CorpAdmin',
  brandIcon: 'corporate_fare',
  tagline: 'The operations platform for modern teams.',
  columns: [
    { title: 'Product',   links: [{ label: 'Overview', url: '#' }, { label: 'Pricing', url: '#' }, { label: 'Changelog', url: '#' }] },
    { title: 'Company',   links: [{ label: 'About', url: '#' }, { label: 'Careers', url: '#' }, { label: 'Contact', url: '#' }] },
    { title: 'Resources', links: [{ label: 'Docs', url: '#' }, { label: 'API', url: '#' }, { label: 'Status', url: '#' }] },
  ],
  // Material Icons has no brand logos — swap these for brand SVGs if you need them.
  social: [
    { icon: 'public',          url: '#', label: 'Website' },
    { icon: 'code',            url: '#', label: 'GitHub' },
    { icon: 'alternate_email', url: '#', label: 'X' },
    { icon: 'mail',            url: '#', label: 'Email' },
  ],
  copyright: `© ${new Date().getFullYear()} CorpAdmin, Inc.`,
  legal: [{ label: 'Privacy', url: '#' }, { label: 'Terms', url: '#' }, { label: 'Cookies', url: '#' }],
};

/** Expanded, multi-column marketing-style footer. Config-driven; theme-aware. */
@Component({
  selector: 'app-footer-rich',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './footer-rich.component.html',
  styleUrl: './footer-rich.component.scss',
})
export class FooterRichComponent {
  readonly footer = input<RichFooterConfig>(DEFAULT_RICH_FOOTER);
}
