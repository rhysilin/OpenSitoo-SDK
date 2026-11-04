export interface WireSchema {
    type?: 'object' | 'string';
    const?: string | number;
    enum?: readonly string[];
    pattern?: string;
    maxLength?: number;
    properties?: Readonly<Record<string, WireSchema>>;
    required?: readonly string[];
    additionalProperties?: false;
    anyOf?: readonly WireSchema[];
}
export declare const UUID_PATTERN = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}(?![\\s\\S])";
export declare const CAPABILITY_ID_PATTERN = "^[a-z][a-z0-9-]{0,62}/[a-z][a-z0-9.-]{0,126}(?![\\s\\S])";
export declare const requestSchema: WireSchema;
export declare const taskReferenceSchema: WireSchema;
export declare const responseSchema: WireSchema;
