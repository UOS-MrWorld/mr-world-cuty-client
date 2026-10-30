import axios from 'axios'

export interface ApiErrorResponse {
  success: false
  message: string
  code: number
}

export class ApiRequestError extends Error {
  readonly status: number
  readonly code: number
  readonly cause?: unknown

  constructor(message: string, status: number, code = status, cause?: unknown) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
    this.cause = cause
  }
}

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const candidate = value as Record<string, unknown>
  return candidate.success === false
    && typeof candidate.message === 'string'
    && typeof candidate.code === 'number'
}

export function normalizeApiError(error: unknown) {
  if (error instanceof ApiRequestError) return error
  if (!axios.isAxiosError(error)) {
    return new ApiRequestError('요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.', 0, 0, error)
  }

  const status = error.response?.status ?? 0
  const data: unknown = error.response?.data
  if (isApiErrorResponse(data)) {
    return new ApiRequestError(data.message, status || data.code, data.code, error)
  }

  const fallback = status === 401
    ? '로그인이 만료되었습니다. 다시 로그인해 주세요.'
    : status === 403
      ? '이 기능을 사용할 권한이 없습니다.'
      : status === 404
        ? '요청한 정보를 찾을 수 없습니다.'
        : status === 409
          ? '현재 상태에서는 요청을 처리할 수 없습니다.'
          : status >= 500
            ? '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
            : '네트워크 연결을 확인하고 다시 시도해 주세요.'

  return new ApiRequestError(fallback, status, status, error)
}
