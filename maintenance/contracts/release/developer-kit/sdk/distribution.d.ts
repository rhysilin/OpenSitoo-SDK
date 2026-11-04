import { z } from 'zod';
import { type RegisteredApp } from './platform.js';
/** v1 deliberately ships data and static UI, never a host executable. */
export declare const appPackageSchema: z.ZodObject<{
    formatVersion: z.ZodLiteral<1>;
    execution: z.ZodLiteral<"static-platform">;
    app: z.ZodCustom<RegisteredApp, RegisteredApp>;
    bindings: z.ZodRecord<z.ZodString, z.ZodEnum<{
        "text.echo": "text.echo";
        "text.generate": "text.generate";
        "images.generate": "images.generate";
        "capabilities.text-request": "capabilities.text-request";
        "capabilities.image-request": "capabilities.image-request";
        "capabilities.call": "capabilities.call";
    }>>;
    resourcePacks: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
    }, z.core.$strict>>>;
    files: z.ZodRecord<z.ZodString, z.ZodObject<{
        bytes: z.ZodNumber;
        sha256: z.ZodString;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type AppPackage = z.infer<typeof appPackageSchema>;
export declare function safeAppPath(value: string): boolean;
export declare function validateAppPackage(input: unknown): AppPackage;
