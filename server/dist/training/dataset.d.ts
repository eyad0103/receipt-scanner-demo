export interface VerifiedExample {
    id: string;
    ocrText: string;
    ocrElements: Array<{
        text: string;
        confidence: number;
    }>;
    corrected: {
        merchant: string | null;
        items: Array<{
            name: string;
            quantity: number;
            totalPrice: number;
        }>;
        total: number | null;
    };
    createdAt: string;
}
export declare function loadDataset(): VerifiedExample[];
export declare function saveExample(ex: VerifiedExample): void;
export declare function getProductDictionary(): Map<string, number>;
export declare function getMerchantDictionary(): Map<string, number>;
