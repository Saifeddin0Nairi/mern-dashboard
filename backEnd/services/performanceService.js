const PerformanceEntry = require('../models/PerformanceEntry');
const WorkoutProgram = require('../models/WorkoutProgram');

/**
 * Compute the week number of a given date relative to program.startDate.
 */
function computeWeekNumber(programStartDate, entryDate, programDuration) {
  // Calculate difference in days (ignoring time of day)
  const startOfDay = (d) => {
    const dd = new Date(d);
    dd.setHours(0,0,0,0);
    return dd;
  };
  const start = startOfDay(programStartDate);
  const date = startOfDay(entryDate);
  const diffDays = Math.floor((date - start) / (1000*60*60*24));
  let week = Math.floor(diffDays / 7) + 1;
  if (week < 1) week = 1;
  if (programDuration && week > programDuration) week = programDuration;
  return week;
}

/**
 * Log or update a PerformanceEntry for a given training day.
 * Automatically calculates volume for each set, exercise, and day.
 */
async function logPerformance(userId, program, trainingDay, date, performanceData) {
  // Determine week number for the given date
  const weekNumber = computeWeekNumber(program.startDate, date, program.duration);
  // Validate and compute volumes
  let dayTotal = 0;
  const exercisesPerf = [];
  for (const ex of performanceData) {
    // Verify the exercise is in the training day's plan:
    const isPlanned = trainingDay.muscleGroups.some(mg =>
      mg.exercises.some(e => e.exerciseId.toString() === ex.exerciseId)
    );
    if (!isPlanned) {
      const err = new Error('Exercise not part of the training day plan');
      err.statusCode = 400;
      throw err;
    }
    // Compute volume for sets
    let exerciseTotal = 0;
    const setsArr = [];
    ex.sets.forEach((set, idx) => {
      const weight = Number(set.weight) || 0;
      const reps = Number(set.reps) || 0;
      const volume = weight * reps;
      setsArr.push({ setNumber: idx + 1, weight, reps, volume });
      exerciseTotal += volume;
    });
    exercisesPerf.push({
      exerciseId: ex.exerciseId,
      sets: setsArr,
      totalVolume: exerciseTotal
    });
    dayTotal += exerciseTotal;
  }
  // Find existing entry (if any)
  let entry = await PerformanceEntry.findOne({ userId, programId: program._id, trainingDayId: trainingDay._id, date });
  if (entry) {
    // Update existing entry
    entry.performanceData = exercisesPerf;
    entry.dayTotalVolume = dayTotal;
    entry.weekNumber = weekNumber;
  } else {
    // Create new entry
    entry = new PerformanceEntry({
      userId,
      programId: program._id,
      trainingDayId: trainingDay._id,
      date,
      weekNumber,
      performanceData: exercisesPerf,
      dayTotalVolume: dayTotal
    });
  }
  await entry.save();
  return entry;
}

/**
 * Calculate current active week number for a program (based on today and startDate).
 */
function getCurrentWeekNumber(program) {
  const today = new Date();
  const currentWeek = computeWeekNumber(program.startDate, today, program.duration);
  return currentWeek > program.duration ? program.duration : currentWeek;
}

/**
 * Compute summary statistics for a given week of a program.
 */
async function getWeekSummary(userId, program, weekNumber) {
  const programId = program._id;
  // Get all performance entries for that week
  const entries = await PerformanceEntry.find({ userId, programId, weekNumber });
  // Calculate summary metrics
  let totalVolume = 0;
  const exerciseVolumes = {};  // aggregate volume per exercise over the week
  const dayStats = [];         // details per completed day
  entries.forEach(entry => {
    totalVolume += entry.dayTotalVolume;
    // accumulate volume per exercise
    entry.performanceData.forEach(exPerf => {
      const exIdStr = exPerf.exerciseId.toString();
      exerciseVolumes[exIdStr] = (exerciseVolumes[exIdStr] || 0) + exPerf.totalVolume;
    });
    dayStats.push({
      trainingDayId: entry.trainingDayId,
      completedDate: entry.date,
      volume: entry.dayTotalVolume,
      exercises: entry.performanceData
    });
  });
  // Compute progression vs previous week
  let volumeProgression = null;
  if (weekNumber > 1) {
    // Calculate previous week total
    const prevEntries = await PerformanceEntry.find({ userId, programId, weekNumber: weekNumber - 1 });
    let prevTotal = 0;
    prevEntries.forEach(e => { prevTotal += e.dayTotalVolume; });
    if (prevTotal > 0) {
      volumeProgression = ((totalVolume - prevTotal) / prevTotal) * 100;
      volumeProgression = Math.round(volumeProgression);  // round to nearest whole percent
    } else if (prevTotal === 0 && totalVolume > 0) {
      // previous week had no volume, define progression as null (new activity)
      volumeProgression = null;
    } else {
      volumeProgression = 0;
    }
  }
  // Determine week date range
  const startDate = new Date(program.startDate);
  startDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  if (weekNumber === program.duration) {
    // clamp endDate to program end (duration * 7 - 1 days from start)
    endDate.setDate(program.startDate.getDate() + program.duration * 7 - 1);
  }
  return {
    week: weekNumber,
    startDate: startDate,
    endDate: endDate,
    totalVolume: totalVolume,
    exerciseVolumes: exerciseVolumes,
    volumeProgression: volumeProgression,
    completedDays: entries.length,
    dayStats: dayStats
  };
}

/**
 * Compute summary for all weeks up to current (or program duration).
 */
async function getAllWeeksSummary(userId, program) {
  const results = [];
  const currentWeek = getCurrentWeekNumber(program);
  for (let w = 1; w <= currentWeek; w++) {
    const summary = await getWeekSummary(userId, program, w);
    results.push(summary);
  }
  return results;
}

module.exports = {
  logPerformance,
  getCurrentWeekNumber,
  getWeekSummary,
  getAllWeeksSummary
};
