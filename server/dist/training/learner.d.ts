export declare function correctProductName(raw: string, dict?: Map<string, number>): {
    corrected: string;
    wasCorrected: boolean;
    confidenceBoost: number;
};
export declare function correctMerchant(raw: string | null, dict?: Map<string, number>): string | null;
export declare function trainFromSynthetic(count?: number): void;
