/* Rack Coach — badge catalogue (151 achievements).
   Plain synchronous script: sets a global the main IIFE reads at boot.
   Each entry: { id, name, desc, cat, tier, glyph, check(ctx) -> boolean }
   ctx = { stats, sessions, active, body, customPlans, customWorkouts }
   `stats` is the precomputed bundle from computeStats() in index.html.
   Bump sw.js CACHE when this file changes. */

(function () {
  var TIERS = ["bronze", "silver", "gold", "platinum", "onyx"];
  function tierFor(i, n) { return TIERS[Math.min(4, Math.floor((i / n) * 5))]; }
  function human(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(n % 1e3 ? 1 : 0) + "k";
    return String(n);
  }

  function ladder(cfg) {
    return cfg.steps.map(function (thr, i) {
      return {
        id: cfg.id + "-" + thr,
        name: cfg.name(thr, i),
        desc: cfg.desc(thr, i),
        cat: cfg.cat,
        glyph: cfg.glyph,
        tier: tierFor(i, cfg.steps.length),
        check: function (ctx) { return (cfg.stat(ctx) || 0) >= thr; }
      };
    });
  }
  function S(key) { return function (ctx) { return ctx.stats[key]; }; }
  function L(key) { return function (ctx) { return (ctx.stats.bestLift || {})[key] || 0; }; }

  var B = [];

  B = B.concat(ladder({ id: "sessions", cat: "consistency", glyph: "check", stat: S("totalSessions"),
    steps: [1, 5, 10, 25, 50, 100, 200, 500, 1000],
    name: function (n) { return n === 1 ? "First Rep" : human(n) + " Sessions"; },
    desc: function (n) { return "Finish " + human(n) + " workout" + (n > 1 ? "s" : ""); } }));

  B = B.concat(ladder({ id: "streak", cat: "consistency", glyph: "flame", stat: S("currentStreak"),
    steps: [3, 7, 14, 30, 45, 60, 180, 365],
    name: function (n) { return n + "-Day Streak"; },
    desc: function (n) { return "Train " + n + " days in a row"; } }));

  B = B.concat(ladder({ id: "longstreak", cat: "consistency", glyph: "calendar", stat: S("longestStreak"),
    steps: [15, 50, 150],
    name: function (n) { return "Iron Habit " + n; },
    desc: function (n) { return "Build a " + n + "-day streak"; } }));

  B = B.concat(ladder({ id: "weeks", cat: "consistency", glyph: "calendar", stat: S("weeksHitTarget"),
    steps: [1, 4, 12, 24, 52],
    name: function (n) { return n === 52 ? "A Year Strong" : "On Target ×" + n; },
    desc: function (n) { return "Hit your weekly session target " + n + " week" + (n > 1 ? "s" : ""); } }));

  B = B.concat(ladder({ id: "volume", cat: "volume", glyph: "mountain", stat: S("totalVolume"),
    steps: [10e3, 50e3, 100e3, 250e3, 500e3, 1e6, 3e6, 10e6],
    name: function (n) { return human(n) + " kg Moved"; },
    desc: function (n) { return "Lift " + human(n) + " kg of total volume"; } }));

  B = B.concat(ladder({ id: "sessvol", cat: "volume", glyph: "barbell", stat: S("maxSessionVolume"),
    steps: [3e3, 6e3, 12e3, 20e3],
    name: function (n) { return "Big Day: " + human(n); },
    desc: function (n) { return "Move " + human(n) + " kg in a single session"; } }));

  B = B.concat(ladder({ id: "reps", cat: "volume", glyph: "infinity", stat: S("totalReps"),
    steps: [1e3, 5e3, 25e3, 100e3],
    name: function (n) { return human(n) + " Reps"; },
    desc: function (n) { return "Log " + human(n) + " total reps"; } }));

  B = B.concat(ladder({ id: "pr", cat: "strength", glyph: "bolt", stat: S("prCount"),
    steps: [1, 10, 25, 50, 150],
    name: function (n) { return n === 1 ? "First PR" : n + " PRs"; },
    desc: function (n) { return "Set " + n + " personal record" + (n > 1 ? "s" : ""); } }));

  B = B.concat(ladder({ id: "bigsquat", cat: "strength", glyph: "crown", stat: L("squat"),
    steps: [80, 140, 200, 260],
    name: function (n) { return n + " kg Squat"; }, desc: function (n) { return "Squat " + n + " kg for a work set"; } }));
  B = B.concat(ladder({ id: "bigbench", cat: "strength", glyph: "crown", stat: L("bench"),
    steps: [50, 90, 130, 170],
    name: function (n) { return n + " kg Bench"; }, desc: function (n) { return "Bench " + n + " kg for a work set"; } }));
  B = B.concat(ladder({ id: "bigdead", cat: "strength", glyph: "crown", stat: L("deadlift"),
    steps: [100, 180, 260, 320],
    name: function (n) { return n + " kg Deadlift"; }, desc: function (n) { return "Deadlift " + n + " kg for a work set"; } }));
  B = B.concat(ladder({ id: "bigpress", cat: "strength", glyph: "crown", stat: L("press"),
    steps: [35, 55, 80, 110],
    name: function (n) { return n + " kg Press"; }, desc: function (n) { return "Overhead press " + n + " kg for a work set"; } }));

  B = B.concat(ladder({ id: "bwmult", cat: "strength", glyph: "diamond", stat: S("bestBwMultiple"),
    steps: [1, 1.5, 2, 2.5],
    name: function (n) { return n + "× Bodyweight"; },
    desc: function (n) { return "Lift " + n + "× your bodyweight on a barbell lift"; } }));

  B = B.concat(ladder({ id: "variety", cat: "variety", glyph: "star", stat: S("distinctExercises"),
    steps: [8, 20, 35, 45],
    name: function (n) { return n + " Movements"; },
    desc: function (n) { return "Train " + n + " different exercises"; } }));
  B = B.concat(ladder({ id: "programs", cat: "variety", glyph: "shield", stat: S("distinctPrograms"),
    steps: [2, 4, 7],
    name: function (n) { return n + " Programs"; },
    desc: function (n) { return "Run " + n + " different programs"; } }));

  B = B.concat(ladder({ id: "metcon", cat: "crossfit", glyph: "timer", stat: S("metconCount"),
    steps: [1, 10, 50, 150],
    name: function (n) { return n === 1 ? "First WOD" : n + " WODs"; },
    desc: function (n) { return "Finish " + n + " conditioning workout" + (n > 1 ? "s" : ""); } }));
  B = B.concat(ladder({ id: "benchmarks", cat: "crossfit", glyph: "trophy", stat: S("distinctWods"),
    steps: [1, 4, 8, 12],
    name: function (n) { return n + " Benchmark" + (n > 1 ? "s" : ""); },
    desc: function (n) { return "Complete " + n + " different named workout" + (n > 1 ? "s" : ""); } }));
  B = B.concat(ladder({ id: "rx", cat: "crossfit", glyph: "bolt", stat: S("wodsRx"),
    steps: [1, 20, 60],
    name: function (n) { return "RX ×" + n; },
    desc: function (n) { return "Finish " + n + " workout" + (n > 1 ? "s" : "") + " as prescribed"; } }));

  B = B.concat(ladder({ id: "hyrox", cat: "hyrox", glyph: "rocket", stat: S("hyroxCount"),
    steps: [1, 5, 12, 25],
    name: function (n) { return n === 1 ? "Hyrox Rookie" : "Hyrox ×" + n; },
    desc: function (n) { return "Finish " + n + " Hyrox session" + (n > 1 ? "s" : ""); } }));
  B = B.concat(ladder({ id: "hyroxsim", cat: "hyrox", glyph: "rocket", stat: S("hyroxFullSims"),
    steps: [1, 5, 12],
    name: function (n) { return "Full Sim ×" + n; },
    desc: function (n) { return "Complete " + n + " full eight-station simulation" + (n > 1 ? "s" : ""); } }));

  B = B.concat(ladder({ id: "roller", cat: "roller", glyph: "star", stat: S("rollerCount"),
    steps: [1, 10, 25, 60],
    name: function (n) { return n === 1 ? "Lucky Roll" : "Rolled ×" + n; },
    desc: function (n) { return "Roll and finish " + n + " random workout" + (n > 1 ? "s" : ""); } }));

  B = B.concat(ladder({ id: "rirzero", cat: "effort", glyph: "skull", stat: S("rirZeroSets"),
    steps: [1, 25, 100, 300],
    name: function (n) { return n === 1 ? "To Failure" : n + " Sets To Zero"; },
    desc: function (n) { return "Take " + n + " set" + (n > 1 ? "s" : "") + " to zero reps in reserve"; } }));
  B = B.concat(ladder({ id: "tank", cat: "effort", glyph: "heart", stat: S("tankSessions"),
    steps: [3, 15, 40],
    name: function (n) { return "In The Tank ×" + n; },
    desc: function (n) { return "Finish " + n + " sessions leaving 2+ reps in every set"; } }));

  B = B.concat(ladder({ id: "early", cat: "time", glyph: "sun", stat: S("earlyCount"),
    steps: [1, 10, 30, 60],
    name: function (n) { return "Early Bird ×" + n; },
    desc: function (n) { return "Start " + n + " workout" + (n > 1 ? "s" : "") + " before 6am"; } }));
  B = B.concat(ladder({ id: "late", cat: "time", glyph: "moon", stat: S("lateCount"),
    steps: [1, 10, 30, 60],
    name: function (n) { return "Night Owl ×" + n; },
    desc: function (n) { return "Start " + n + " workout" + (n > 1 ? "s" : "") + " after 9pm"; } }));
  B = B.concat(ladder({ id: "weekend", cat: "time", glyph: "calendar", stat: S("weekendCount"),
    steps: [8, 30, 70, 150],
    name: function (n) { return "Weekend Warrior ×" + n; },
    desc: function (n) { return "Train on " + n + " weekend days"; } }));
  B = B.concat(ladder({ id: "seasons", cat: "time", glyph: "sun", stat: S("seasonCount"),
    steps: [1, 2, 3, 4],
    name: function (n) { return n === 4 ? "Four Seasons" : n + " Season" + (n > 1 ? "s" : ""); },
    desc: function (n) { return "Train in " + n + " different season" + (n > 1 ? "s" : ""); } }));

  B = B.concat(ladder({ id: "bodylog", cat: "body", glyph: "heart", stat: S("bodyLogCount"),
    steps: [1, 12, 52, 104],
    name: function (n) { return n === 1 ? "First Weigh-In" : n + " Body Logs"; },
    desc: function (n) { return "Log your bodyweight " + n + " time" + (n > 1 ? "s" : ""); } }));
  B = B.concat(ladder({ id: "measure", cat: "body", glyph: "target", stat: S("measureLogCount"),
    steps: [3, 15, 40],
    name: function (n) { return n + " Measurements"; },
    desc: function (n) { return "Record body measurements " + n + " times"; } }));

  B = B.concat(ladder({ id: "grit", cat: "consistency", glyph: "flame", stat: S("grit"),
    steps: [35, 55, 80, 100],
    name: function (n) { return n === 100 ? "Perfect Grit" : "Grit " + n; },
    desc: function (n) { return "Reach a Grit Score of " + n; } }));

  // --- named one-offs -------------------------------------------------------
  B = B.concat([
    { id: "sp-perfect-week", name: "Perfect Week", desc: "6+ sessions in a single week", cat: "consistency", tier: "gold", glyph: "crown", check: function (c) { return c.stats.bestWeekCount >= 6; } },
    { id: "sp-comeback", name: "The Comeback", desc: "Return to training after a 14-day gap", cat: "consistency", tier: "silver", glyph: "rocket", check: function (c) { return c.stats.comeback; } },
    { id: "sp-daybreak", name: "Day & Night", desc: "Train before 6am and after 9pm", cat: "time", tier: "silver", glyph: "moon", check: function (c) { return c.stats.earlyCount > 0 && c.stats.lateCount > 0; } },
    { id: "sp-midnight", name: "Witching Hour", desc: "Start a workout between midnight and 4am", cat: "time", tier: "gold", glyph: "moon", check: function (c) { return c.stats.midnight; } },
    { id: "sp-alldays", name: "Every Day Counts", desc: "Train on all 7 days of the week", cat: "consistency", tier: "gold", glyph: "calendar", check: function (c) { return c.stats.daysOfWeek >= 7; } },
    { id: "sp-triple", name: "Barbell Trinity", desc: "Run Starting Strength, StrongLifts and Texas Method", cat: "variety", tier: "platinum", glyph: "shield", check: function (c) { return c.stats.ranBarbellTrio; } },
    { id: "sp-loyalist", name: "Program Loyalist", desc: "30 sessions on one program", cat: "consistency", tier: "gold", glyph: "shield", check: function (c) { return c.stats.maxProgramSessions >= 30; } },
    { id: "sp-deload", name: "Bounce Back", desc: "Recover a lift after a deload", cat: "strength", tier: "silver", glyph: "bolt", check: function (c) { return c.stats.deloadRecovered; } },
    { id: "sp-marathon", name: "The Long Haul", desc: "A single workout over 90 minutes", cat: "effort", tier: "silver", glyph: "timer", check: function (c) { return c.stats.longestSessionSec >= 5400; } },
    { id: "sp-sprint", name: "Blink And It's Done", desc: "Finish a for-time workout in under 5 minutes", cat: "crossfit", tier: "silver", glyph: "bolt", check: function (c) { return c.stats.fastestWodSec != null && c.stats.fastestWodSec < 300; } },
    { id: "sp-hybrid", name: "Hybrid Athlete", desc: "A lifting and a conditioning session on the same day", cat: "variety", tier: "gold", glyph: "infinity", check: function (c) { return c.stats.hybridDay; } },
    { id: "sp-architect", name: "The Architect", desc: "Create your first custom program", cat: "variety", tier: "bronze", glyph: "shield", check: function (c) { return (c.customPlans || []).length > 0; } },
    { id: "sp-freestyle", name: "Freestyler", desc: "Build and finish your own one-off workout", cat: "variety", tier: "bronze", glyph: "star", check: function (c) { return c.stats.freestyleCount > 0; } },
    { id: "sp-hyrox-90", name: "Sub-90 Hyrox", desc: "Full Hyrox simulation under 90 minutes", cat: "hyrox", tier: "gold", glyph: "rocket", check: function (c) { return c.stats.bestHyroxSec != null && c.stats.bestHyroxSec < 5400; } },
    { id: "sp-hyrox-75", name: "Sub-75 Hyrox", desc: "Full Hyrox simulation under 75 minutes", cat: "hyrox", tier: "platinum", glyph: "rocket", check: function (c) { return c.stats.bestHyroxSec != null && c.stats.bestHyroxSec < 4500; } },
    { id: "sp-double", name: "Double Progression", desc: "Earn a weight bump on a bodybuilding program", cat: "strength", tier: "bronze", glyph: "bolt", check: function (c) { return c.stats.doubleBumps > 0; } },
    { id: "sp-doublemaster", name: "Range Master", desc: "50 double-progression weight bumps", cat: "strength", tier: "gold", glyph: "bolt", check: function (c) { return c.stats.doubleBumps >= 50; } },
    { id: "sp-notes", name: "Keeping Track", desc: "Add a note to a body log", cat: "body", tier: "bronze", glyph: "check", check: function (c) { return c.stats.noteCount > 0; } },
    { id: "sp-emom", name: "On The Minute", desc: "Finish an EMOM workout", cat: "crossfit", tier: "bronze", glyph: "timer", check: function (c) { return c.stats.emomDone; } },
    { id: "sp-chipper", name: "Chipped Away", desc: "Finish a chipper workout", cat: "crossfit", tier: "silver", glyph: "mountain", check: function (c) { return c.stats.chipperDone; } },
    { id: "sp-allcats", name: "Well Rounded", desc: "Earn a badge in six different categories", cat: "variety", tier: "platinum", glyph: "star", check: function (c) { return c.stats.earnedCats >= 6; } },
    { id: "sp-collector", name: "Collector", desc: "Earn 75 badges", cat: "variety", tier: "platinum", glyph: "trophy", check: function (c) { return c.stats.earnedCount >= 75; } }
  ]);

  window.RC_BADGES = B;
})();
