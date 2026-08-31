/* Rack Coach — random-workout pool (CrossFit + Hyrox style WODs).
   Plain synchronous script: sets a global the main IIFE reads at boot.
   Same WOD schema as data-programs.js. Bump sw.js CACHE when this changes. */

(function () {
  var CROSSFIT = [
    { id: "r-cf-cindy", name: "Cindy", style: "crossfit", format: "amrap", scoreType: "rounds", capMin: 20,
      equipmentNote: "Pull-up bar",
      movements: [ { move: "pullupm", amount: 5 }, { move: "pushupm", amount: 10 }, { move: "airsquat", amount: 15 } ] },
    { id: "r-cf-fran", name: "Fran", style: "crossfit", format: "fortime", scoreType: "time", capMin: 10, scheme: "21-15-9",
      equipmentNote: "Barbell 43 kg, pull-up bar",
      movements: [ { move: "thruster", load: 43 }, { move: "pullupm" } ] },
    { id: "r-cf-helen", name: "Helen", style: "crossfit", format: "rft", scoreType: "time", capMin: 15, targetRounds: 3,
      equipmentNote: "24 kg kettlebell, pull-up bar",
      movements: [ { move: "run", amount: 400 }, { move: "kbswing", amount: 21, load: 24 }, { move: "pullupm", amount: 12 } ] },
    { id: "r-cf-jackie", name: "Jackie", style: "crossfit", format: "fortime", scoreType: "time", capMin: 12,
      equipmentNote: "Rower, barbell 20 kg, pull-up bar",
      movements: [ { move: "row", amount: 1000 }, { move: "thruster", amount: 50, load: 20 }, { move: "pullupm", amount: 30 } ] },
    { id: "r-cf-dt", name: "DT", style: "crossfit", format: "rft", scoreType: "time", capMin: 15, targetRounds: 5,
      equipmentNote: "Barbell 70 kg",
      movements: [ { move: "deadliftm", amount: 12, load: 70 }, { move: "cleanjerk", amount: 9, load: 70 }, { move: "cleanjerk", amount: 6, load: 70, note: "push jerk" } ] },
    { id: "r-cf-annie", name: "Annie", style: "crossfit", format: "fortime", scoreType: "time", capMin: 12, scheme: "50-40-30-20-10",
      equipmentNote: "Jump rope",
      movements: [ { move: "dubs" }, { move: "situp" } ] },
    { id: "r-cf-grace", name: "Grace", style: "crossfit", format: "fortime", scoreType: "time", capMin: 8,
      equipmentNote: "Barbell 61 kg",
      movements: [ { move: "cleanjerk", amount: 30, load: 61 } ] },
    { id: "r-cf-kelly", name: "Kelly", style: "crossfit", format: "rft", scoreType: "time", capMin: 35, targetRounds: 5,
      equipmentNote: "Box, wall ball 9 kg",
      movements: [ { move: "run", amount: 400 }, { move: "boxjump", amount: 30 }, { move: "wallball", amount: 30, load: 9 } ] },
    { id: "r-cf-amrap12", name: "Bodyweight 12", style: "crossfit", format: "amrap", scoreType: "rounds", capMin: 12,
      equipmentNote: "None",
      movements: [ { move: "burpee", amount: 8 }, { move: "airsquat", amount: 12 }, { move: "situp", amount: 16 } ] },
    { id: "r-cf-emom18", name: "EMOM 18", style: "crossfit", format: "emom", scoreType: "time", capMin: 18,
      equipmentNote: "Rower, KB, box",
      minutes: [ { text: "14/11 cal row" }, { text: "12 KB swings @ 24 kg" }, { text: "10 box jumps" } ] },
    { id: "r-cf-chief", name: "The Chief", style: "crossfit", format: "amrap", scoreType: "rounds", capMin: 15,
      equipmentNote: "Barbell 60 kg — 5 cycles of 3:00 on / 1:00 off",
      movements: [ { move: "cleanjerk", amount: 3, load: 60, note: "power clean" }, { move: "pushupm", amount: 6 }, { move: "airsquat", amount: 9 } ] },
    { id: "r-cf-filthy", name: "Filthy Fifty", style: "crossfit", format: "chipper", scoreType: "time", capMin: 30,
      equipmentNote: "Box, KB, jump rope, wall ball",
      movements: [ { move: "boxjump", amount: 50 }, { move: "kbswing", amount: 50, load: 16 }, { move: "burpee", amount: 50 }, { move: "dubs", amount: 50 }, { move: "situp", amount: 50 } ] }
  ];

  var HYROX = [
    { id: "r-hy-runski", name: "Run / Ski Repeats", style: "hyrox", format: "rft", scoreType: "time", capMin: 40, targetRounds: 5,
      equipmentNote: "SkiErg",
      movements: [ { move: "run", amount: 1000 }, { move: "skierg", amount: 250 } ] },
    { id: "r-hy-sledday", name: "Sled Day", style: "hyrox", format: "rft", scoreType: "time", capMin: 30, targetRounds: 4,
      equipmentNote: "Sled",
      movements: [ { move: "run", amount: 400 }, { move: "sledpush", amount: 25, load: 100 }, { move: "sledpull", amount: 25, load: 75 } ] },
    { id: "r-hy-wallball", name: "Run + Wall Balls", style: "hyrox", format: "rft", scoreType: "time", capMin: 40, targetRounds: 5,
      equipmentNote: "Wall ball 9 kg",
      movements: [ { move: "run", amount: 1000 }, { move: "wallball", amount: 20, load: 9 } ] },
    { id: "r-hy-carry", name: "Carry Medley", style: "hyrox", format: "rft", scoreType: "time", capMin: 28, targetRounds: 4,
      equipmentNote: "Farmers handles, sandbag",
      movements: [ { move: "run", amount: 400 }, { move: "farmers", amount: 100, load: 32 }, { move: "sandbaglunge", amount: 50, load: 20 } ] },
    { id: "r-hy-burpeebroad", name: "Burpee Broad Jumps", style: "hyrox", format: "rft", scoreType: "time", capMin: 32, targetRounds: 4,
      equipmentNote: "Open space",
      movements: [ { move: "run", amount: 800 }, { move: "burpeejump", amount: 25 } ] },
    { id: "r-hy-rowerg", name: "Row Engine", style: "hyrox", format: "fortime", scoreType: "time", capMin: 30,
      equipmentNote: "Rower",
      movements: [ { move: "run", amount: 2000 }, { move: "row", amount: 2000 }, { move: "run", amount: 1000 } ] },
    { id: "r-hy-halfsim", name: "Half Simulation", style: "hyrox", format: "hyrox", scoreType: "time", capMin: 70,
      equipmentNote: "SkiErg, sled, rower",
      stations: [
        { move: "skierg", amount: 1000, unit: "m" },
        { move: "sledpush", amount: 50, unit: "m", load: 152 },
        { move: "sledpull", amount: 50, unit: "m", load: 103 },
        { move: "burpeejump", amount: 80, unit: "m" }
      ] },
    { id: "r-hy-fullsim", name: "Full Simulation", style: "hyrox", format: "hyrox", scoreType: "time", capMin: 120,
      equipmentNote: "Full Hyrox rig",
      stations: [
        { move: "skierg", amount: 1000, unit: "m" },
        { move: "sledpush", amount: 50, unit: "m", load: 152 },
        { move: "sledpull", amount: 50, unit: "m", load: 103 },
        { move: "burpeejump", amount: 80, unit: "m" },
        { move: "row", amount: 1000, unit: "m" },
        { move: "farmers", amount: 200, unit: "m", load: 32 },
        { move: "sandbaglunge", amount: 100, unit: "m", load: 20 },
        { move: "wallball", amount: 100, unit: "reps", load: 9 }
      ] },
    { id: "r-hy-1kmrepeats", name: "1 km Repeats", style: "hyrox", format: "rft", scoreType: "time", capMin: 40, targetRounds: 5,
      equipmentNote: "Track or treadmill",
      movements: [ { move: "run", amount: 1000 }, { move: "run", amount: 200, note: "walk / easy" } ] },
    { id: "r-hy-threshold", name: "Threshold Run", style: "hyrox", format: "fortime", scoreType: "time", capMin: 40,
      equipmentNote: "Open space",
      movements: [ { move: "run", amount: 6000 } ] }
  ];

  window.RC_WOD_POOL = CROSSFIT.concat(HYROX);
})();
