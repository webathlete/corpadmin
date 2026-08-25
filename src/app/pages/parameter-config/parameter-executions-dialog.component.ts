import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ParameterExecutionService } from '../../core/services/parameter-execution.service';
import { ParameterExecutionsListComponent } from './parameter-executions-list.component';
import { DialogComponent } from '../../shared/dialog/dialog.component';
import { DialogActionsDirective } from '../../shared/dialog/dialog-actions.directive';

export interface ParameterExecutionsDialogData {
  parameterId: string;
  parameterName: string;
}

@Component({
  selector: 'app-parameter-executions-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, ParameterExecutionsListComponent, DialogComponent, DialogActionsDirective],
  templateUrl: './parameter-executions-dialog.component.html',
  styleUrl: './parameter-executions-dialog.component.scss',
})
export class ParameterExecutionsDialogComponent {
  readonly ref = inject(MatDialogRef<ParameterExecutionsDialogComponent>);
  readonly data = inject<ParameterExecutionsDialogData>(MAT_DIALOG_DATA);
  private readonly execService = inject(ParameterExecutionService);

  readonly executions = computed(() => this.execService.getExecutions(this.data.parameterId));
}
