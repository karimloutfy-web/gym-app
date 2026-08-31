/* Rack Coach — extra program templates (bodybuilding / CrossFit / Hyrox).
   Plain synchronous script: sets a global the main IIFE reads at boot.
   Bump sw.js CACHE when this file changes.

   Bodybuilding schema (progressionMode "double"):
     slot: { exId, sets, reps, repHigh, seedLoad?, seedFromAnchor?{id,pct} }
     progression[exId]: { increment, repHigh, failRule:{misses,pct} }
   Anchors get their load from the rep-test at setup; every other lift in
   `progression` is seeded from its slot's seedLoad / seedFromAnchor. */

(function () {
  var FAIL = { misses: 3, pct: 0.9 };

  // helper: build a progression map from a list of [exId, increment, repHigh]
  function prog(rows) {
    var o = {};
    rows.forEach(function (r) { o[r[0]] = { increment: r[1], repHigh: r[2], failRule: FAIL }; });
    return o;
  }

  var PPL = {
    id: "ppl-hypertrophy",
    kind: "bodybuilding",
    style: "bodybuilding",
    name: "PPL Hypertrophy",
    author: "Rack Coach",
    blurb: "A six-day push / pull / legs split built for size. Every exercise runs a rep range — chase the top of it and the weight climbs.",
    bestFor: "Lifters past the beginner stage who can train 5–6 days a week for size",
    daysPerWeek: 6,
    progressionMode: "double",
    startingWeight: { method: "pct-5rm", pct: 0.9 },
    anchors: ["bench", "row", "squat", "press", "deadlift"],
    options: [],
    microcycle: [
      { label: "Push A", slots: [
        { exId: "bench",      sets: 4, reps: 6,  repHigh: 8 },
        { exId: "dbpress",    sets: 3, reps: 8,  repHigh: 12, seedLoad: 20 },
        { exId: "incline",    sets: 3, reps: 8,  repHigh: 12, seedFromAnchor: { id: "bench", pct: 0.6 } },
        { exId: "lateral",    sets: 4, reps: 12, repHigh: 20, seedLoad: 8 },
        { exId: "pushdownrope",sets: 3, reps: 10, repHigh: 15, seedLoad: 20 }
      ]},
      { label: "Pull A", slots: [
        { exId: "row",        sets: 4, reps: 6,  repHigh: 8 },
        { exId: "latpulldown",sets: 3, reps: 8,  repHigh: 12, seedLoad: 45 },
        { exId: "cablerow",   sets: 3, reps: 10, repHigh: 15, seedLoad: 45 },
        { exId: "facepull",   sets: 3, reps: 15, repHigh: 20, seedLoad: 15 },
        { exId: "bbcurl",     sets: 3, reps: 8,  repHigh: 12, seedLoad: 25 }
      ]},
      { label: "Legs A", slots: [
        { exId: "squat",      sets: 4, reps: 6,  repHigh: 8 },
        { exId: "rdl",        sets: 3, reps: 8,  repHigh: 12, seedFromAnchor: { id: "deadlift", pct: 0.55 } },
        { exId: "legpress",   sets: 3, reps: 10, repHigh: 15, seedLoad: 90 },
        { exId: "hamcurlseated",sets: 3, reps: 10, repHigh: 15, seedLoad: 30 },
        { exId: "calfraise",  sets: 4, reps: 12, repHigh: 20, seedLoad: 40 }
      ]},
      { label: "Push B", slots: [
        { exId: "press",      sets: 4, reps: 6,  repHigh: 8 },
        { exId: "dbbench",    sets: 3, reps: 8,  repHigh: 12, seedLoad: 24 },
        { exId: "cablefly",   sets: 3, reps: 12, repHigh: 20, seedLoad: 15 },
        { exId: "lateral",    sets: 4, reps: 12, repHigh: 20, seedLoad: 8 },
        { exId: "skullcrusher",sets: 3, reps: 8, repHigh: 12, seedLoad: 25 }
      ]},
      { label: "Pull B", slots: [
        { exId: "pullup",     sets: 4, reps: 6,  repHigh: 12 },
        { exId: "machinerow", sets: 3, reps: 8,  repHigh: 12, seedLoad: 40 },
        { exId: "latpulldown",sets: 3, reps: 10, repHigh: 15, seedLoad: 45 },
        { exId: "shrug",      sets: 3, reps: 10, repHigh: 15, seedLoad: 24 },
        { exId: "preacher",   sets: 3, reps: 10, repHigh: 15, seedLoad: 20 }
      ]},
      { label: "Legs B", slots: [
        { exId: "deadlift",   sets: 3, reps: 5,  repHigh: 8 },
        { exId: "hacksquat",  sets: 3, reps: 8,  repHigh: 12, seedLoad: 60 },
        { exId: "legext",     sets: 3, reps: 12, repHigh: 20, seedLoad: 40 },
        { exId: "hipthrust",  sets: 3, reps: 8,  repHigh: 12, seedLoad: 60 },
        { exId: "calfraise",  sets: 4, reps: 12, repHigh: 20, seedLoad: 40 }
      ]}
    ],
    progression: prog([
      ["bench", 2.5, 8], ["press", 2.5, 8], ["row", 2.5, 8], ["squat", 5, 8], ["deadlift", 5, 8],
      ["dbpress", 2.5, 12], ["incline", 2.5, 12], ["lateral", 2.5, 20], ["pushdownrope", 2.5, 15],
      ["latpulldown", 2.5, 12], ["cablerow", 2.5, 15], ["facepull", 2.5, 20], ["bbcurl", 2.5, 12],
      ["rdl", 5, 12], ["legpress", 5, 15], ["hamcurlseated", 2.5, 15], ["calfraise", 2.5, 20],
      ["dbbench", 2.5, 12], ["cablefly", 2.5, 20], ["skullcrusher", 2.5, 12],
      ["machinerow", 2.5, 12], ["shrug", 2.5, 15], ["preacher", 2.5, 15],
      ["hacksquat", 5, 12], ["legext", 2.5, 20], ["hipthrust", 5, 12]
    ])
  };

  var UL = {
    id: "upper-lower-hypertrophy",
    kind: "bodybuilding",
    style: "bodybuilding",
    name: "Upper / Lower",
    author: "Rack Coach",
    blurb: "Four days a week, alternating upper and lower. Heavier compound work up front, rep-range accessories after.",
    bestFor: "Intermediate lifters who want size on a four-day week",
    daysPerWeek: 4,
    progressionMode: "double",
    startingWeight: { method: "pct-5rm", pct: 0.9 },
    anchors: ["bench", "row", "squat", "deadlift", "press"],
    options: [],
    microcycle: [
      { label: "Upper A", slots: [
        { exId: "bench",      sets: 4, reps: 5,  repHigh: 8 },
        { exId: "row",        sets: 4, reps: 6,  repHigh: 10 },
        { exId: "dbpress",    sets: 3, reps: 8,  repHigh: 12, seedLoad: 20 },
        { exId: "latpulldown",sets: 3, reps: 10, repHigh: 15, seedLoad: 45 },
        { exId: "lateral",    sets: 3, reps: 12, repHigh: 20, seedLoad: 8 },
        { exId: "bbcurl",     sets: 3, reps: 8,  repHigh: 12, seedLoad: 25 }
      ]},
      { label: "Lower A", slots: [
        { exId: "squat",      sets: 4, reps: 5,  repHigh: 8 },
        { exId: "rdl",        sets: 3, reps: 8,  repHigh: 12, seedFromAnchor: { id: "deadlift", pct: 0.55 } },
        { exId: "legpress",   sets: 3, reps: 10, repHigh: 15, seedLoad: 90 },
        { exId: "legcurl",    sets: 3, reps: 10, repHigh: 15, seedLoad: 30 },
        { exId: "calfraise",  sets: 4, reps: 12, repHigh: 20, seedLoad: 40 }
      ]},
      { label: "Upper B", slots: [
        { exId: "press",      sets: 4, reps: 5,  repHigh: 8 },
        { exId: "pullup",     sets: 4, reps: 6,  repHigh: 12 },
        { exId: "incline",    sets: 3, reps: 8,  repHigh: 12, seedFromAnchor: { id: "bench", pct: 0.6 } },
        { exId: "cablerow",   sets: 3, reps: 10, repHigh: 15, seedLoad: 45 },
        { exId: "pecdeck",    sets: 3, reps: 12, repHigh: 20, seedLoad: 25 },
        { exId: "tricepext",  sets: 3, reps: 10, repHigh: 15, seedLoad: 20 }
      ]},
      { label: "Lower B", slots: [
        { exId: "deadlift",   sets: 3, reps: 4,  repHigh: 6 },
        { exId: "hacksquat",  sets: 3, reps: 8,  repHigh: 12, seedLoad: 60 },
        { exId: "hipthrust",  sets: 3, reps: 8,  repHigh: 12, seedLoad: 60 },
        { exId: "legext",     sets: 3, reps: 12, repHigh: 20, seedLoad: 40 },
        { exId: "calfraise",  sets: 4, reps: 12, repHigh: 20, seedLoad: 40 }
      ]}
    ],
    progression: prog([
      ["bench", 2.5, 8], ["press", 2.5, 8], ["row", 2.5, 10], ["squat", 5, 8], ["deadlift", 5, 6],
      ["dbpress", 2.5, 12], ["latpulldown", 2.5, 15], ["lateral", 2.5, 20], ["bbcurl", 2.5, 12],
      ["rdl", 5, 12], ["legpress", 5, 15], ["legcurl", 2.5, 15], ["calfraise", 2.5, 20],
      ["incline", 2.5, 12], ["cablerow", 2.5, 15], ["pecdeck", 2.5, 20], ["tricepext", 2.5, 15],
      ["hacksquat", 5, 12], ["hipthrust", 5, 12], ["legext", 2.5, 20]
    ])
  };

  /* ---------------------------------------------------------------- CROSSFIT */
  function wod(o) { o.style = "crossfit"; return o; }

  var CF_BENCH = {
    id: "crossfit-benchmarks",
    kind: "metcon",
    style: "crossfit",
    name: "CrossFit Benchmarks",
    author: "CrossFit",
    blurb: "Eight classic benchmark workouts — the Girls and a couple of the Heroes. Same tests everyone measures themselves against.",
    bestFor: "Anyone who wants a yardstick they can retest in a few months",
    daysPerWeek: 4,
    microcycle: [
      { label: "Cindy", wod: wod({ id: "wod-cindy", name: "Cindy", format: "amrap", scoreType: "rounds", capMin: 20,
        blurb: "20:00 AMRAP", equipmentNote: "Pull-up bar",
        movements: [ { move: "pullupm", amount: 5 }, { move: "pushupm", amount: 10 }, { move: "airsquat", amount: 15 } ] }) },
      { label: "Fran", wod: wod({ id: "wod-fran", name: "Fran", format: "fortime", scoreType: "time", capMin: 10, scheme: "21-15-9",
        blurb: "21-15-9 for time", equipmentNote: "Barbell 43 kg, pull-up bar",
        movements: [ { move: "thruster", load: 43 }, { move: "pullupm" } ] }) },
      { label: "Helen", wod: wod({ id: "wod-helen", name: "Helen", format: "rft", scoreType: "time", capMin: 15, targetRounds: 3,
        blurb: "3 rounds for time", equipmentNote: "24 kg kettlebell, pull-up bar",
        movements: [ { move: "run", amount: 400 }, { move: "kbswing", amount: 21, load: 24 }, { move: "pullupm", amount: 12 } ] }) },
      { label: "Grace", wod: wod({ id: "wod-grace", name: "Grace", format: "fortime", scoreType: "time", capMin: 8,
        blurb: "30 clean & jerks for time", equipmentNote: "Barbell 61 kg",
        movements: [ { move: "cleanjerk", amount: 30, load: 61 } ] }) },
      { label: "Annie", wod: wod({ id: "wod-annie", name: "Annie", format: "fortime", scoreType: "time", capMin: 12, scheme: "50-40-30-20-10",
        blurb: "50-40-30-20-10 for time", equipmentNote: "Jump rope",
        movements: [ { move: "dubs" }, { move: "situp" } ] }) },
      { label: "Diane", wod: wod({ id: "wod-diane", name: "Diane", format: "fortime", scoreType: "time", capMin: 12, scheme: "21-15-9",
        blurb: "21-15-9 for time", equipmentNote: "Barbell 102 kg, wall",
        movements: [ { move: "deadliftm", load: 102 }, { move: "hspu" } ] }) },
      { label: "EMOM 16", wod: wod({ id: "wod-emom16", name: "EMOM 16", format: "emom", scoreType: "time", capMin: 16,
        blurb: "Every minute on the minute, 16 minutes", equipmentNote: "Rower",
        minutes: [ { text: "15/12 cal row" }, { text: "12 burpees" } ] }) },
      { label: "Chipper", wod: wod({ id: "wod-chipper", name: "The Chipper", format: "chipper", scoreType: "time", capMin: 25,
        blurb: "One time through, in order", equipmentNote: "Box, KB, rower",
        movements: [ { move: "burpee", amount: 40 }, { move: "boxjump", amount: 40 }, { move: "kbswing", amount: 40, load: 24 }, { move: "row_cal", amount: 40 }, { move: "airsquat", amount: 40 } ] }) }
    ]
  };

  var CF_COND = {
    id: "crossfit-conditioning",
    kind: "metcon",
    style: "crossfit",
    name: "CrossFit Conditioning",
    author: "Rack Coach",
    blurb: "Eight short, mixed-modal conditioning pieces — AMRAPs and intervals under 20 minutes. Approachable, scalable, sweaty.",
    bestFor: "Building a conditioning base without max-effort barbell work",
    daysPerWeek: 4,
    microcycle: [
      { label: "Row & Burpee", wod: wod({ id: "wod-c1", name: "Row & Burpee", format: "amrap", scoreType: "rounds", capMin: 12,
        blurb: "12:00 AMRAP", equipmentNote: "Rower",
        movements: [ { move: "row_cal", amount: 12 }, { move: "burpee", amount: 9 } ] }) },
      { label: "Cardio Ladder", wod: wod({ id: "wod-c2", name: "Cardio Ladder", format: "fortime", scoreType: "time", capMin: 16,
        blurb: "For time", equipmentNote: "Rower, jump rope",
        movements: [ { move: "row", amount: 1000 }, { move: "dubs", amount: 100 }, { move: "airsquat", amount: 50 } ] }) },
      { label: "EMOM 20", wod: wod({ id: "wod-c3", name: "EMOM 20", format: "emom", scoreType: "time", capMin: 20,
        blurb: "Every minute, 20 minutes", equipmentNote: "Rower, KB",
        minutes: [ { text: "12/10 cal bike or row" }, { text: "10 KB swings" }, { text: "10 box jumps" }, { text: "Rest" } ] }) },
      { label: "Kettlebell AMRAP", wod: wod({ id: "wod-c4", name: "Kettlebell AMRAP", format: "amrap", scoreType: "rounds", capMin: 14,
        blurb: "14:00 AMRAP", equipmentNote: "24 kg kettlebell",
        movements: [ { move: "kbswing", amount: 15, load: 24 }, { move: "pushupm", amount: 12 }, { move: "lunge", amount: 20 } ] }) },
      { label: "Run Intervals", wod: wod({ id: "wod-c5", name: "Run Intervals", format: "rft", scoreType: "time", capMin: 20, targetRounds: 4,
        blurb: "4 rounds for time", equipmentNote: "Open space",
        movements: [ { move: "run", amount: 400 }, { move: "burpee", amount: 15 }, { move: "airsquat", amount: 25 } ] }) },
      { label: "Chest & Legs", wod: wod({ id: "wod-c6", name: "Chest & Legs", format: "amrap", scoreType: "rounds", capMin: 15,
        blurb: "15:00 AMRAP", equipmentNote: "Wall ball 9 kg",
        movements: [ { move: "wallball", amount: 15, load: 9 }, { move: "pushupm", amount: 10 }, { move: "boxjump", amount: 10 } ] }) },
      { label: "The Grind", wod: wod({ id: "wod-c7", name: "The Grind", format: "chipper", scoreType: "time", capMin: 22,
        blurb: "One time through", equipmentNote: "Rower, KB, box",
        movements: [ { move: "row_cal", amount: 30 }, { move: "kbswing", amount: 30, load: 24 }, { move: "boxjump", amount: 30 }, { move: "burpee", amount: 30 } ] }) },
      { label: "Sprint Finish", wod: wod({ id: "wod-c8", name: "Sprint Finish", format: "fortime", scoreType: "time", capMin: 8,
        blurb: "For time", equipmentNote: "Rower",
        movements: [ { move: "row_cal", amount: 21 }, { move: "thruster", amount: 21, load: 30 }, { move: "row_cal", amount: 15 }, { move: "thruster", amount: 15, load: 30 } ] }) }
    ]
  };

  /* ---------------------------------------------------------------- HYROX */
  function hy(o) { o.style = "hyrox"; return o; }
  var HYROX_STATIONS = [
    { move: "skierg",       amount: 1000, unit: "m" },
    { move: "sledpush",     amount: 50,   unit: "m", load: 152 },
    { move: "sledpull",     amount: 50,   unit: "m", load: 103 },
    { move: "burpeejump",   amount: 80,   unit: "m" },
    { move: "row",          amount: 1000, unit: "m" },
    { move: "farmers",      amount: 200,  unit: "m", load: 32 },
    { move: "sandbaglunge", amount: 100,  unit: "m", load: 20 },
    { move: "wallball",     amount: 100,  unit: "reps", load: 9 }
  ];

  var HY_PREP = {
    id: "hyrox-race-prep",
    kind: "metcon",
    style: "hyrox",
    name: "Hyrox Race Prep",
    author: "Rack Coach",
    blurb: "Six sessions to get ready for race day — station practice, compromised running, and a full eight-station simulation.",
    bestFor: "Anyone with a Hyrox on the calendar in the next 8–12 weeks",
    daysPerWeek: 3,
    microcycle: [
      { label: "Full Simulation", wod: hy({ id: "wod-hyrox-sim", name: "Full Simulation", format: "hyrox", scoreType: "time", capMin: 120,
        blurb: "1 km run before every station — race format", equipmentNote: "Full Hyrox rig",
        stations: HYROX_STATIONS }) },
      { label: "Ski + Row Engine", wod: hy({ id: "wod-hy-ski", name: "Ski + Row Engine", format: "rft", scoreType: "time", capMin: 40, targetRounds: 4,
        blurb: "4 rounds for time", equipmentNote: "SkiErg, rower",
        movements: [ { move: "run", amount: 1000 }, { move: "skierg", amount: 500 }, { move: "row", amount: 500 } ] }) },
      { label: "Sled Power", wod: hy({ id: "wod-hy-sled", name: "Sled Power", format: "rft", scoreType: "time", capMin: 35, targetRounds: 5,
        blurb: "5 rounds for time", equipmentNote: "Sled",
        movements: [ { move: "run", amount: 400 }, { move: "sledpush", amount: 25, load: 152 }, { move: "sledpull", amount: 25, load: 103 } ] }) },
      { label: "Compromised Run", wod: hy({ id: "wod-hy-run", name: "Compromised Run", format: "rft", scoreType: "time", capMin: 45, targetRounds: 5,
        blurb: "5 rounds for time", equipmentNote: "Wall ball 9 kg",
        movements: [ { move: "run", amount: 1000 }, { move: "wallball", amount: 20, load: 9 } ] }) },
      { label: "Carry Medley", wod: hy({ id: "wod-hy-carry", name: "Carry Medley", format: "rft", scoreType: "time", capMin: 30, targetRounds: 4,
        blurb: "4 rounds for time", equipmentNote: "Farmers handles, sandbag",
        movements: [ { move: "run", amount: 400 }, { move: "farmers", amount: 100, load: 32 }, { move: "sandbaglunge", amount: 50, load: 20 } ] }) },
      { label: "Half Simulation", wod: hy({ id: "wod-hyrox-half", name: "Half Simulation", format: "hyrox", scoreType: "time", capMin: 70,
        blurb: "First four stations, 1 km run before each", equipmentNote: "SkiErg, sled",
        stations: HYROX_STATIONS.slice(0, 4) }) }
    ]
  };

  var HY_ENGINE = {
    id: "hyrox-engine",
    kind: "metcon",
    style: "hyrox",
    name: "Hyrox Engine",
    author: "Rack Coach",
    blurb: "Six running-biased sessions that build the aerobic engine Hyrox rewards, with just enough station work to stay sharp.",
    bestFor: "Off-season base building, or a runner moving into Hyrox",
    daysPerWeek: 3,
    microcycle: [
      { label: "Long Run + Wall Balls", wod: hy({ id: "wod-he1", name: "Long Run + Wall Balls", format: "fortime", scoreType: "time", capMin: 50,
        blurb: "For time", equipmentNote: "Wall ball 9 kg",
        movements: [ { move: "run", amount: 5000 }, { move: "wallball", amount: 100, load: 9 } ] }) },
      { label: "1 km Repeats", wod: hy({ id: "wod-he2", name: "1 km Repeats", format: "rft", scoreType: "time", capMin: 45, targetRounds: 5,
        blurb: "5 rounds — 1 km hard, 2 min easy", equipmentNote: "Track or treadmill",
        movements: [ { move: "run", amount: 1000 }, { move: "run", amount: 200, note: "walk / easy" } ] }) },
      { label: "Row Pyramid", wod: hy({ id: "wod-he3", name: "Row Pyramid", format: "fortime", scoreType: "time", capMin: 30,
        blurb: "For time", equipmentNote: "Rower",
        movements: [ { move: "row", amount: 250 }, { move: "row", amount: 500 }, { move: "row", amount: 750 }, { move: "row", amount: 500 }, { move: "row", amount: 250 } ] }) },
      { label: "Burpee Broad Jumps", wod: hy({ id: "wod-he4", name: "Burpee Broad Jumps", format: "rft", scoreType: "time", capMin: 35, targetRounds: 4,
        blurb: "4 rounds for time", equipmentNote: "Open space",
        movements: [ { move: "run", amount: 800 }, { move: "burpeejump", amount: 25 } ] }) },
      { label: "SkiErg Intervals", wod: hy({ id: "wod-he5", name: "SkiErg Intervals", format: "emom", scoreType: "time", capMin: 20,
        blurb: "Every minute, 20 minutes", equipmentNote: "SkiErg",
        minutes: [ { text: "200 m SkiErg, hard" }, { text: "Rest / easy" } ] }) },
      { label: "Threshold Run", wod: hy({ id: "wod-he6", name: "Threshold Run", format: "fortime", scoreType: "time", capMin: 40,
        blurb: "For time — steady, uncomfortable pace", equipmentNote: "Open space",
        movements: [ { move: "run", amount: 8000 } ] }) }
    ]
  };

  window.RC_PROGRAMS = [PPL, UL, CF_BENCH, CF_COND, HY_PREP, HY_ENGINE];
})();
