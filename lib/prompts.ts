import type { CourseInput, ModuleMeta, Course } from './types'

export function plannerPrompt(input: CourseInput): string {
  return `You are an expert curriculum designer.

A user wants to learn: "${input.topic}"
Their skill level: ${input.skillLevel}
Their goal: ${input.goal} (understand = conceptual depth, build = practical skills, teach = comprehensive coverage)
Available time: ${input.timeBudget}

Generate a structured learning path as a JSON object. Return ONLY valid JSON, no markdown fences, no explanation.

Schema:
{
  "title": "Short course title (max 8 words)",
  "modules": [
    {
      "index": 0,
      "title": "Module title",
      "concepts": ["concept 1", "concept 2", "concept 3"],
      "prereqs": [],
      "estimatedMinutes": 20
    }
  ]
}

Rules:
- 4–8 modules total depending on time budget
- Each module has 3–6 concepts
- prereqs is an array of module indices that must be completed first
- estimatedMinutes should fit within the total time budget
- Order modules from foundational to advanced
- Tailor depth to skill level: beginners need more foundational modules`
}

export function lessonPrompt(module: ModuleMeta, course: Course): string {
  return `You are a world-class teacher writing a lesson for an online course.

Course: "${course.title}"
Learner skill level: ${course.skillLevel}
Learner goal: ${course.goal}

Write a complete lesson for module ${module.index + 1}: "${module.title}"

Concepts to cover: ${module.concepts.join(', ')}

Format the lesson in Markdown with this structure:
# ${module.title}

## Overview
(2–3 sentence intro explaining why this matters)

## Core Concepts
(One H3 section per concept with explanation + a concrete example)

## How It All Connects
(Short paragraph tying the concepts together)

## Key Takeaways
(3–5 bullet points)

Rules:
- Use real, concrete examples (not "foo/bar" for coding topics)
- Tailor vocabulary to ${course.skillLevel} level
- If goal is "build", include a short code snippet or hands-on step per concept
- If goal is "teach", add a "Common misconceptions" section at the end
- Aim for 600–900 words`
}

export function quizPrompt(module: ModuleMeta, lessonMarkdown: string): string {
  return `You are creating quiz questions for a lesson.

Lesson title: "${module.title}"
Lesson content:
${lessonMarkdown.slice(0, 3000)}

Generate 4 quiz questions as a JSON array. Return ONLY valid JSON, no markdown fences.

Schema:
[
  {
    "id": "q1",
    "type": "mcq",
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "answer": "A",
    "explanation": "..."
  }
]

Rules:
- 3 MCQ questions (type: "mcq") and 1 open-ended (type: "open")
- For open-ended: omit "options", set "answer" to a model answer (2–3 sentences)
- Questions should test understanding, not memorisation
- Wrong MCQ options should be plausible, not obviously wrong
- Explanations should teach, not just confirm`
}

export function capstonePrompt(course: Course): string {
  return `You are designing a capstone project for a course.

Course: "${course.title}"
Skill level: ${course.skillLevel}
Goal: ${course.goal}
Modules covered: ${course.modules.map(m => m.title).join(', ')}

Generate a capstone project as a JSON object. Return ONLY valid JSON, no markdown fences.

Schema:
{
  "title": "Project title",
  "description": "2–3 sentence description of what the learner will build/do",
  "steps": ["step 1", "step 2", "step 3", "step 4", "step 5"],
  "stretchGoals": ["optional extension 1", "optional extension 2"]
}

Rules:
- The project should exercise all major concepts from the course
- Steps should be concrete and actionable
- For "build" goal: make it a real artifact the learner can put in a portfolio
- For "understand" goal: make it a research/presentation/explanation task
- For "teach" goal: make it a lesson plan or tutorial they'd write for others`
}
