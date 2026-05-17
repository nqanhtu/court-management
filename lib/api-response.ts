import { NextResponse } from 'next/server'

type ApiPayload<T> = {
  success: boolean
  data?: T
  message?: string
  errors?: unknown
}

export function apiSuccess<T>(data?: T, message?: string, init?: ResponseInit) {
  return NextResponse.json<ApiPayload<T>>(
    { success: true, data, message },
    init
  )
}

export function apiError(message: string, status = 400, errors?: unknown) {
  return NextResponse.json<ApiPayload<never>>(
    { success: false, message, errors },
    { status }
  )
}
