import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";

export const validateFiles = (requiredFiles: Array<string>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log("req.files::::", req.body);
    // Single file uploaded
    if (req.file && req.file?.fieldname != requiredFiles[0])
      return next(new ErrorHandler(`${requiredFiles[0]} are required`, 400));

    // Multiple files uploaded
    requiredFiles.forEach((fileKey: string) => {
      if (!req.files[fileKey])
        return next(new ErrorHandler(`${fileKey} are required`, 400));
    });

    next();
  };
};

export default validateFiles;
