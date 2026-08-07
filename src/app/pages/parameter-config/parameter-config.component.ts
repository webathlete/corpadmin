import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { simulatedLoading } from '../../core/loading.util';
import { PageLayoutComponent } from '../../shared/page-layout/page-layout.component';
import { DataTableComponent } from '../../shared/data-table/data-table.component';
import { DataColumn, RowAction, RowActionEvent } from '../../shared/data-table/data-table.types';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import {
  PARAM_GROUP_TYPES, ParamGroupType, ParameterConfigService, ParameterEntry,
} from '../../core/services/parameter-config.service';
import { ParameterFormDialogComponent } from './parameter-form-dialog.component';
import { ParameterViewDialogComponent } from './parameter-view-dialog.component';
import { ParameterInlinePanelComponent } from './parameter-inline-panel.component';
import { ParameterExecutionsDialogComponent } from './parameter-executions-dialog.component';

export type CrudStyle = 'dialog' | 'inline';

@Component({
  selector: 'app-parameter-config',
  standalone: true,
  imports: [
    PageLayoutComponent, CommonModule,
    MatTabsModule, MatButtonModule, MatButtonToggleModule, MatIconModule, MatDialogModule, MatSnackBarModule,
    DataTableComponent, ParameterInlinePanelComponent,
  ],
  templateUrl: './parameter-config.component.html',
  styleUrl: './parameter-config.component.scss',
})
export class ParameterConfigComponent {
  readonly loading = simulatedLoading();
  private readonly service = inject(ParameterConfigService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly groupTypes = PARAM_GROUP_TYPES;
  readonly selectedIndex = signal(0);
  readonly currentType = computed(() => this.groupTypes[this.selectedIndex()].type);

  /** Two CRUD interaction styles for the same data, kept side by side for comparison. */
  readonly crudStyle = signal<CrudStyle>('dialog');

  readonly columns: DataColumn<ParameterEntry>[] = [
    { key: 'id', header: 'ID', sortable: true },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'description', header: 'Description', sortable: false },
    {
      key: 'active', header: 'Enabled', type: 'badge', sortable: true,
      format: row => (row.active ? 'Active' : 'Inactive'),
      badge: row => (row.active ? 'success' : 'neutral'),
    },
    { key: 'type', header: 'Type', sortable: true },
    { key: 'createdOn', header: 'Created On', type: 'date', sortable: true },
    { key: 'updatedOn', header: 'Updated On', type: 'date', sortable: true },
  ];

  readonly rowActions: RowAction<ParameterEntry>[] = [
    { action: 'view', label: 'View details', icon: 'visibility' },
    { action: 'executions', label: 'View job executions', icon: 'history' },
    { action: 'edit', label: 'Edit', icon: 'edit' },
    { action: 'delete', label: 'Delete', icon: 'delete', color: 'warn' },
  ];

  private entriesForType(type: ParamGroupType) {
    return computed(() => this.service.entries().filter(e => e.type === type));
  }
  readonly systemEntries = this.entriesForType('System');
  readonly validationEntries = this.entriesForType('Validation');
  readonly integrationEntries = this.entriesForType('Integration');
  readonly workflowEntries = this.entriesForType('Workflow');

  /** Indexed the same as `groupTypes`, so the template can pick a tab's
   *  dataset by index without a ternary chain. */
  readonly entriesByIndex = computed(() => [
    this.systemEntries(), this.validationEntries(), this.integrationEntries(), this.workflowEntries(),
  ]);

  refresh(): void {
    this.loading.set(true);
    setTimeout(() => this.loading.set(false), 600);
    this.snackBar.open('Parameters refreshed', 'Dismiss', { duration: 2000 });
  }

  addNew(): void {
    this.dialog.open(ParameterFormDialogComponent, {
      width: '640px',
      maxWidth: '92vw',
      data: { type: this.currentType() },
    }).afterClosed().subscribe(saved => {
      if (saved) this.snackBar.open('Parameter created', 'Dismiss', { duration: 3000 });
    });
  }

  onRowAction(event: RowActionEvent<ParameterEntry>): void {
    const row = event.row;
    switch (event.action) {
      case 'view':
        this.dialog.open(ParameterViewDialogComponent, {
          width: '560px', maxWidth: '92vw', data: { id: row.id },
        });
        break;
      case 'executions':
        this.dialog.open(ParameterExecutionsDialogComponent, {
          width: '680px', maxWidth: '92vw',
          data: { parameterId: row.id, parameterName: row.name },
        });
        break;
      case 'edit':
        this.dialog.open(ParameterFormDialogComponent, {
          width: '640px', maxWidth: '92vw', data: { type: row.type, entry: row },
        }).afterClosed().subscribe(saved => {
          if (saved) this.snackBar.open('Parameter updated', 'Dismiss', { duration: 3000 });
        });
        break;
      case 'delete':
        this.confirmDialog.confirm({
          title: 'Delete this parameter?',
          message: `"${row.name}" will be permanently removed. This action cannot be undone.`,
          icon: 'delete',
          tone: 'warn',
          confirmLabel: 'Delete',
        }).subscribe(ok => {
          if (!ok) return;
          this.service.delete(row.id);
          this.snackBar.open(`"${row.name}" deleted`, 'Dismiss', { duration: 3000 });
        });
        break;
    }
  }
}
