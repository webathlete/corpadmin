/** A file held by the uploader, plus its progress/validation state. */
export interface UploadFile {
  /** Stable id for tracking across renders. */
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'ready' | 'uploading' | 'done' | 'error';
  /** 0-100 while uploading. */
  progress: number;
  /** Set when status is 'error'. */
  error?: string;
  /** Object URL for image previews; revoked when the file is removed. */
  previewUrl?: string;
}

export interface FileRejection {
  file: File;
  reason: 'type' | 'size' | 'count' | 'duplicate';
  message: string;
}

/** Emitted when the caller should perform the actual upload. */
export interface UploadRequest {
  files: UploadFile[];
}
