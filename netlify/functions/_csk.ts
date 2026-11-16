// Shared config + helpers for the CSK Camp Campaigns tool (/csk).
// Same Netlify env vars as the KC tool (ANTHROPIC_API_KEY, CLICKUP_API_TOKEN, KC_APP_PASSCODE).
// Club SciKidz emails go out through each location's Constant Contact account, so the page
// builds Constant Contact-safe HTML (see public/csk/index.html → buildEmail / ccCheck).

export interface CskLocation {
  id: string;
  name: string; // name used in copy and the footer
  short: string; // dropdown label
  list: string; // ClickUp list id
  site: string; // location site
  campsPage: string; // the "all summer camps" page
  register: string; // ACTIVE registration home for the season
  activeOrg: string; // ACTIVE org slug
  season: string; // ACTIVE season id for the current summer
  facebook: string;
  instagram: string;
  email: string; // support email shown in the footer
  hashtags: string;
  notes: string; // rules Claude must follow for this location
  emailInScope: boolean;
  smsLive: boolean; // Constant Contact texting approved and sold
}

export const CSK_LOCATIONS: Record<string, CskLocation> = {
  "charlotte-south": {
    id: "charlotte-south",
    name: "Club SciKidz Charlotte South",
    short: "Charlotte South (Fort Mill / South Charlotte)",
    list: "901311685606",
    site: "https://charlottesouth.clubscikidz.com",
    campsPage: "https://charlottesouth.clubscikidz.com/stem-summer-camps/",
    register: "https://campscui.active.com/orgs/ClubScikidzSouthCharlotte?orglink=camps-registration",
    activeOrg: "ClubScikidzSouthCharlotte",
    season: "3904341", // 2027 Summer Camps
    facebook: "https://www.facebook.com/profile.php?id=61572097994804",
    instagram: "https://www.instagram.com/clubscikidz_cltsouth",
    email: "scharlottesupport@clubscikidz.com",
    hashtags: "#ClubSciKidz #FortMillSC #SouthCharlotte #STEMCamp #SummerCamp2027",
    notes:
      "Venues: St. John's United Methodist Church (Fort Mill) and Cross & Crown Lutheran Church (South Charlotte). " +
      "Early bird pricing runs through 12/31; only mention it before then. Never put the phone number in copy.",
    emailInScope: true, // restarted 11/16/2026
    smsLive: false, // Constant Contact texting submitted 11/14/2026, pending approval
  },
};
