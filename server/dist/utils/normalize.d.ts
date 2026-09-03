export declare function normalizeProductName(name: string): string;
export declare function productMatchKey(name: string): string;
export declare function areProductsSimilar(a: string, b: string): boolean;
export declare function normalizePrice(raw: string): {
    amount: number | null;
    currency: string | null;
};
export declare function parseQuantityToken(token: string): number | null;
export declare function correctOcrText(text: string): string;
