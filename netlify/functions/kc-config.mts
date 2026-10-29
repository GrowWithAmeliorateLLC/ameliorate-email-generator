// GET /api/kc/config — public, non-secret: the location list plus which settings exist
// (true/false only; never values).
import { LOCATIONS, env, clickupToken, json } from "./_kc.js";

export default async () => {
  return json({
    locations: Object.values(LOCATIONS).map((l) => ({ id: l.id, name: l.name, short: l.short })),
    ready: {
      claude: !!env("ANTHROPIC_API_KEY"),
      clickup: !!clickupToken(),
      passcode: !!env("KC_APP_PASSCODE"),
    },
  });
};

export const config = { path: "/api/kc/config" };
