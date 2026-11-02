export interface CloudinaryWidgetOptions {
  cloudName: string;
  apiKey: string;
  folder?: string;
  uploadSignature?: (callback: (signature: string | null) => void, paramsToSign: Record<string, unknown>) => void;
  sources?: string[];
  multiple?: boolean;
  maxFileSize?: number;
  clientAllowedFormats?: string[];
  cropping?: boolean;
  resourceType?: string;
  [key: string]: unknown;
}

export interface CloudinaryUploadWidgetInfo {
  secure_url?: string;
  url?: string;
  public_id?: string;
  format?: string;
  resource_type?: string;
  [key: string]: unknown;
}

export interface CloudinaryUploadWidgetResult {
  event: string;
  info?: CloudinaryUploadWidgetInfo;
}

export interface CloudinaryUploadWidget {
  open: () => void;
  close: () => void;
  destroy: () => void;
  isShowing: () => boolean;
}

export interface CloudinaryInstance {
  createUploadWidget: (
    options: CloudinaryWidgetOptions,
    callback: (error: unknown, result: CloudinaryUploadWidgetResult) => void,
  ) => CloudinaryUploadWidget;
}

declare global {
  interface Window {
    cloudinary?: CloudinaryInstance;
  }
}
