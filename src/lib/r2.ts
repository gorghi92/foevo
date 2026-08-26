import crypto from 'crypto'

// Cloudflare R2 — S3-compatible object storage.
// We generate SigV4 presigned URLs so the browser uploads (PUT) directly to R2,
// bypassing Vercel's 4.5MB serverless body limit. Egress from R2 is free.

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? ''
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID ?? ''
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY ?? ''
const BUCKET = process.env.R2_BUCKET ?? 'groaly-media'
const ENDPOINT = process.env.R2_ENDPOINT ?? (ACCOUNT_ID ? `https://${ACCOUNT_ID}.r2.cloudflarestorage.com` : '')
const PUBLIC_BASE = (process.env.R2_PUBLIC_BASE ?? '').replace(/\/$/, '')
const REGION = 'auto'
const SERVICE = 's3'

export function r2Configured(): boolean {
  return Boolean(ACCESS_KEY && SECRET_KEY && ENDPOINT && BUCKET)
}

/** Public CDN URL for a stored object. */
export function r2PublicUrl(key: string): string {
  return `${PUBLIC_BASE}/${key.split('/').map(encodeURIComponent).join('/')}`
}

function hmac(key: crypto.BinaryLike | crypto.KeyObject, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest()
}

function sha256hex(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex')
}

function signingKey(datestamp: string): Buffer {
  const kDate = hmac(`AWS4${SECRET_KEY}`, datestamp)
  const kRegion = hmac(kDate, REGION)
  const kService = hmac(kRegion, SERVICE)
  return hmac(kService, 'aws4_request')
}

/** Encode each path segment but preserve the slashes between them. */
function encodeKey(key: string): string {
  return key.split('/').map(encodeURIComponent).join('/')
}

/**
 * Generate a SigV4 presigned URL for the given HTTP method on `key`.
 * The browser can call fetch(url, { method, body }) directly against R2.
 * Payload is UNSIGNED so the body (and Content-Type) need not be known here.
 */
function presign(method: 'PUT' | 'GET' | 'DELETE', key: string, expiresSeconds = 900): string {
  if (!r2Configured()) throw new Error('R2 not configured')
  const host = new URL(ENDPOINT).host
  const now = new Date()
  const amzdate = now.toISOString().replace(/[:-]|\.\d{3}/g, '') // YYYYMMDDTHHMMSSZ
  const datestamp = amzdate.slice(0, 8)

  const credential = `${ACCESS_KEY}/${datestamp}/${REGION}/${SERVICE}/aws4_request`
  const canonicalUri = `/${BUCKET}/${encodeKey(key)}`

  const params: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': amzdate,
    'X-Amz-Expires': String(expiresSeconds),
    'X-Amz-SignedHeaders': 'host',
  }
  const canonicalQuery = Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k]!)}`)
    .join('&')

  const canonicalHeaders = `host:${host}\n`
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n')

  const scope = `${datestamp}/${REGION}/${SERVICE}/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzdate,
    scope,
    sha256hex(canonicalRequest),
  ].join('\n')

  const signature = hmac(signingKey(datestamp), stringToSign).toString('hex')
  return `${ENDPOINT}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`
}

/** Presigned URL the browser PUTs the file to (direct upload, no Vercel limit). */
export function r2PresignPut(key: string, expiresSeconds = 900): string {
  return presign('PUT', key, expiresSeconds)
}

/**
 * Upload bytes to R2 server-side via a short-lived presigned PUT. Use this for
 * small files (receipts, avatars) that fit under Vercel's serverless body limit:
 * it avoids the browser→R2 direct PUT, which requires bucket CORS to be
 * configured and otherwise fails with an opaque 403. Only `host` is signed, so
 * sending Content-Type here does not break the signature.
 */
export async function r2Put(key: string, body: Buffer | Uint8Array, contentType?: string): Promise<boolean> {
  const url = presign('PUT', key, 300)
  const res = await fetch(url, {
    method: 'PUT',
    body: new Uint8Array(body),
    headers: contentType ? { 'content-type': contentType } : undefined,
  })
  return res.ok
}

/** Delete an object server-side. */
export async function r2Delete(key: string): Promise<boolean> {
  const url = presign('DELETE', key, 300)
  const res = await fetch(url, { method: 'DELETE' })
  return res.ok || res.status === 404
}

/**
 * Presigned GET URL — a time-limited download link. Used to hand out expiring
 * links to paid buyers (e.g. a digital deliverable) without exposing the object
 * publicly.
 */
export function r2PresignGet(key: string, expiresSeconds = 3600): string {
  return presign('GET', key, expiresSeconds)
}

/**
 * Fetch an object's bytes server-side (via a short-lived presigned GET). Used to
 * pull a source file into memory for on-the-fly transforms like per-buyer PDF
 * watermarking before streaming it to the customer.
 */
export async function r2FetchObject(key: string): Promise<Buffer | null> {
  const url = presign('GET', key, 300)
  const res = await fetch(url)
  if (!res.ok) return null
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}
