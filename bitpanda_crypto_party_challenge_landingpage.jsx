import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Coins, Trophy, Zap, TimerReset, Sparkles, ShieldCheck, ArrowRight, Users, RotateCcw } from "lucide-react";

const questions = [
  {
    category: "Basics",
    difficulty: "Easy",
    points: 100,
    question: "What does HODL commonly mean in crypto culture?",
    options: [
      "Hold your coins instead of panic selling",
      "High odds daily leverage",
      "A hardware wallet brand",
      "A token launch format",
    ],
    answer: 0,
    explanation: "HODL is the crypto slang for holding assets through volatility instead of selling impulsively.",
  },
  {
    category: "Trading",
    difficulty: "Easy",
    points: 100,
    question: "What is Bitcoin often described as?",
    options: ["A stablecoin", "Digital gold", "A bank account", "A stock index"],
    answer: 1,
    explanation: "Bitcoin is often referred to as digital gold because of its scarcity and store-of-value narrative.",
  },
  {
    category: "Security",
    difficulty: "Medium",
    points: 200,
    question: "What is the safest way to protect exchange access?",
    options: ["Use one short password everywhere", "Turn off notifications", "Enable 2FA", "Share login with friends"],
    answer: 2,
    explanation: "Two-factor authentication adds an extra layer of protection beyond just a password.",
  },
  {
    category: "Web3",
    difficulty: "Medium",
    points: 200,
    question: "What does a blockchain primarily provide?",
    options: ["A shared tamper-resistant transaction record", "Unlimited returns", "Free Wi-Fi", "Private bank insurance"],
    answer: 0,
    explanation: "A blockchain is a distributed ledger that records transactions transparently and immutably.",
  },
  {
    category: "Bitpanda",
    difficulty: "Easy",
    points: 150,
    question: "Which of these best matches Bitpanda's positioning?",
    options: [
      "A Europe-focused investing platform",
      "A food delivery app",
      "A video editing suite",
      "A cloud gaming brand",
    ],
    answer: 0,
    explanation: "Bitpanda positions itself as a European platform for investing across crypto and additional asset classes.",
  },
  {
    category: "Risk",
    difficulty: "Hard",
    points: 300,
    question: "What is volatility in crypto markets?",
    options: [
      "How quickly prices can move up or down",
      "A guaranteed profit mechanism",
      "A hardware mining setting",
      "A legal license for brokers",
    ],
    answer: 0,
    explanation: "Volatility describes how strongly and quickly market prices fluctuate.",
  },
];

const challengeCards = [
  { title: "Speed Round", text: "You have 8 seconds only. Fastest answer wins the full points.", bonus: "+50 bonus" },
  { title: "Double Down", text: "Answer correctly and the team gets double points. Wrong answer = zero.", bonus: "2x stakes" },
  { title: "Steal Chance", text: "If the active team is wrong, the other team can steal the points.", bonus: "Pressure mode" },
  { title: "Explain It", text: "After answering, explain the term in one sentence to lock your points.", bonus: "Knowledge flex" },
];

const brand = {
  bg: "#0B0F0D",
  panel: "#111714",
  panel2: "#15211B",
  line: "#21372C",
  primary: "#7CFF8F",
  primarySoft: "rgba(124,255,143,0.12)",
  text: "#F3FFF5",
  muted: "#A8BCAD",
};

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="rounded-3xl border p-4" style={{ borderColor: brand.line, background: brand.panel }}>
      <div className="flex items-center gap-3">
        <div className="rounded-2xl p-2" style={{ background: brand.primarySoft }}>
          <Icon className="h-5 w-5" style={{ color: brand.primary }} />
        </div>
        <div>
          <div className="text-xl font-semibold" style={{ color: brand.text }}>{value}</div>
          <div className="text-sm" style={{ color: brand.muted }}>{label}</div>
        </div>
      </div>
    </div>
  );
}

