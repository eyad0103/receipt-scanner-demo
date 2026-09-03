import { QrCodeResult } from "../models/receipt";
export declare function detectQrCodes(imageBuffer: Buffer): Promise<QrCodeResult[]>;
