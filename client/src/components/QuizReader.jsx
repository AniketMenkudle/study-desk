import { QuestionCard, Option, Explain } from "./QuizPlayer";

const LETTERS = "ABCDEFGH";

// Read-only "study" view: every question with the correct answer and explanation.
export default function QuizReader({ quiz }) {
  return (
    <ol className="m-0 mx-auto flex max-w-[920px] list-none flex-col gap-[18px] p-0">
      {quiz.questions.map((q, i) => (
        <QuestionCard key={i} index={i} q={q} className="border-line" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
          {q.type === "mcq" ? (
            <div className="grid gap-2.5">
              {q.options.map((opt, k) => (
                <Option
                  key={k} letter={LETTERS[k]} disabled tabIndex={-1}
                  state={k === q.correctIndex ? "right" : "dim"}
                  mark={k === q.correctIndex ? "right" : null}
                >
                  {opt}
                </Option>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border-l-4 border-good bg-good-bg px-4 py-3 text-[0.93rem]">
              <b className="text-good">Model answer:</b> {q.answer}
            </div>
          )}
          {q.explanation && <Explain>{q.explanation}</Explain>}
        </QuestionCard>
      ))}
    </ol>
  );
}
