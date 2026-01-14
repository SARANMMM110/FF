/**
 * Local Google OAuth implementation
 * Generates OAuth redirect URL using Google OAuth directly
 */

export function getGoogleOAuthRedirectUrl(
  clientId: string,
  redirectUri: string,
  state?: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });

  if (state) {
    params.set('state', state);
  }

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange OAuth code for tokens
 */
export async function exchangeGoogleCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  id_token?: string;
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Token exchange failed: ${errorText}`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error_description) {
        errorMessage = `${errorJson.error}: ${errorJson.error_description}`;
      }
    } catch {
      // If not JSON, use the text as-is
    }
    console.error("❌ [Google OAuth] Token exchange error:", errorMessage);
    console.error("❌ [Google OAuth] Request details:", {
      redirectUri,
      clientId: clientId.substring(0, 20) + '...',
      hasCode: !!code
    });
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Get user info from Google using access token
 */
export async function getGoogleUserInfo(accessToken: string): Promise<{
  id: string;
  email: string;
  name: string;
  picture?: string;
}> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user info from Google');
  }

  return response.json();
}

