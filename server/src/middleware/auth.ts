import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

export interface AuthRequest extends Request {
  user?: {
    id: string
    name: string
    isAnonymous: boolean
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      req.user = decoded
      return next()
    } catch (error) {
      // Invalid token, create anonymous user
    }
  }

  // Create anonymous user
  const anonymousId = uuidv4()
  const anonymousUser = {
    id: anonymousId,
    name: `Anonymous_${anonymousId.slice(0, 8)}`,
    isAnonymous: true
  }

  req.user = anonymousUser

  // Create token for anonymous user
  const anonymousToken = jwt.sign(anonymousUser, JWT_SECRET, { expiresIn: '24h' })
  
  res.setHeader('X-Anonymous-Token', anonymousToken)
  next()
}

export const generateToken = (user: { id: string, name: string, isAnonymous: boolean }) => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' })
}

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}