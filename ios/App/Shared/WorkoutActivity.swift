import ActivityKit
import Foundation

/// The lock-screen / Dynamic Island card for a workout in progress.
/// Compiled into both the app (which starts and updates it) and the RepStarLive
/// widget extension (which draws it). The web app builds ContentState in
/// liveState() in index.html; times are epoch milliseconds, as in JavaScript.
@available(iOS 16.2, *)
struct WorkoutAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var title: String          // workout name
        var phase: String          // "set" | "rest" | "clock" | "idle"
        var headline: String       // the exercise, what was just done (rest) or the WOD
        var detail: String         // "Set 3 of 5 · 100 kg × 5"
        var nextName: String?      // up next, during rest
        var nextDetail: String?
        var startedAt: Double      // total workout time counts up from here
        var restEnd: Double?
        var restTotal: Double?     // seconds, for the progress bar
        var restLen: Double?       // the rest this exercise is set to; +0:30 changes it for its later sets too
        var restGroup: String?     // which exercise and kind of set that rest belongs to
        var clockFrom: Double?     // conditioning clock counting up from here
        var clockTo: Double?       // ...or down to here
        var clockText: String?     // frozen clock while paused or not started
        var steps: [Step]?         // the next few planned sets, for the lock-screen buttons
        var endHeadline: String?   // what the card says once the plan runs out
        var endDetail: String?
    }

    /// a planned set, and what logging it as planned looks like
    struct Step: Codable, Hashable {
        var key: String            // the app checks it before replaying a tap
        var group: String          // exercise + warm-up or work set, as the app remembers rest times
        var name: String
        var detail: String         // "Set 2 of 3 · 20 kg × 8"
        var saved: String          // "Set saved · Bench Press"
        var savedDetail: String    // "20 kg × 8"
        var rest: Double           // seconds of rest after it, 0 for none
    }

    var workoutId: String
}

/// Changes to the card, one at a time and in order. Two updates sent a moment
/// apart (a workout starting renders twice) would otherwise both find no card
/// and each start one, leaving a second card that never updates again.
enum LiveCards {
    private static let lock = NSLock()
    private static var last: Task<Void, Never>?

    @discardableResult
    static func serially(_ work: @escaping () async -> Void) -> Task<Void, Never> {
        lock.lock(); defer { lock.unlock() }
        let previous = last
        let next = Task { await previous?.value; await work() }
        last = next
        return next
    }
}

@available(iOS 16.2, *)
extension Activity where Attributes == WorkoutAttributes {
    /// cards still on screen: active, or stale — past the end of a rest, showing "rest over".
    /// Missing the stale ones made a second card, and left taps on the first doing nothing.
    static var onScreen: [Activity<WorkoutAttributes>] {
        activities.filter { $0.activityState == .active || $0.activityState == .stale }
    }
}

extension Double {
    var msDate: Date { Date(timeIntervalSince1970: self / 1000) }
}
