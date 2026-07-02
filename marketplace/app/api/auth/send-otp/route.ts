import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_OTP_PER_MINUTE = 3
const MAX_OTP_PER_HOUR = 10

const hourlyLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()

  // Check minute limit
  const minuteData = rateLimitMap.get(identifier)
  if (minuteData) {
    if (now > minuteData.resetTime) {
      rateLimitMap.delete(identifier)
    } else if (minuteData.count >= MAX_OTP_PER_MINUTE) {
      return { allowed: false, retryAfter: Math.ceil((minuteData.resetTime - now) / 1000) }
    }
  }

  // Check hourly limit
  const hourlyData = hourlyLimitMap.get(identifier)
  if (hourlyData) {
    if (now > hourlyData.resetTime) {
      hourlyLimitMap.delete(identifier)
    } else if (hourlyData.count >= MAX_OTP_PER_HOUR) {
      return { allowed: false, retryAfter: Math.ceil((hourlyData.resetTime - now) / 1000) }
    }
  }

  return { allowed: true }
}

function recordRateLimit(identifier: string) {
  const now = Date.now()

  // Update minute limit
  const minuteData = rateLimitMap.get(identifier)
  if (minuteData) {
    minuteData.count++
  } else {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
  }

  // Update hourly limit
  const hourlyData = hourlyLimitMap.get(identifier)
  if (hourlyData) {
    hourlyData.count++
  } else {
    hourlyLimitMap.set(identifier, { count: 1, resetTime: now + (60 * 60 * 1000) })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json(
        { error: 'Numéro de téléphone requis' },
        { status: 400 }
      )
    }

    // Get client IP for rate limiting
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown'

    // Check rate limit based on phone number AND IP
    const phoneLimit = checkRateLimit(`phone:${phone}`)
    if (!phoneLimit.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez plus tard.', retryAfter: phoneLimit.retryAfter },
        { status: 429 }
      )
    }

    const ipLimit = checkRateLimit(`ip:${ip}`)
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez plus tard.', retryAfter: ipLimit.retryAfter },
        { status: 429 }
      )
    }

    // Send OTP via Supabase
    const { error } = await supabase.auth.signInWithOtp({ phone })

    if (error) {
      // Don't record rate limit on error (except specific rate limit errors from Supabase)
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Trop de tentatives. Réessayez plus tard.' },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { error: error.message || 'Erreur lors de l\'envoi du code' },
        { status: 400 }
      )
    }

    // Record successful OTP send
    recordRateLimit(`phone:${phone}`)
    recordRateLimit(`ip:${ip}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('OTP send error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
