import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const QUESTIONS = [
  { q: "What day comes after Monday?", options: ["Sunday", "Tuesday", "Friday"], a: 1 },
  { q: "How many minutes are in one hour?", options: ["30", "60", "90"], a: 1 },
  { q: "Which is a fruit?", options: ["Carrot", "Apple", "Broccoli"], a: 1 },
  { q: "What is the capital of India?", options: ["Bihar", "Delhi", "Mumbai"], a: 1 },
  { q: "What color is the sky on a clear day?", options: ["Green", "Blue", "Red"], a: 1 },
  { q: "How many sides does a triangle have?", options: ["2", "3", "4"], a: 1 },
  { q: "What is 2 + 2?", options: ["3", "4", "5"], a: 1 },
  { q: "What is the largest planet in our solar system?", options: ["Earth", "Mars", "Jupiter"], a: 2 },
  { q: "What is the boiling point of water?", options: ["100°C", "90°C", "80°C"], a: 0 },
  { q: "What is the main ingredient in bread?", options: ["Rice", "Wheat", "Corn"], a: 1 }
];

export default function BrainQuiz() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const quizQuestions = useMemo(() => {
    return [...QUESTIONS]
      .sort(() => Math.random() - 0.5) 
      .slice(0, 4); 
  }, []);

  const done = currentIndex >= quizQuestions.length;
  const score = useMemo(() => {
    return answers.filter((a, i) => a === quizQuestions[i].a).length;
  }, [answers, quizQuestions]);

  const onAnswer = (idx: number) => {
    setAnswers((prev) => [...prev, idx]);
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <Card aria-labelledby="quiz-title">
      <CardHeader>
        <CardTitle id="quiz-title">Brain Quiz</CardTitle>
        <CardDescription>Fun mental exercises for engagement.</CardDescription>
      </CardHeader>
      <CardContent>
        {!done ? (
          <div>
            <p className="text-xl mb-4">{quizQuestions[currentIndex].q}</p>
            <div className="grid gap-3">
              {quizQuestions[currentIndex].options.map((opt, i) => (
                <Button
                  key={i}
                  variant="soft"
                  onClick={() => onAnswer(i)}
                  aria-label={`Answer ${opt}`}
                >
                  {opt}
                </Button>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Question {currentIndex + 1} of {quizQuestions.length}
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-2xl font-semibold">
              Score: {score} / {quizQuestions.length}
            </p>
            <Button
              className="mt-4"
              variant="hero"
              onClick={() => {
                setCurrentIndex(0);
                setAnswers([]);
              }}
              aria-label="Restart quiz"
            >
              Play Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
