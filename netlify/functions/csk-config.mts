// GET /api/csk/config — public, non-secret: CSK locations (with footer links) plus which
// settings exist on Netlify (true/false only; never values).
import { CSK_LOCATIONS } from "./_csk.js";
import { env, clickupToken, json } from "./_kc.js";

export default async () => {
  return json({
    locations: Object.values(CSK_LOCATIONS).map((l) => ({
      id: l.id, name: l.name, short: l.short, site: l.site, campsPage: l.campsPage, register: l.register,
      facebook: l.facebook, instagram: l.instagram, email: l.email, emailInScope: l.emailInScope, smsLive: l.smsLive,
    })),
    ready: {
      claude: !!env("ANTHROPIC_API_KEY"),
      clickup: !!clickupToken(),
      passcode: !!env("KC_APP_PASSCODE"),
    },
  });
};

export const config = { path: "/api/csk/config" };
