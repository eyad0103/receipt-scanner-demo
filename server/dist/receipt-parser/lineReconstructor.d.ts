import { OcrElement } from "../models/receipt";
export interface ReconstructedLine {
    id: string;
    elements: OcrElement[];
    text: string;
    confidence: number;
    bbox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    yCenter: number;
    height: number;
}
export declare function cleanElements(elements: OcrElement[]): OcrElement[];
export declare function associateColumns(lines: ReconstructedLine[]): ReconstructedLine[];
export declare function reconstructLines(elements: OcrElement[], opts?: {
    threshold?: number;
}): ReconstructedLine[];
