import { z } from 'zod';
/** Declarative resources only. These manifests never grant code execution or permissions. */
export declare const appResourcePackSchema: z.ZodObject<{
    contractVersion: z.ZodLiteral<1>;
    id: z.ZodString;
    version: z.ZodString;
    targetAppId: z.ZodString;
    appVersionRange: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    industries: z.ZodArray<z.ZodString>;
    license: z.ZodString;
    source: z.ZodOptional<z.ZodString>;
    resources: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodEnum<{
            "design-rule": "design-rule";
            style: "style";
            reference: "reference";
            template: "template";
            font: "font";
            "delivery-spec": "delivery-spec";
            checklist: "checklist";
        }>;
        path: z.ZodString;
        sha256: z.ZodString;
        license: z.ZodString;
        attribution: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type AppResourcePack = z.infer<typeof appResourcePackSchema>;
export interface AppResourceSnapshot {
    packId: string;
    version: string;
    sha256: string;
}
