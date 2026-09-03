import { Request, Response, NextFunction } from "express";
export declare function sanitizeInput(req: Request, _res: Response, next: NextFunction): void;
export declare function noCache(_req: Request, res: Response, next: NextFunction): void;
export declare function validateReceiptId(req: Request, _res: Response, next: NextFunction): void;
