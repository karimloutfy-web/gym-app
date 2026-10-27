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
        var clockFrom: Double?     // conditioning clock counting up from here
        var clockTo: Double?       // ...or down to here
        var clockText: String?     // frozen clock while paused or not started
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

extension Double {
    var msDate: Date { Date(timeIntervalSince1970: self / 1000) }
}
