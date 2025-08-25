import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const cookieStore = cookies()
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
    
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_error`)
    }

    if (session) {
      const user = session.user;
      
      // Check if a business profile exists for this user
      const { data: profile, error: profileError } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "No rows found"
        console.error('Error checking for profile:', profileError);
        // Redirect to dashboard anyway, user can create profile manually
        return NextResponse.redirect(`${origin}/dashboard`)
      }

      // If no profile exists, it's a new user. Redirect to profile setup.
      if (!profile) {
        return NextResponse.redirect(`${origin}/profile?new=true`)
      }
    }
    
    // Existing user or successful profile creation, redirect to dashboard
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  // Redirect to an error page if no code is provided
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
