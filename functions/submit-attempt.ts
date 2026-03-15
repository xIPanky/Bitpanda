const SECRET_CODE = "Bp-7x9A-11Q4-22k8";

const globalAny = globalThis;

if (typeof globalAny.__winnerLocked === "undefined") {
  globalAny.__winnerLocked = false;
}

function normalize(input) {
  return String(input || "").trim().replace(/\s+/g, "");
}

function countCorrectPositions(guess, secret) {
  const guessRaw = guess.replace(/-/g, "");
  const secretRaw = secret.replace(/-/g, "");

  let score = 0;
  const max = Math.min(guessRaw.length, secretRaw.length);

  for (let i = 0; i < max; i++) {
    if (guessRaw[i] === secretRaw[i]) {
      score++;
    }
  }

  return score;
}

Deno.serve(async (req) => {
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        ok: true,
        winnerLocked: globalAny.__winnerLocked,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method Not Allowed",
      }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    if (globalAny.__winnerLocked) {
      return new Response(
        JSON.stringify({
          ok: true,
          winnerLocked: true,
          isWinner: false,
          matchedChars: 0,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const body = await req.json();
    const guess = normalize(body?.guess);

    if (!guess) {
      return new Response(
        JSON.stringify({
          error: "Missing guess",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const isWinner = guess === SECRET_CODE;
    const matchedChars = countCorrectPositions(guess, SECRET_CODE);

    if (isWinner) {
      globalAny.__winnerLocked = true;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        winnerLocked: globalAny.__winnerLocked,
        isWinner,
        matchedChars,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
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
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
});