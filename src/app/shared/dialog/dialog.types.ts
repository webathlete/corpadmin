import { MatDialogConfig } from '@angular/material/dialog';

/** Standard width variants. `full` goes near-fullscreen for dense tables. */
export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export const DIALOG_SIZES: Record<DialogSize, string> = {
  sm: '400px',
  md: '560px',
  lg: '760px',
  xl: '1040px',
  full: '96vw',
};

export interface DialogOptions<D = unknown> extends MatDialogConfig<D> {
  size?: DialogSize;
}
