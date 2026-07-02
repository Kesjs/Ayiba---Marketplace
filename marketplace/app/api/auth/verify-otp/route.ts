import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Track failed OTP attempts per phone number
const failedAttemptsMap = new Map<string, { count: number; resetTime: number; lockedUntil?: number }>()

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
const ATTEMPT_WINDOW = 5 * 60 * 1000 // 5 minutes

function checkOTPAttempts(phone: string): { allowed: boolean; attemptsRemaining?: number; lockedUntil?: number } {
  const now = Date.now()
  const data = failedAttemptsMap.get(phone)

  if (!data) {
    return { allowed: true, attemptsRemaining: MAX_ATTEMPTS }
  }

  // Check if locked out
  if (data.lockedUntil && now < data.lockedUntil) {
    return { 
      allowed: false, 
      lockedUntil: Math.ceil((data.lockedUntil - now) / 1000) 
    }
  }

  // Reset if window expired
  if (now > data.resetTime) {
    failedAttemptsMap.delete(phone)
    return { allowed: true, attemptsRemaining: MAX_ATTEMPTS }
  }

  // Check if max attempts reached
  if (data.count >= MAX_ATTEMPTS) {
    // Lock the account
    data.lockedUntil = now + LOCKOUT_DURATION
    failedAttemptsMap.set(phone, data)
    return { 
      allowed: false, 
      lockedUntil: Math.ceil((data.lockedUntil - now) / 1000) 
    }
  }

  return { 
    allowed: true, 
    attemptsRemaining: MAX_ATTEMPTS - data.count 
  }
}

function recordFailedAttempt(phone: string) {
  const now = Date.now()
  const data = failedAttemptsMap.get(phone)

  if (data) {
    data.count++
    if (data.count >= MAX_ATTEMPTS) {
      data.lockedUntil = now + LOCKOUT_DURATION
    }
  } else {
    failedAttemptsMap.set(phone, {
      count: 1,
      resetTime: now + ATTEMPT_WINDOW
    })
  }
}

function clearFailedAttempts(phone: string) {
  failedAttemptsMap.delete(phone)
}

export async function POST(req: NextRequest) {
  try {
    const { phone, token } = await req.json()

    if (!phone || !token) {
      return NextResponse.json(
        { error: 'Numéro de téléphone et code requis' },
        { status: 400 }
      )
    }

    if (token.length !== 6) {
      return NextResponse.json(
        { error: 'Le code doit contenir 6 chiffres' },
        { status: 400 }
      )
    }

    // Check rate limiting for failed attempts
    const attemptCheck = checkOTPAttempts(phone)
    if (!attemptCheck.allowed) {
      if (attemptCheck.lockedUntil) {
        return NextResponse.json(
          { 
            error: 'Trop de tentatives incorrectes. Compte temporairement verrouillé.',
            lockedUntil: attemptCheck.lockedUntil
          },
          { status: 429 }
        )
      }
    }

    // Verify OTP with Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    })

    if (error) {
      // Record failed attempt
      recordFailedAttempt(phone)

      const attemptCheck = checkOTPAttempts(phone)
      
      return NextResponse.json(
        { 
          error: error.message.includes('expired') ? 'Code expiré' : 'Code incorrect',
          attemptsRemaining: attemptCheck.attemptsRemaining
        },
        { status: 400 }
      )
    }

    // Clear failed attempts on success
    clearFailedAttempts(phone)

    return NextResponse.json({ 
      success: true,
      user: data.user
    })
  } catch (error) {
    console.error('OTP verify error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
