import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { simulatedLoading } from '../../core/loading.util';
import { RouterModule } from '@angular/router';
import { PageLayoutComponent } from '../../shared/page-layout/page-layout.component';
import {
  FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl,
} from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatRadioModule } from '@angular/material/radio';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, startWith } from 'rxjs/operators';
import { ConfirmDialogComponent } from './confirm-dialog.component';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    PageLayoutComponent,
    CommonModule, RouterModule, ReactiveFormsModule,
    MatStepperModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatRadioModule, MatAutocompleteModule, MatChipsModule,
    MatSlideToggleModule, MatSliderModule, MatCheckboxModule, MatButtonModule,
    MatIconModule, MatDividerModule,
  ],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
})
export class OnboardingComponent {
  readonly loading = simulatedLoading();
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly roles = ['Engineer', 'Designer', 'Product Manager', 'Sales', 'Marketing', 'Operations'];
  readonly allDepartments = ['Engineering', 'Design', 'Product', 'Sales', 'Marketing', 'Finance', 'People Ops', 'Legal'];

  readonly separatorKeys = [ENTER, COMMA] as const;
  readonly skills = signal<string[]>(['TypeScript', 'Angular']);

  readonly account: FormGroup = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required],
  });

  readonly profile: FormGroup = this.fb.group({
    startDate: [null, Validators.required],
    employment: ['full-time', Validators.required],
    department: [''],
  });

  readonly preferences: FormGroup = this.fb.group({
    notifications: [true],
    weeklyDigest: [false],
    workload: [80],
    agree: [false, Validators.requiredTrue],
  });

  /** Autocomplete: filter departments by current input. */
  readonly deptControl = this.profile.get('department') as FormControl;
  readonly filteredDepartments = (this.deptControl.valueChanges).pipe(
    startWith(''),
    map((v: string) => {
      const q = (v ?? '').toLowerCase();
      return this.allDepartments.filter(d => d.toLowerCase().includes(q));
    }),
  );

  /** Plain method (re-evaluated each CD cycle) — form values aren't signals. */
  summary() {
    return {
      name: this.account.get('fullName')?.value ?? '',
      email: this.account.get('email')?.value ?? '',
      role: this.account.get('role')?.value ?? '',
    };
  }

  addSkill(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.skills().includes(value)) {
      this.skills.update(s => [...s, value]);
    }
    event.chipInput?.clear();
  }

  removeSkill(skill: string): void {
    this.skills.update(s => s.filter(x => x !== skill));
  }

  finish(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: this.summary(),
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.snack.open(
          `${this.summary().name || 'Team member'} onboarded successfully 🎉`,
          'Dismiss',
          { duration: 4000, horizontalPosition: 'right', verticalPosition: 'top' },
        );
      }
    });
  }
}
