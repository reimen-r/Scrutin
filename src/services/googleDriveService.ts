import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

const DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

const DRIVE_API = 'https://www.googleapis.com/drive/v3';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
]);

export function getAuthRequest(): AuthSession.AuthRequest {
  return new AuthSession.AuthRequest({
    clientId: WEB_CLIENT_ID,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    responseType: AuthSession.ResponseType.Code,
    redirectUri: getRedirectUri(),
    usePKCE: true,
    extraParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  });
}

export function getRedirectUri() {
  return AuthSession.makeRedirectUri({
    scheme: 'contractanalyzer',
    path: 'oauth2/callback',
  });
}

export async function exchangeCode(code: string, codeVerifier: string): Promise<string> {
  const tokenResult = await AuthSession.exchangeCodeAsync(
    {
      clientId: WEB_CLIENT_ID,
      code,
      redirectUri: getRedirectUri(),
      extraParams: {
        code_verifier: codeVerifier,
      },
    },
    DISCOVERY,
  );
  return tokenResult.accessToken;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  modifiedTime: string;
  thumbnailLink?: string;
}

export async function listDriveFiles(
  accessToken: string,
  query?: string,
  pageToken?: string,
): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  const mimeQuery = [
    "mimeType='application/pdf'",
    "mimeType='image/jpeg'",
    "mimeType='image/png'",
    "mimeType='image/webp'",
    "mimeType='image/gif'",
    "mimeType='image/bmp'",
    "mimeType='image/tiff'",
  ].join(' or ');

  let q = `(${mimeQuery}) and trashed=false`;
  if (query) {
    q += ` and name contains '${query.replace(/'/g, "\\'")}'`;
  }

  const params = new URLSearchParams({
    q,
    fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime,thumbnailLink)',
    pageSize: '50',
    orderBy: 'modifiedTime desc',
  });

  if (pageToken) {
    params.set('pageToken', pageToken);
  }

  const res = await fetch(`${DRIVE_API}/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Error al listar archivos: ${res.status}`);
  }

  const data = await res.json();
  return {
    files: (data.files || []).filter((f: DriveFile) => ALLOWED_MIME_TYPES.has(f.mimeType)),
    nextPageToken: data.nextPageToken,
  };
}

export async function downloadDriveFile(
  accessToken: string,
  fileId: string,
): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Error al descargar archivo: ${res.status}`);
  }

  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const blob = await res.blob();
  const buffer = await blob.arrayBuffer();
  const base64 = uint8ArrayToBase64(new Uint8Array(buffer));

  return { base64, mimeType: contentType };
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function getFileTypeLabel(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  return 'file';
}
