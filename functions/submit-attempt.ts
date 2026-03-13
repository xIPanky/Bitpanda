const SECRET_CODE = "BP-7X9A-11Q4-22K8";

function normalize(input) {
  return String(input || "").trim().toUpperCase().replace(/\s+/g, "");
}

function countCorrectPositions(guess, secret) {
  const guessRaw = guess.replace(/-/g, "");
  const secretRaw = secret.replace(/-/g, "");

  let score = 0;
  const max = Math.min(guessRaw.length, secretRaw.length);

  for (let i = 0; i < max; i++) {
    if (guessRaw[i] === secretRaw[i]) score++;
  }

  return score;
}

function buildCharResults(guess, secret) {
  const guessRaw = guess.replace(/-/g, "");
  const secretRaw = secret.replace(/-/g, "");
  const results = [];

  for (let i = 0; i < guessRaw.length; i++) {
    results.push(guessRaw[i] === secretRaw[i] ? "correct" : "wrong");
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const guess = normalize(body?.guess);

    if (!guess) {
      return new Response(JSON.stringify({ error: "Missing guess" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const isWinner = guess === SECRET_CODE;
    const matchedChars = countCorrectPositions(guess, SECRET_CODE);
    const charResults = buildCharResults(guess, SECRET_CODE);

    return new Response(
      JSON.stringify({
        ok: true,
        isWinner,
        matchedChars,
        charResults,
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