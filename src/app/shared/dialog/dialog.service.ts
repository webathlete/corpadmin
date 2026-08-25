import { Injectable, TemplateRef, Type, inject } from '@angular/core';
import { ComponentType } from '@angular/cdk/portal';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DIALOG_SIZES, DialogOptions } from './dialog.types';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(MatDialog);

  /** Opens a component or inline template inside a sized Material dialog. */
  open<T, D = unknown, R = unknown>(
    content: ComponentType<T> | TemplateRef<T>,
    options: DialogOptions<D> = {},
  ): MatDialogRef<T, R> {
    const { size = 'md', panelClass, ...config } = options;
    return this.dialog.open<T, D, R>(content as ComponentType<T>, {
      width: DIALOG_SIZES[size],
      panelClass: ['app-dialog-panel', ...(panelClass ? [panelClass].flat() : [])],
      maxWidth: '95vw',
      maxHeight: size === 'full' ? '92vh' : '85vh',
      autoFocus: 'dialog',
      restoreFocus: true,
      ...config,
    });
  }

  /** Opens and resolves with the dialog result. */
  openAsync<T, D = unknown, R = unknown>(
    content: ComponentType<T> | TemplateRef<T>,
    options: DialogOptions<D> = {},
  ): Promise<R | undefined> {
    return firstResult(this.open<T, D, R>(content, options));
  }
}

function firstResult<T, R>(ref: MatDialogRef<T, R>): Promise<R | undefined> {
  return new Promise(resolve => ref.afterClosed().subscribe(resolve));
}
