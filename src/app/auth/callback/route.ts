import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  console.log('🔥 Callback route hit:', request.url);
  
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('📝 Code received:', code);
  console.log('📍 Origin:', origin);
  console.log('➡️ Next URL:', next);

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    console.log('🔄 Exchanging code for session...');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('❌ Exchange error:', error);
    } else {
      console.log('✅ Session created successfully:', data.user?.email);
      return NextResponse.redirect(`${origin}${next}`)
    }
  } else {
    console.log('❌ No code found in URL');
  }

  console.log('🔄 Redirecting to error page');
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}