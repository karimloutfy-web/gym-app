import ActivityKit
import AppIntents
import Foundation

/// Buttons on the lock-screen card (iOS 17+). iOS runs these in the app's process
/// while the web view is asleep, so they act on the card directly: the card carries
/// the next few planned sets (ContentState.steps), and each tap moves it along the
/// way the app would. The tap is also queued in LiveActions; the web app replays the
/// queue into the workout when it next wakes (liveTakeActions() in index.html).

@available(iOS 17.0, *)
struct LogSetIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Log set"
    static var isDiscoverable = false
    func perform() async throws -> some IntentResult {
        await LiveActions.apply("log")
        return .result()
    }
}

@available(iOS 17.0, *)
struct SkipRestIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Skip rest"
    static var isDiscoverable = false
    func perform() async throws -> some IntentResult {
        await LiveActions.apply("skip")
        return .result()
    }
}

@available(iOS 17.0, *)
struct AddRestIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Add 30 seconds of rest"
    static var isDiscoverable = false
    func perform() async throws -> some IntentResult {
        await LiveActions.apply("plus")
        return .result()
    }
}

enum LiveActions {
    static let key = "RepStarLive.actions"
    static let posted = Notification.Name("RepStarLiveAction")

    /// the taps the web app hasn't replayed yet, oldest first; reading them clears the queue
    static func take() -> [[String: Any]] {
        let list = UserDefaults.standard.array(forKey: key) as? [[String: Any]] ?? []
        UserDefaults.standard.removeObject(forKey: key)
        return list
    }

    @available(iOS 17.0, *)
    static func apply(_ type: String) async {
        guard let activity = Activity<WorkoutAttributes>.activities.first(where: { $0.activityState == .active }) else { return }
        var s = activity.content.state
        let now = Date().timeIntervalSince1970 * 1000
        let resting = s.phase == "rest" && (s.restEnd ?? 0) > now
        var action: [String: Any] = ["type": type, "at": now]
        switch type {
        case "log":
            // the set to do now: the current one, or the next one once a rest is over
            guard !resting, s.phase == "set" || s.phase == "rest", let steps = s.steps, let step = steps.first else { return }
            action["key"] = step.key
            let rest = Array(steps.dropFirst())
            s.steps = rest
            if step.rest > 0 {
                s.phase = "rest"
                s.restEnd = now + step.rest * 1000
                s.restTotal = step.rest
                s.restLen = step.rest
                s.restGroup = step.group
                s.headline = step.saved
                s.detail = step.savedDetail
                s.nextName = rest.first?.name ?? "Your next exercise"
                s.nextDetail = rest.first?.detail ?? "Pick it when you're ready"
            } else {
                showNext(&s)
            }
        case "skip":
            guard resting else { return }
            showNext(&s)
        case "plus":
            guard resting, let end = s.restEnd else { return }
            s.restEnd = end + 30_000
            s.restTotal = (s.restTotal ?? 0) + 30
            // like the app's +0:30: this exercise rests that long from now on (bumpRestLen() in index.html)
            let len = ((((s.restLen ?? s.restTotal ?? 0) + 30) / 15).rounded()) * 15
            s.restLen = len
            if len >= 15, let group = s.restGroup {
                s.steps = s.steps?.map { var st = $0; if st.group == group && st.rest > 0 { st.rest = len }; return st }
            }
        default:
            return
        }
        var list = UserDefaults.standard.array(forKey: key) as? [[String: Any]] ?? []
        list.append(action)
        UserDefaults.standard.set(list, forKey: key)

        let stale = s.phase == "rest" ? s.restEnd?.msDate : nil
        await activity.update(ActivityContent(state: s, staleDate: stale))
        RestAlarm.sync(s)
        // if the web app happens to be awake, it replays straight away
        NotificationCenter.default.post(name: posted, object: nil)
    }

    /// out of rest: on to the next planned set, or the end of the plan
    @available(iOS 16.2, *)
    private static func showNext(_ s: inout WorkoutAttributes.ContentState) {
        s.restEnd = nil
        if let next = s.steps?.first {
            s.phase = "set"
            s.headline = next.name
            s.detail = next.detail
        } else {
            s.phase = "idle"
            s.headline = s.endHeadline ?? "Lifts done"
            s.detail = s.endDetail ?? ""
        }
    }
}
