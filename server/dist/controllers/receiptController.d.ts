import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
export declare function uploadReceipt(req: AuthRequest, res: Response): Promise<void>;
export declare function getReceipt(req: AuthRequest, res: Response): Promise<void>;
export declare function listReceipts(req: AuthRequest, res: Response): Promise<void>;
export declare function patchReceipt(req: AuthRequest, res: Response): Promise<void>;
