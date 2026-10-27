import Foundation
import UserNotifications

/// The "Rest over" notification: booked for the moment a rest ends, so the phone
/// buzzes and says what's next even when it's locked and the app is asleep.
/// Marked Time Sensitive so it comes through Focus modes — that only takes effect
/// once the app is signed with App/App.entitlements, which needs the paid Apple
/// Developer account (personal teams can't sign it): then set the App target's
/// CODE_SIGN_ENTITLEMENTS to App/App.entitlements. Until then iOS delivers it as
/// an ordinary notification.
enum RestAlarm {
    static let id = "rest-over"

    /// book it for this rest, or clear it when there's no rest running
    @available(iOS 16.2, *)
    static func sync(_ state: WorkoutAttributes.ContentState) {
        guard state.phase == "rest", let end = state.restEnd?.msDate, end.timeIntervalSinceNow > 1 else { cancel(); return }
        let center = UNUserNotificationCenter.current()
        // asked once, at the first rest
        center.requestAuthorization(options: [.alert, .sound]) { granted, _ in
            guard granted else { return }
            let content = UNMutableNotificationContent()
            content.title = "Rest over"
            content.body = [state.nextName, state.nextDetail].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · ")
            content.sound = .default
            content.threadIdentifier = id
            content.interruptionLevel = .timeSensitive
            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: max(1, end.timeIntervalSinceNow), repeats: false)
            center.add(UNNotificationRequest(identifier: id, content: content, trigger: trigger))
        }
    }

    static func cancel() {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [id])
    }
}
