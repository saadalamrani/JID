/** Section 5.1 — super admin portal session cap (2 hours). */
export const SYS_SESSION_MAX_AGE_SECONDS = 7200

/** Section 5.1 — slower login response for admin brute-force deterrence. */
export const SYS_MIN_LOGIN_DELAY_MS = 1200

export const SYS_LOGIN_PATH = '/sys/login' as const
export const SYS_MFA_PATH = '/sys/mfa' as const
export const SYS_HOME_PATH = '/sys/dashboard' as const
