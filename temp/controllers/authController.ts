import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/Users'

const JWT_SECRET = process.env.JWT_SECRET || 'fallbacksecret'

// REGISTER
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      res.status(400).json({ message: 'Email already in use' })
      return
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    })

    // Return token
    const token = jwt.sign({ uuid: user.uuid }, JWT_SECRET, { expiresIn: '7d' })

    res.status(201).json({
      token,
      user: {
        uuid: user.uuid,
        name: user.name,
        email: user.email,
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

// LOGIN
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' })
      return
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' })
      return
    }

    // Return token
    const token = jwt.sign({ uuid: user.uuid }, JWT_SECRET, { expiresIn: '7d' })

    res.status(200).json({
      token,
      user: {
        uuid: user.uuid,
        name: user.name,
        email: user.email,
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}