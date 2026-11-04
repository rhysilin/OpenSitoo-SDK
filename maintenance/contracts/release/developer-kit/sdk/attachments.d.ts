export interface AppAttachment {
    id: string;
    name: string;
    mimeType: 'image/png';
    bytes: number;
    dataUrl: string;
}
export interface AppImageReference {
    id: string;
    description: string;
}
/** Normalized PNG data; the host decodes and validates it again. */
export interface AppImageUpload {
    name: string;
    dataUrl: string;
}
