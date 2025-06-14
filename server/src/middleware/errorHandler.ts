import { Request, Response, NextFunction } from 'express'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err)

  // Default error
  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal server error'

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation error'
  }

  // Mongoose duplicate key error
  if (err.code === '11000') {
    statusCode = 409
    message = 'Resource already exists'
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal server error'
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

export const createError = (message: string, statusCode: number = 500, code?: string): ApiError => {
  const error = new Error(message) as ApiError
  error.statusCode = statusCode
  error.code = code
  return error
}