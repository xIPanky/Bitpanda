const SECRET_CODE = "BP-7X9A-11Q4-22K8";
const MAX_ATTEMPTS_PER_PLAYER = 1;

const globalAny = globalThis;

if (!globalAny.__bitpandaLeaderboard) {
  globalAny.__bitpandaLeaderboard = [];
}

if (!globalAny.__bitpandaAttempts) {
  globalAny.__bitpandaAttempts = {};
}

function normalize(input) {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

function countCorrectPositions(guess, secret) {
  const max = Math.max(guess.length, secret.length);
  let score = 0;

  for (let i = 0; i < max; i++) {
    if (guess[i] && secret[i] && guess[i] === secret[i]) {
      score++;
    }
  }

  return score;
}

function revealMatchedCharacters(guess, secret) {
  const max = Math.max(guess.length, secret.length);
  let out = "";

  for (let i = 0; i < max; i++) {
    const g = guess[i] ?? "";
    const s = secret[i] ?? "";

    if (!s) continue;

    if (s === "-") {
      out += "-";
      continue;
    }

    out += g === s ? s : "_";
  }

  return out;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method Not Allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await req.json();

    if (!body?.name || !body?.guess) {
      return new Response(
        JSON.stringify({ error: "Missing name or guess" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const name = body.name.trim().slice(0, 24);
    const guess = normalize(body.guess);
    const leaderboard = globalAny.__bitpandaLeaderboard;
    const attemptsMap = globalAny.__bitpandaAttempts;

    const usedAttempts = attemptsMap[name] ?? 0;

    if (usedAttempts >= MAX_ATTEMPTS_PER_PLAYER) {
      const entry = [...leaderboard]
        .sort((a, b) => b.bestScore - a.bestScore || a.attempts - b.attempts)
        .slice(0, 10);

      return new Response(
        JSON.stringify({
          ok: true,
          isWinner: false,
          message: ">> ONE ATTEMPT ALREADY USED // REGISTER AGAIN",
          matchedChars: 0,
          bestPossibleDisplay: "BP-____-____-____",
          leaderboard: entry,
          attemptsLeft: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    attemptsMap[name] = 1;

    const matchedChars = countCorrectPositions(guess, SECRET_CODE);
    const bestPossibleDisplay = revealMatchedCharacters(guess, SECRET_CODE);
    const isWinner = guess === SECRET_CODE;

    const existingIndex = leaderboard.findIndex((x) => x.name === name);

    if (existingIndex >= 0) {
      leaderboard[existingIndex] = {
        ...leaderboard[existingIndex],
        attempts: 1,
        lastAt: new Date().toISOString(),
        bestScore: matchedChars,
        bestGuess: guess,
      };
    } else {
      leaderboard.push({
        name,
        bestScore: matchedChars,
        bestGuess: guess,
        attempts: 1,
        lastAt: new Date().toISOString(),
      });
    }

    leaderboard.sort((a, b) => {
      if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
      return new Date(a.lastAt).getTime() - new Date(b.lastAt).getTime();
    });

    const topTen = leaderboard.slice(0, 10);

    return new Response(
      JSON.stringify({
        ok: true,
        isWinner,
        message: isWinner
          ? ">> ACCESS GRANTED // YOU WON THE BITPANDA REWARD"
          : `>> ${matchedChars} CHARACTERS CORRECT // ONE SHOT USED`,
        matchedChars,
        bestPossibleDisplay,
        leaderboard: topTen,
        attemptsLeft: 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Invalid request",
        details: error?.message || "Unknown error",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
