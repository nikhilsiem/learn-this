import { auth, signIn, signOut } from '@/lib/auth'
import { InputForm } from '@/components/InputForm'
import { Button } from '@/components/ui/button'

async function AuthButton() {
  const session = await auth()

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{session.user.email}</span>
        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/' })
          }}
        >
          <Button type="submit" variant="outline" size="sm">Sign out</Button>
        </form>
      </div>
    )
  }

  return (
    <form
      action={async () => {
        'use server'
        await signIn('google', { redirectTo: '/' })
      }}
    >
      <Button type="submit" variant="outline" size="sm">Sign in</Button>
    </form>
  )
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Learn This</h1>
          <AuthButton />
        </div>
      </header>
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl font-bold tracking-tight">
            Turn any topic into a personalized course
          </h2>
          <p className="text-lg text-muted-foreground">
            Powered by AI. Free forever.
          </p>
        </div>
        <InputForm />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          <div className="border rounded-lg p-6 text-center space-y-2">
            <div className="text-2xl">🧠</div>
            <h3 className="font-medium">Smart structure</h3>
            <p className="text-sm text-muted-foreground">AI builds a curriculum tailored to your level and goals</p>
          </div>
          <div className="border rounded-lg p-6 text-center space-y-2">
            <div className="text-2xl">🔨</div>
            <h3 className="font-medium">Learn by doing</h3>
            <p className="text-sm text-muted-foreground">Each module includes examples, quizzes, and a capstone project</p>
          </div>
          <div className="border rounded-lg p-6 text-center space-y-2">
            <div className="text-2xl">📝</div>
            <h3 className="font-medium">Quiz yourself</h3>
            <p className="text-sm text-muted-foreground">Test your understanding with AI-generated questions after each lesson</p>
          </div>
        </div>
      </main>
    </div>
  )
}