export default function BitpandaCryptoPartyChallenge() {
  const [teamA, setTeamA] = useState("Bulls");
  const [teamB, setTeamB] = useState("Bears");
  const [scores, setScores] = useState({ A: 0, B: 0 });
  const [turn, setTurn] = useState("A");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [timer, setTimer] = useState(15);
  const [started, setStarted] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);

  const question = questions[index];
  const progress = useMemo(() => ((index + 1) / questions.length) * 100, [index]);
  const challenge = useMemo(() => challengeCards[index % challengeCards.length], [index]);

  useEffect(() => {
    if (!started || revealed) return;
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [started, revealed, timer]);

  const activeTeam = turn === "A" ? teamA : teamB;

  const answerQuestion = (optionIndex: number) => {
    if (revealed || !started) return;
    setSelected(optionIndex);
    setRevealed(true);
    const isCorrect = optionIndex === question.answer;
    if (isCorrect) {
      setScores((prev) => ({ ...prev, [turn]: prev[turn] + question.points }));
    }
  };

  const nextQuestion = () => {
    if (index < questions.length - 1) {
      setIndex((prev) => prev + 1);
      setSelected(null);
      setRevealed(false);
      setTurn((prev) => (prev === "A" ? "B" : "A"));
      setTimer(15);
      setShowChallenge(false);
      setStarted(true);
    }
  };

  const resetGame = () => {
    setScores({ A: 0, B: 0 });
    setTurn("A");
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setTimer(15);
    setStarted(false);
    setShowChallenge(false);
  };

  const winner = scores.A === scores.B ? "Tie" : scores.A > scores.B ? teamA : teamB;

  return (
    <div className="min-h-screen w-full" style={{ background: `radial-gradient(circle at top right, rgba(124,255,143,0.15), transparent 30%), linear-gradient(180deg, ${brand.bg}, #080A09)` }}>
      <section className="mx-auto max-w-7xl px-6 py-8 md:px-10 lg:px-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border px-3 py-2 text-sm font-semibold" style={{ borderColor: brand.line, background: brand.panel, color: brand.text }}>
              Bitpanda x Crypto Party Challenge
            </div>
            <Badge className="rounded-full border px-3 py-1" style={{ borderColor: brand.line, background: brand.primarySoft, color: brand.primary }}>
              Live Experience Concept
            </Badge>
          </div>
          <div className="text-sm" style={{ color: brand.muted }}>
            Bold investing energy inspired by Bitpanda's green-led brand uplift.
          </div>
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl"
              style={{ color: brand.text }}
            >
              The interactive crypto game for your next <span style={{ color: brand.primary }}>Bitpanda-branded</span> event.
            </motion.h1>
            <p className="mt-5 max-w-2xl text-base md:text-lg" style={{ color: brand.muted }}>
              A sleek landing page concept with a playable challenge flow: team setup, timed trivia, round mechanics,
              score tracking and branded event energy built for on-site screens, promo traffic and host-led activations.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Stat icon={Users} value="2 Teams" label="Bulls vs Bears" />
              <Stat icon={Zap} value="15 Sec" label="per round timer" />
              <Stat icon={Trophy} value="6 Rounds" label="with scoring" />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => setStarted(true)} className="rounded-2xl px-6 py-6 text-base font-semibold" style={{ background: brand.primary, color: "#08110B" }}>
                Start challenge <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button onClick={() => setShowChallenge((v) => !v)} variant="outline" className="rounded-2xl px-6 py-6 text-base" style={{ borderColor: brand.line, background: brand.panel, color: brand.text }}>
                Reveal event mechanic
              </Button>
            </div>
          </div>

          <Card className="rounded-[28px] border shadow-2xl" style={{ borderColor: brand.line, background: `linear-gradient(180deg, ${brand.panel2}, ${brand.panel})` }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl" style={{ color: brand.text }}>
                <Coins className="h-6 w-6" style={{ color: brand.primary }} /> Game setup
              </CardTitle>
              <CardDescription style={{ color: brand.muted }}>
                Edit team names for a live event, creator battle or community activation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm" style={{ color: brand.muted }}>Team A</label>
                  <Input value={teamA} onChange={(e) => setTeamA(e.target.value)} className="h-12 rounded-2xl border" style={{ borderColor: brand.line, background: brand.bg, color: brand.text }} />
                </div>
                <div>
                  <label className="mb-2 block text-sm" style={{ color: brand.muted }}>Team B</label>
                  <Input value={teamB} onChange={(e) => setTeamB(e.target.value)} className="h-12 rounded-2xl border" style={{ borderColor: brand.line, background: brand.bg, color: brand.text }} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border p-4" style={{ borderColor: brand.line, background: brand.bg }}>
                  <div className="text-sm" style={{ color: brand.muted }}>{teamA}</div>
                  <div className="mt-1 text-3xl font-semibold" style={{ color: brand.text }}>{scores.A}</div>
                </div>
                <div className="rounded-3xl border p-4" style={{ borderColor: brand.line, background: brand.bg }}>
                  <div className="text-sm" style={{ color: brand.muted }}>{teamB}</div>
                  <div className="mt-1 text-3xl font-semibold" style={{ color: brand.text }}>{scores.B}</div>
                </div>
              </div>
              <div className="rounded-3xl border p-4" style={{ borderColor: brand.line, background: brand.bg }}>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: brand.muted }}>Challenge progress</span>
                  <span style={{ color: brand.text }}>{index + 1}/{questions.length}</span>
                </div>
                <Progress value={progress} className="mt-3 h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10 md:px-10 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <Card className="rounded-[28px] border" style={{ borderColor: brand.line, background: brand.panel }}>
            <CardHeader>
              <CardTitle className="text-2xl" style={{ color: brand.text }}>Round status</CardTitle>
              <CardDescription style={{ color: brand.muted }}>
                Host-facing summary for the active turn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-3xl border p-4" style={{ borderColor: brand.line, background: brand.bg }}>
                <div className="text-sm" style={{ color: brand.muted }}>Active team</div>
                <div className="mt-1 text-2xl font-semibold" style={{ color: brand.text }}>{activeTeam}</div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border p-4" style={{ borderColor: brand.line, background: brand.bg }}>
                  <div className="flex items-center gap-2 text-sm" style={{ color: brand.muted }}>
                    <TimerReset className="h-4 w-4" /> Timer
                  </div>
                  <div className="mt-2 text-3xl font-semibold" style={{ color: timer <= 5 ? brand.primary : brand.text }}>{timer}s</div>
                </div>
                <div className="rounded-3xl border p-4" style={{ borderColor: brand.line, background: brand.bg }}>
                  <div className="text-sm" style={{ color: brand.muted }}>Points</div>
                  <div className="mt-2 text-3xl font-semibold" style={{ color: brand.text }}>{question.points}</div>
                </div>
              </div>

              <div className="rounded-3xl border p-4" style={{ borderColor: brand.line, background: showChallenge ? brand.primarySoft : brand.bg }}>
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: showChallenge ? brand.primary : brand.muted }}>
                  <Sparkles className="h-4 w-4" /> Event mechanic
                </div>
                <AnimatePresence mode="wait">
                  {showChallenge ? (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      <div className="mt-2 text-lg font-semibold" style={{ color: brand.text }}>{challenge.title}</div>
                      <p className="mt-2 text-sm leading-6" style={{ color: brand.muted }}>{challenge.text}</p>
                      <Badge className="mt-3 rounded-full" style={{ background: brand.primary, color: "#08110B" }}>{challenge.bonus}</Badge>
                    </motion.div>
                  ) : (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-2 text-sm leading-6" style={{ color: brand.muted }}>
                      Tap “Reveal event mechanic” above to show the host twist for this round.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="rounded-3xl border p-4" style={{ borderColor: brand.line, background: brand.bg }}>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5" style={{ color: brand.primary }} />
                  <div>
                    <div className="font-medium" style={{ color: brand.text }}>Brand-safe note</div>
                    <p className="mt-1 text-sm leading-6" style={{ color: brand.muted }}>
                      The demo uses educational crypto topics and avoids promises around performance or financial outcomes.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border" style={{ borderColor: brand.line, background: `linear-gradient(180deg, ${brand.panel}, ${brand.bg})` }}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-2xl" style={{ color: brand.text }}>Playable quiz experience</CardTitle>
                  <CardDescription style={{ color: brand.muted }}>
                    Category: {question.category} · Difficulty: {question.difficulty}
                  </CardDescription>
                </div>
                <Badge className="rounded-full px-3 py-1" style={{ background: brand.primarySoft, color: brand.primary }}>
                  Question {index + 1}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-[28px] border p-6 md:p-8" style={{ borderColor: brand.line, background: brand.panel }}>
                <h2 className="text-2xl font-semibold leading-tight md:text-3xl" style={{ color: brand.text }}>
                  {question.question}
                </h2>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {question.options.map((option, optionIndex) => {
                    const isCorrect = optionIndex === question.answer;
                    const isSelected = selected === optionIndex;
                    const bg = revealed
                      ? isCorrect
                        ? brand.primarySoft
                        : isSelected
                          ? "rgba(255,255,255,0.04)"
                          : brand.bg
                      : brand.bg;
                    const border = revealed && isCorrect ? brand.primary : brand.line;

                    return (
                      <button
                        key={option}
                        onClick={() => answerQuestion(optionIndex)}
                        className="rounded-[24px] border p-5 text-left transition-all duration-200 hover:-translate-y-0.5"
                        style={{ borderColor: border, background: bg }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-base leading-7" style={{ color: brand.text }}>{option}</span>
                          {revealed && isCorrect && <CheckCircle2 className="mt-1 h-5 w-5 shrink-0" style={{ color: brand.primary }} />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {revealed && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="mt-6 rounded-[24px] border p-5"
                      style={{ borderColor: brand.line, background: brand.bg }}
                    >
                      <div className="text-sm font-medium" style={{ color: brand.primary }}>
                        {selected === question.answer ? "Correct answer" : "Round result"}
                      </div>
                      <p className="mt-2 leading-7" style={{ color: brand.muted }}>{question.explanation}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    onClick={nextQuestion}
                    disabled={!revealed || index >= questions.length - 1}
                    className="rounded-2xl px-5 py-5"
                    style={{ background: brand.primary, color: "#08110B" }}
                  >
                    Next question
                  </Button>
                  <Button
                    onClick={resetGame}
                    variant="outline"
                    className="rounded-2xl px-5 py-5"
                    style={{ borderColor: brand.line, background: brand.panel, color: brand.text }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset
                  </Button>
                </div>
              </div>

              {index === questions.length - 1 && revealed && (
                <div className="mt-6 rounded-[28px] border p-6" style={{ borderColor: brand.line, background: brand.panel }}>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl p-3" style={{ background: brand.primarySoft }}>
                      <Trophy className="h-6 w-6" style={{ color: brand.primary }} />
                    </div>
                    <div>
                      <div className="text-sm" style={{ color: brand.muted }}>Challenge winner</div>
                      <div className="text-2xl font-semibold" style={{ color: brand.text }}>{winner}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-14 md:px-10 lg:px-12">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Lead capture ready",
              text: "Perfect as a campaign landing page before the event, with room for signup, ticket or registration modules.",
            },
            {
              title: "On-site screen mode",
              text: "Use the same experience on a large screen while a host guides teams through the challenge live.",
            },
            {
              title: "Creator-friendly",
              text: "Can be expanded with influencer intros, team avatars, sponsor placements and social mechanics.",
            },
          ].map((item) => (
            <Card key={item.title} className="rounded-[28px] border" style={{ borderColor: brand.line, background: brand.panel }}>
              <CardContent className="p-6">
                <div className="text-lg font-semibold" style={{ color: brand.text }}>{item.title}</div>
                <p className="mt-3 text-sm leading-6" style={{ color: brand.muted }}>{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
