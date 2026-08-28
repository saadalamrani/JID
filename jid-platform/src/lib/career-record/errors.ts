export class CareerRecordError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message)
    this.name = 'CareerRecordError'
  }
}

type RpcError = { message: string; code?: string | null }

export function mapRpcError(error: RpcError): never {
  const code = error.code ?? ''
  const message = error.message ?? 'تعذر إكمال العملية'

  if (/authentication required/i.test(message)) {
    throw new CareerRecordError('يجب تسجيل الدخول', 401)
  }
  if (code === '40001' || /stale revision/i.test(message)) {
    throw new CareerRecordError('تم تعديل السجل من جهة أخرى. حدّث الصفحة ثم أعد المحاولة', 409)
  }
  if (code === '23505' || /already has a cv snapshot|snapshot link failed/i.test(message)) {
    throw new CareerRecordError('هذه الطلبات مرتبطة بلقطة سيرة ذاتية ولا يمكن استبدالها بصمت', 409)
  }
  if (/must be|required|manifest|retention_policy|JSON object|JSON array/i.test(message)) {
    throw new CareerRecordError('البيانات غير صالحة', 422)
  }
  if (
    code === '42501' ||
    /not found for current subject|not active|requires a|does not match|insufficient|disclosure authorization/i.test(
      message,
    )
  ) {
    throw new CareerRecordError('غير مصرح', 403)
  }
  if (/not found/i.test(message)) {
    throw new CareerRecordError('العنصر غير موجود', 404)
  }
  throw new CareerRecordError('تعذر إكمال العملية', 400)
}

export function httpStatusForCareerRecordError(error: CareerRecordError): number {
  if (
    error.status === 401 ||
    error.status === 403 ||
    error.status === 404 ||
    error.status === 409 ||
    error.status === 422
  ) {
    return error.status
  }
  return 400
}

export function publicCareerRecordMessage(error: unknown): { status: number; message: string } {
  if (error instanceof CareerRecordError) {
    return { status: httpStatusForCareerRecordError(error), message: error.message }
  }
  return { status: 400, message: 'تعذر إكمال العملية' }
}
