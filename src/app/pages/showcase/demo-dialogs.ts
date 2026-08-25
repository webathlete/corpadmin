import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { DialogComponent } from '../../shared/dialog/dialog.component';
import { DialogActionsDirective } from '../../shared/dialog/dialog-actions.directive';

/** Message body — the smallest possible use of the shell. */
@Component({
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, DialogComponent, DialogActionsDirective],
  template: `
    <app-dialog title="Delete parameter?" subtitle="PARAM_001 · Retry Thresholds"
                icon="delete_outline" tone="warn">
      <p>This parameter is referenced by 3 active jobs. Deleting it stops those jobs
         at their next scheduled run. This cannot be undone.</p>
      <ng-container dialogActions>
        <button mat-button mat-dialog-close>Cancel</button>
        <button mat-flat-button class="danger-btn" [mat-dialog-close]="true">Delete</button>
      </ng-container>
    </app-dialog>
  `,
  styles: `
    .danger-btn {
      --mdc-filled-button-container-color: var(--status-error);
      --mdc-filled-button-label-text-color: #fff;
    }
  `,
})
export class MessageDialogDemo {}

/** Form body, with the action bar split across both edges. */
@Component({
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule, DialogComponent, DialogActionsDirective,
  ],
  template: `
    <app-dialog title="Edit parameter" subtitle="PARAM_004 · Discount Bands"
                icon="tune" actionsAlign="between">
      <form class="demo-dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Parameter name</mat-label>
          <input matInput [(ngModel)]="model.name" name="name" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Data type</mat-label>
          <mat-select [(ngModel)]="model.type" name="type">
            @for (t of types; track t) { <mat-option [value]="t">{{ t }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="span-2">
          <mat-label>Description</mat-label>
          <textarea matInput rows="3" [(ngModel)]="model.desc" name="desc"></textarea>
        </mat-form-field>
        <mat-slide-toggle [(ngModel)]="model.active" name="active">Active</mat-slide-toggle>
      </form>
      <ng-container dialogActions>
        <button mat-button>Reset</button>
        <span>
          <button mat-button mat-dialog-close>Cancel</button>
          <button mat-flat-button color="primary" [mat-dialog-close]="model">Save changes</button>
        </span>
      </ng-container>
    </app-dialog>
  `,
  styles: `
    .demo-dialog-form {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0 16px;
      padding-top: 8px;
    }
    .span-2 { grid-column: 1 / -1; }
    .demo-dialog-form .mat-mdc-slide-toggle { transform-origin: left center; }
    @media (max-width: 599px) { .demo-dialog-form { grid-template-columns: 1fr; } }
  `,
})
export class FormDialogDemo {
  model = { name: 'Discount Bands', type: 'Percentage', desc: 'Tiered discount thresholds applied at checkout.', active: true };
  readonly types = ['Integer', 'Decimal', 'Percentage', 'String', 'Boolean'];
}

/** Table body using `flush` so rows run edge to edge under the header. */
@Component({
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatTableModule, DialogComponent, DialogActionsDirective],
  template: `
    <app-dialog [title]="data.title" subtitle="12 runs · last 24 hours" icon="table_chart" flush>
      <table mat-table [dataSource]="runs">
        <ng-container matColumnDef="run">
          <th mat-header-cell *matHeaderCellDef>Run</th>
          <td mat-cell *matCellDef="let r">{{ r.run }}</td>
        </ng-container>
        <ng-container matColumnDef="started">
          <th mat-header-cell *matHeaderCellDef>Started</th>
          <td mat-cell *matCellDef="let r">{{ r.started }}</td>
        </ng-container>
        <ng-container matColumnDef="duration">
          <th mat-header-cell *matHeaderCellDef>Duration</th>
          <td mat-cell *matCellDef="let r">{{ r.duration }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let r">{{ r.status }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols; sticky: true"></tr>
        <tr mat-row *matRowDef="let row; columns: cols"></tr>
      </table>
      <ng-container dialogActions>
        <button mat-button mat-dialog-close>Close</button>
        <button mat-flat-button color="primary">Export CSV</button>
      </ng-container>
    </app-dialog>
  `,
})
export class TableDialogDemo {
  readonly ref = inject(MatDialogRef<TableDialogDemo>);
  readonly data = inject<{ title: string }>(MAT_DIALOG_DATA);
  readonly cols = ['run', 'started', 'duration', 'status'];
  readonly runs = Array.from({ length: 12 }, (_, i) => ({
    run: `RUN-${(1042 - i).toString()}`,
    started: `${String(23 - i).padStart(2, '0')}:15`,
    duration: `${2 + (i % 7)}m ${10 + i * 3}s`,
    status: i % 5 === 0 ? 'Failed' : i % 3 === 0 ? 'Running' : 'Completed',
  }));
}
