import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
export declare function getOverview(req: AuthRequest, res: Response): Promise<void>;
export declare function getItemHistory(req: AuthRequest, res: Response): Promise<void>;
