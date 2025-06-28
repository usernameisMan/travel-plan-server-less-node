import { Request, Response, NextFunction } from "express";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";

export function validationMiddleware<T>(type: any): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    validate(plainToClass(type, req.body))
      .then((errors) => {
        if (errors.length > 0) {
          const message = errors
            .map((error) => Object.values(error.constraints || {}))
            .join(", ");
          res.status(400).json({
            success: false,
            message: "验证失败",
            errors: message,
          });
        } else {
          next();
        }
      })
      .catch((error) => {
        res.status(500).json({
          success: false,
          message: "验证过程中发生错误",
          error: error.message,
        });
      });
  };
} 