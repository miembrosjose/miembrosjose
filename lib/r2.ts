// Cloudflare R2 client (S3-compatible) — usado pelo /api/admin/upload.
// Bucket "miembros" guarda thumbs (WebP) e vídeos (MP4 cru) das temporadas.

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const BUCKET = process.env.R2_BUCKET
const PUBLIC_URL = process.env.R2_PUBLIC_URL

function requireEnv() {
  if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET || !PUBLIC_URL) {
    throw new Error(
      "R2 env vars não configuradas. Verifique R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL no .env.local",
    )
  }
}

export function getR2Client(): S3Client {
  requireEnv()
  return new S3Client({
    region: "auto",
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ACCESS_KEY_ID!,
      secretAccessKey: SECRET_ACCESS_KEY!,
    },
  })
}

/** Sobe um arquivo binário pro R2. Retorna a URL pública. */
export async function uploadToR2(params: {
  key: string
  body: Buffer | Uint8Array
  contentType: string
}): Promise<{ url: string; key: string }> {
  requireEnv()
  const client = getR2Client()
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET!,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  )
  return {
    key: params.key,
    url: `${PUBLIC_URL}/${params.key}`,
  }
}

/** Remove um arquivo do R2 a partir da URL pública (ou só da key). */
export async function deleteFromR2(urlOrKey: string): Promise<void> {
  requireEnv()
  let key = urlOrKey
  // Se vier URL completa, extrai a key (parte depois do bucket public URL)
  if (urlOrKey.startsWith(PUBLIC_URL!)) {
    key = urlOrKey.slice(PUBLIC_URL!.length).replace(/^\//, "")
  }
  if (!key) return
  const client = getR2Client()
  await client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET!,
      Key: key,
    }),
  )
}

/** Gera uma key segura pra upload — kind/<uuid>.<ext> */
export function generateKey(kind: "seasons" | "avatars" | "feed" | "misc", ext: string): string {
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin"
  const id = crypto.randomUUID()
  return `${kind}/${id}.${safeExt}`
}
