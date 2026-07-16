import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { simulatedLoading } from '../../core/loading.util';
import { PageLayoutComponent } from '../../shared/page-layout/page-layout.component';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTabsModule } from '@angular/material/tabs';
import { ThemeService, THEME_PRESETS } from '../../core/services/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    PageLayoutComponent,
    CommonModule, ReactiveFormsModule, FormsModule,
    MatStepperModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSlideToggleModule, MatSliderModule, MatRadioModule, MatCheckboxModule,
    MatDatepickerModule, MatNativeDateModule, MatChipsModule,
    MatDividerModule, MatTooltipModule, MatSnackBarModule,
    MatAutocompleteModule, MatTabsModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  readonly loading = simulatedLoading();
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  readonly themeService = inject(ThemeService);
  readonly themes = THEME_PRESETS;

  readonly profileForm = this.fb.group({
    firstName: ['Govind', Validators.required],
    lastName:  ['Sundaramoorthy', Validators.required],
    email:     ['govidotcom@gmail.com', [Validators.required, Validators.email]],
    phone:     ['+1 (555) 012-3456'],
    jobTitle:  ['Platform Administrator'],
    department:['engineering'],
    startDate: [new Date('2022-01-15')],
    bio:       ['Platform administrator with a passion for clean code and great UX.'],
  });

  readonly passwordStepOne = this.fb.group({ current: ['', Validators.required] });
  readonly passwordStepTwo = this.fb.group({
    newPass: ['', Validators.required],
    confirm: ['', Validators.required],
  });

  readonly emailNotifications = [
    { key: 'deals',    title: 'Deal Updates',        desc: 'When a deal changes stage or is closed', enabled: true },
    { key: 'reports',  title: 'Weekly Reports',       desc: 'Your weekly performance digest every Monday', enabled: true },
    { key: 'mentions', title: 'Mentions & Comments',  desc: 'When someone mentions you in a comment', enabled: true },
    { key: 'alerts',   title: 'System Alerts',        desc: 'Critical infrastructure and security alerts', enabled: false },
    { key: 'billing',  title: 'Billing & Invoices',   desc: 'Payment confirmations and invoice notifications', enabled: true },
    { key: 'updates',  title: 'Product Updates',      desc: 'New features, improvements, and release notes', enabled: false },
  ];

  saveProfile(): void {
    if (this.profileForm.valid) {
      this.snackBar.open('Profile saved successfully!', 'Dismiss', { duration: 3000 });
    }
  }

  savePassword(stepper: any): void {
    stepper.reset();
    this.passwordStepOne.reset();
    this.passwordStepTwo.reset();
    this.snackBar.open('Password changed successfully!', 'Dismiss', { duration: 3000 });
  }
}
