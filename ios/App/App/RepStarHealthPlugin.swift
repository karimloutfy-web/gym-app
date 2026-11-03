import Capacitor
import Foundation
import HealthKit

/// Reads the day's recovery and activity, and recent cardio workouts, from Apple Health —
/// where Garmin Connect, an Apple Watch or the iPhone itself put them — for the Today card
/// on Home and the Cardio list on Progress (healthSync() in index.html). Read-only:
/// Rep Star never writes to Health.
@objc(RepStarHealthPlugin)
public class RepStarHealthPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "RepStarHealthPlugin"
    public let jsName = "RepStarHealth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "available", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "connect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "today", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "workouts", returnType: CAPPluginReturnPromise)
    ]

    private let store = HKHealthStore()

    private var readTypes: Set<HKObjectType> {
        var s: Set<HKObjectType> = [HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!, HKObjectType.workoutType()]
        for id in [HKQuantityTypeIdentifier.restingHeartRate, .stepCount, .activeEnergyBurned, .heartRate,
                   .distanceWalkingRunning, .distanceCycling, .distanceSwimming] {
            s.insert(HKObjectType.quantityType(forIdentifier: id)!)
        }
        return s
    }

    @objc func available(_ call: CAPPluginCall) {
        call.resolve(["available": HKHealthStore.isHealthDataAvailable()])
    }

    /// shows Apple's permission sheet the first time; after that it returns at once.
    /// iOS never says whether reading was allowed, so the card just shows what comes back.
    @objc func connect(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { call.resolve(["connected": false]); return }
        store.requestAuthorization(toShare: nil, read: readTypes) { ok, _ in
            call.resolve(["connected": ok])
        }
    }

    /// last night's sleep, resting heart rate (and its 7-day average), steps and active calories so far today.
    /// Anything Health doesn't have is left out.
    @objc func today(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { call.resolve([:]); return }
        let cal = Calendar.current, now = Date(), midnight = cal.startOfDay(for: now)
        Task {
            var out: [String: Any] = [:]
            if let m = await sleepMinutes(since: cal.date(byAdding: .hour, value: -6, to: midnight)!, until: now) { out["sleepMin"] = m }
            if let r = await latestRestingHr(since: cal.date(byAdding: .day, value: -1, to: midnight)!) { out["restingHr"] = r }
            if let a = await statistic(.restingHeartRate, unit: .count().unitDivided(by: .minute()), options: .discreteAverage,
                                       from: cal.date(byAdding: .day, value: -7, to: midnight)!, to: midnight) { out["restingHrAvg"] = a }
            if let s = await statistic(.stepCount, unit: .count(), options: .cumulativeSum, from: midnight, to: now) { out["steps"] = s }
            if let k = await statistic(.activeEnergyBurned, unit: .kilocalorie(), options: .cumulativeSum, from: midnight, to: now) { out["activeKcal"] = k }
            call.resolve(out)
        }
    }

    /// cardio workouts from the last `days` days (default 90), newest first. Strength and
    /// other gym sessions are left out: those are logged in Rep Star itself.
    @objc func workouts(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { call.resolve(["workouts": []]); return }
        let days = call.getInt("days") ?? 90, now = Date()
        let from = Calendar.current.date(byAdding: .day, value: -days, to: now)!
        Task {
            var out: [[String: Any]] = []
            for case let w as HKWorkout in await samples(HKObjectType.workoutType(), from: from, to: now, newestFirst: true) {
                guard let kind = Self.cardioKind(w.workoutActivityType) else { continue }
                var row: [String: Any] = [
                    "id": w.uuid.uuidString, "kind": kind,
                    "start": w.startDate.timeIntervalSince1970 * 1000, "durationSec": w.duration.rounded(),
                    "source": w.sourceRevision.source.name
                ]
                if let d = w.totalDistance?.doubleValue(for: .meter()), d > 0 { row["distanceM"] = d.rounded() }
                if let k = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()), k > 0 { row["kcal"] = k.rounded() }
                if let hr = await statistic(.heartRate, unit: .count().unitDivided(by: .minute()), options: .discreteAverage,
                                            from: w.startDate, to: w.endDate) { row["avgHr"] = hr }
                out.append(row)
            }
            call.resolve(["workouts": out])
        }
    }

    private static func cardioKind(_ t: HKWorkoutActivityType) -> String? {
        switch t {
        case .running: return "run"
        case .walking: return "walk"
        case .hiking: return "hike"
        case .cycling, .handCycling: return "ride"
        case .swimming: return "swim"
        case .rowing: return "row"
        case .elliptical: return "elliptical"
        case .stairClimbing, .stairs: return "stairs"
        case .crossCountrySkiing, .downhillSkiing, .snowboarding: return "ski"
        case .paddleSports, .surfingSports: return "paddle"
        case .mixedCardio, .jumpRope, .skatingSports: return "cardio"
        default: return nil
        }
    }

    /// minutes asleep in the window, counting time once when a watch and the phone both logged it
    private func sleepMinutes(since start: Date, until end: Date) async -> Double? {
        let type = HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!
        let samples = await samples(type, from: start, to: end)
        // iOS 15 only knows "asleep" (raw value 1, renamed asleepUnspecified in 16)
        var asleep = [1]
        if #available(iOS 16.0, *) {
            asleep += [HKCategoryValueSleepAnalysis.asleepCore.rawValue, HKCategoryValueSleepAnalysis.asleepDeep.rawValue,
                       HKCategoryValueSleepAnalysis.asleepREM.rawValue]
        }
        let spans = samples.compactMap { $0 as? HKCategorySample }
            .filter { asleep.contains($0.value) }
            .map { (max($0.startDate, start), min($0.endDate, end)) }
            .filter { $0.0 < $0.1 }
            .sorted { $0.0 < $1.0 }
        guard !spans.isEmpty else { return nil }
        var total: TimeInterval = 0, cur = spans[0]
        for s in spans.dropFirst() {
            if s.0 <= cur.1 { cur.1 = max(cur.1, s.1) } else { total += cur.1.timeIntervalSince(cur.0); cur = s }
        }
        total += cur.1.timeIntervalSince(cur.0)
        return (total / 60).rounded()
    }

    private func latestRestingHr(since start: Date) async -> Double? {
        let type = HKObjectType.quantityType(forIdentifier: .restingHeartRate)!
        let s = await samples(type, from: start, to: Date(), newestFirst: true, limit: 1).first as? HKQuantitySample
        return s.map { $0.quantity.doubleValue(for: .count().unitDivided(by: .minute())).rounded() }
    }

    private func samples(_ type: HKSampleType, from: Date, to: Date, newestFirst: Bool = false, limit: Int = HKObjectQueryNoLimit) async -> [HKSample] {
        await withCheckedContinuation { done in
            let pred = HKQuery.predicateForSamples(withStart: from, end: to)
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: !newestFirst)
            store.execute(HKSampleQuery(sampleType: type, predicate: pred, limit: limit, sortDescriptors: [sort]) { _, s, _ in
                done.resume(returning: s ?? [])
            })
        }
    }

    private func statistic(_ id: HKQuantityTypeIdentifier, unit: HKUnit, options: HKStatisticsOptions, from: Date, to: Date) async -> Double? {
        await withCheckedContinuation { done in
            let type = HKObjectType.quantityType(forIdentifier: id)!
            let pred = HKQuery.predicateForSamples(withStart: from, end: to)
            store.execute(HKStatisticsQuery(quantityType: type, quantitySamplePredicate: pred, options: options) { _, st, _ in
                let q = options.contains(.cumulativeSum) ? st?.sumQuantity() : st?.averageQuantity()
                done.resume(returning: q.map { $0.doubleValue(for: unit).rounded() })
            })
        }
    }
}
