export type ReceiptStatus = "uploaded" | "processing" | "needs_review" | "completed" | "failed";
export type ProcessingStatus = ReceiptStatus;
export type CurrencyCode = string;
export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface OcrElement {
    text: string;
    confidence: number;
    boundingBox: BoundingBox;
    language?: string;
}
export interface OcrDocument {
    elements: OcrElement[];
    rawText: string;
    provider: string;
    processedAt: string;
    pageWidth?: number;
    pageHeight?: number;
}
export interface QrCodeResult {
    type: "qr" | "barcode";
    value: string;
    confidence: number;
    boundingBox?: BoundingBox;
}
export interface ScoredField<T> {
    value: T;
    confidence: number;
    source?: string;
}
export interface ReceiptItem {
    id: string;
    receiptId: string;
    name: string;
    quantity: number;
    unitPrice: number | null;
    totalPrice: number;
    confidence: number;
    boundingBox?: BoundingBox;
    createdAt: string;
}
export interface Receipt {
    id: string;
    userId: string;
    merchantName: ScoredField<string | null>;
    purchaseDate: ScoredField<string | null>;
    purchaseTime: ScoredField<string | null>;
    currency: CurrencyCode;
    subtotal: ScoredField<number | null>;
    tax: ScoredField<number | null>;
    discount: ScoredField<number | null>;
    total: ScoredField<number | null>;
    paymentMethod: ScoredField<string | null>;
    receiptNumber: ScoredField<string | null>;
    status: ReceiptStatus;
    confidence: number;
    imageReference: string;
    processedImageReference: string | null;
    items: ReceiptItem[];
    qrCodes: QrCodeResult[];
    createdAt: string;
    updatedAt: string;
}
export interface ReceiptProcessing {
    id: string;
    receiptId: string;
    processingStatus: ProcessingStatus;
    ocrProvider: string;
    processingStartedAt: string | null;
    processingCompletedAt: string | null;
    errorCode: string | null;
    errorMessage: string | null;
}
export interface ReceiptOcrRecord {
    id: string;
    receiptId: string;
    provider: string;
    rawDocument: OcrDocument;
    createdAt: string;
}
export interface User {
    id: string;
    createdAt: string;
}
export interface UsageRecord {
    userId: string;
    receiptsScanned: number;
    storageBytes: number;
    periodStart: string;
}
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface ReceiptFilters {
    page?: number;
    limit?: number;
    merchant?: string;
    from?: string;
    to?: string;
    search?: string;
    sortBy?: "createdAt" | "purchaseDate" | "total" | "merchant";
    sortOrder?: "asc" | "desc";
    status?: ReceiptStatus;
}
export interface AnalyticsOverview {
    totalSpending: number;
    currency: string;
    receiptCount: number;
    averageReceiptValue: number;
    spendingByMerchant: Array<{
        merchant: string;
        total: number;
        count: number;
    }>;
    spendingOverTime: Array<{
        date: string;
        total: number;
        count: number;
    }>;
    spendingByCategory?: Array<{
        category: string;
        total: number;
    }>;
}
export interface ItemHistoryEntry {
    receiptId: string;
    merchant: string | null;
    purchaseDate: string | null;
    quantity: number;
    unitPrice: number | null;
    totalPrice: number;
    currency: string;
}
export type ErrorCode = "INVALID_IMAGE" | "UNSUPPORTED_TYPE" | "FILE_TOO_LARGE" | "EMPTY_UPLOAD" | "OCR_FAILED" | "OCR_LOW_CONFIDENCE" | "RECEIPT_NOT_DETECTED" | "PARSER_FAILED" | "VALIDATION_FAILED" | "DATABASE_ERROR" | "NOT_FOUND" | "UNAUTHORIZED" | "FORBIDDEN" | "RATE_LIMITED" | "QUOTA_EXCEEDED";
export interface ApiError {
    code: ErrorCode;
    message: string;
    details?: unknown;
}
export interface ParsedReceipt {
    merchant: ScoredField<string | null>;
    date: ScoredField<string | null>;
    time: ScoredField<string | null>;
    currency: string;
    items: Array<{
        name: string;
        quantity: number;
        unitPrice: number | null;
        totalPrice: number;
        confidence: number;
        boundingBox?: BoundingBox;
    }>;
    subtotal: ScoredField<number | null>;
    tax: ScoredField<number | null>;
    discount: ScoredField<number | null>;
    total: ScoredField<number | null>;
    paymentMethod: ScoredField<string | null>;
    receiptNumber: ScoredField<string | null>;
    overallConfidence: number;
}
