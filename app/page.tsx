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
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-heading font-semibold tracking-tight">
            Learn&nbsp;<span className="text-primary">This</span>
          </h1>
          <AuthButton />
        </div>
      </header>
      <main className="flex-1 max-w-4xl mx-auto px-4 py-20 w-full">
        <div className="text-center mb-12 space-y-5">
          <h2 className="text-5xl font-heading font-bold tracking-tight leading-tight">
            Turn any topic into a<br />
            <span className="text-primary">personalized course</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Tell us what you want to learn. AI builds a curriculum, generates lessons, quizzes, and a capstone — in seconds.
          </p>
        </div>
        <InputForm />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20">
          <div className="bg-card border border-border rounded-xl p-6 space-y-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">🧠</div>
            <h3 className="font-heading font-medium text-foreground">Smart structure</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">AI builds a curriculum tailored to your level and goals</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 space-y-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">🔨</div>
            <h3 className="font-heading font-medium text-foreground">Learn by doing</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Each module includes examples, quizzes, and a capstone project</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 space-y-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">📝</div>
            <h3 className="font-heading font-medium text-foreground">Quiz yourself</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Test your understanding with AI-generated questions after each lesson</p>
          </div>
        </div>
      </main>
    </div>
  )
}
