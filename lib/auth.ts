import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { supabaseAdmin } from './supabase'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      await supabaseAdmin.from('users').upsert({
        email: user.email!,
        name: user.name,
        image: user.image,
      }, { onConflict: 'email' })
      return true
    },
    async session({ session, token }) {
      if (session.user?.email) {
        const { data } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', session.user.email)
          .single()
        if (data) session.user.id = data.id
      }
      return session
    },
  },
})
