import { OcrDocument, Receipt, ReceiptFilters, ReceiptItem, ReceiptOcrRecord, ReceiptProcessing, PaginatedResult, QrCodeResult } from "../models/receipt";
export declare const receiptRepository: {
    createReceipt(userId: string, imageReference: string): Receipt;
    getById(id: string): Receipt | undefined;
    getByIdForUser(id: string, userId: string): Receipt | undefined;
    updateReceipt(id: string, patch: Partial<Receipt>): Receipt | undefined;
    setProcessingStatus(receiptId: string, status: Receipt["status"], provider?: string, error?: {
        code: string;
        message: string;
    }): void;
    saveOcrResult(receiptId: string, doc: OcrDocument): ReceiptOcrRecord;
    getOcrByReceiptId(receiptId: string): ReceiptOcrRecord | undefined;
    setItems(receiptId: string, items: Omit<ReceiptItem, "id" | "receiptId" | "createdAt">[]): ReceiptItem[];
    setQrCodes(receiptId: string, codes: QrCodeResult[]): void;
    listForUser(userId: string, filters: ReceiptFilters): PaginatedResult<Receipt>;
    getProcessing(receiptId: string): ReceiptProcessing | undefined;
    findItemHistory(userId: string, itemName: string): Array<{
        receipt: Receipt;
        item: ReceiptItem;
    }>;
    getAllForAnalytics(userId: string): Receipt[];
    incrementUsage(userId: string): number;
    getUsage(userId: string): number;
    clearAll(): void;
};
