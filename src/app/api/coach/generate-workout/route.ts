import type { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// "Build me a workout" generator. Authenticates the caller (coach or athlete),
// then asks Claude for a functional-fitness / CrossFit session shaped to the
// requested focus, equipment, and time — balanced against the muscle load already
// programmed on the surrounding days, with Rx+/Rx/Scale 1/Scale 2 levels and
// recovery/mobility folded in. Returns structured JSON the client maps to a Workout.

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

type ReqExercise = { id: string; name: string; category?: string; equipment?: string };
type DayLoad = {
  dayLabel: string;
  offset: number;
  muscles: string[];
  categories: string[];
  movements: string[];
};

// All properties are listed in `required` (with additionalProperties:false) per
// structured-output rules; the model fills placeholders (empty text/items) for
// fields that don't apply to a given block kind.
const WORKOUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string", description: "Short workout name, e.g. 'Engine + Posterior Strength'" },
    blocks: {
      type: "array",
      description: "Ordered blocks: warm-up, optional strength, the metcon, then mobility/recovery.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          kind: { type: "string", enum: ["note", "strength"] },
          title: { type: "string", description: "Section heading, e.g. 'Warm-up', 'Strength', 'Metcon', 'Cooldown'." },
          text: {
            type: "string",
            description:
              "For note blocks: the full prescription as text. For a metcon, include Rx+, Rx, Scale 1, and Scale 2 lines. Empty for strength blocks.",
          },
          logResult: { type: "boolean", description: "true only for the scored metcon note; false otherwise." },
          scoreType: {
            type: "string",
            enum: ["time", "rounds", "reps", "load", "done"],
            description: "How the metcon is scored (time=For Time, rounds=AMRAP). Use 'done' when not scored.",
          },
          items: {
            type: "array",
            description: "Strength blocks only: the prescribed movements. Empty [] for note blocks.",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                exerciseName: { type: "string" },
                sets: { type: "integer" },
                reps: { type: "string", description: "e.g. '5', '8-10', '30s'" },
                rest: { type: "string", description: "e.g. '90s', '2 min'" },
              },
              required: ["exerciseName", "sets", "reps", "rest"],
            },
          },
        },
        required: ["kind", "title", "text", "logResult", "scoreType", "items"],
      },
    },
  },
  required: ["name", "blocks"],
} as const;

const SYSTEM = `You are a CrossFit / functional-fitness coach building one training session.

Coaching philosophy:
- Build athletes who are strong AND move well — blend strength/skill work with conditioning.
- Scale intelligently: every metcon must give Rx+, Rx, Scale 1, and Scale 2 levels (loads, reps, movement substitutions).
- Integrate recovery: include a short warm-up and a mobility/cooldown block, and bias toward recovery/aerobic work when the surrounding days are heavy.

Fatigue balancing (important):
- You are given the muscle groups / movement categories programmed on the days AROUND this session.
- Do NOT overload muscles that were just trained or are about to be trained on adjacent days.
- Complement and contrast that load (e.g. don't program heavy squatting the day after a squat-heavy day; pair a heavy-leg day with upper/posterior or pure engine work). When the surrounding load is high overall, lean lighter and add mobility.

Output rules:
- Respect the requested time cap and the available equipment ONLY — never prescribe equipment the athlete doesn't have.
- Prefer movement names from the provided exercise library where they fit (so demos and logging work); other movements are fine as text in the metcon.
- Structure: a warm-up note, an optional strength block (kind:"strength" with items), the metcon as a note with logResult:true and the right scoreType, then a mobility/recovery note (logResult:false).
- Strength blocks: text:"" , logResult:false, scoreType:"done". Note blocks: items:[].`;

export async function POST(req: NextRequest) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: "Workout generator isn't configured on the server." }, { status: 500 });

  // Authenticate the caller (coach or athlete) the same way the other routes do.
  const admin = getSupabaseAdmin();
  if (admin) {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return Response.json({ error: "Not signed in." }, { status: 401 });
    const { data: caller, error } = await admin.auth.getUser(token);
    if (error || !caller.user) return Response.json({ error: "Your session expired — sign in again." }, { status: 401 });
  }

  let body: {
    focus?: string;
    equipment?: string[];
    timeMin?: number;
    goals?: string;
    exercises?: ReqExercise[];
    surroundingDays?: DayLoad[];
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  const focus = body.focus || "full";
  const equipment = (body.equipment ?? []).filter(Boolean);
  const timeMin = Math.max(5, Math.min(120, Number(body.timeMin) || 30));
  const exercises = (body.exercises ?? []).slice(0, 400);
  const surrounding = body.surroundingDays ?? [];

  const libraryList = exercises
    .map((e) => `- ${e.name}${e.equipment ? ` (${e.equipment})` : ""}${e.category ? ` [${e.category}]` : ""}`)
    .join("\n");
  const surroundingText = surrounding.length
    ? surrounding
        .map(
          (d) =>
            `- ${d.dayLabel} (${d.offset > 0 ? `+${d.offset}` : d.offset} day): muscles=${d.muscles.join(", ") || "—"}; categories=${d.categories.join(", ") || "—"}; movements=${d.movements.join(", ") || "—"}`,
        )
        .join("\n")
    : "- (no other workouts programmed near this day)";

  const userPrompt = `Build one session.

Focus: ${focus}
Time available: ${timeMin} minutes
Equipment available: ${equipment.length ? equipment.join(", ") : "bodyweight only"}
${body.goals ? `Athlete goals/notes: ${body.goals}\n` : ""}
Surrounding days already programmed (balance fatigue against these):
${surroundingText}

Exercise library to prefer for named movements:
${libraryList || "(none — use standard movement names)"}`;

  try {
    const anthropic = new Anthropic({ apiKey: key });
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      output_config: { format: { type: "json_schema", schema: WORKOUT_SCHEMA } },
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = message.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") {
      return Response.json({ error: "The generator returned no workout — try again." }, { status: 502 });
    }
    const workout = JSON.parse(text.text);
    return Response.json({ workout });
  } catch (err) {
    console.warn("generate-workout failed", err);
    return Response.json({ error: "Couldn't generate a workout right now — try again." }, { status: 502 });
  }
}
