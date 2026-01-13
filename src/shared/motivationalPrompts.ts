// Non-cheesy micro-prompts that rotate during focus sessions
export const motivationalPrompts = [
  "One task at a time.",
  "Deep work creates value.",
  "Focus is a skill.",
  "Build momentum.",
  "Trust the process.",
  "Small steps, big impact.",
  "Present moment only.",
  "Quality over quantity.",
  "Stay in the zone.",
  "Eliminate, then execute.",
  "Depth beats breadth.",
  "Ship it today.",
  "Progress compounds.",
  "Think less, do more.",
  "Flow state activated.",
  "Constraints breed creativity.",
  "Done beats perfect.",
  "Single-task mode.",
  "Clear mind, clear code.",
  "Finish what you started.",
  "Distraction is expensive.",
  "Make it work first.",
  "Build, measure, learn.",
  "Your future self thanks you.",
  "Intensity creates results.",
  "No zero days.",
  "Be here now.",
  "Action over overthinking.",
  "Consistency wins.",
  "Work with intention.",
];

export function getRandomPrompt(): string {
  return motivationalPrompts[Math.floor(Math.random() * motivationalPrompts.length)];
}

export function getRotatingPrompt(index: number): string {
  return motivationalPrompts[index % motivationalPrompts.length];
}
