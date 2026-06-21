export type SkillLevel = 'beginner' | 'intermediate' | 'advanced'
export type Goal = 'understand' | 'build' | 'teach'

export interface CourseInput {
  topic: string
  skillLevel: SkillLevel
  goal: Goal
  timeBudget: string
}

export interface ModuleMeta {
  index: number
  title: string
  concepts: string[]
  prereqs: number[]
  estimatedMinutes: number
}

export interface Course {
  id: string
  userId: string
  title: string
  topic: string
  skillLevel: SkillLevel
  goal: Goal
  timeBudget: string
  modules: ModuleMeta[]
  capstone: CapstoneProject | null
  createdAt: string
}

export interface CapstoneProject {
  title: string
  description: string
  steps: string[]
  stretchGoals: string[]
}

export interface QuizQuestion {
  id: string
  type: 'mcq' | 'open'
  question: string
  options?: string[]
  answer: string
  explanation: string
}

export interface ModuleContent {
  courseId: string
  moduleIndex: number
  lessonMarkdown: string
  quizJson: QuizQuestion[]
}

export interface Progress {
  moduleIndex: number
  completed: boolean
  quizScore: number | null
}
