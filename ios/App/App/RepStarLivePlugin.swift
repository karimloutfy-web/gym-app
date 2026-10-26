import ActivityKit
import Capacitor
import Foundation
import UserNotifications

/// The workout Live Activity and the "Rest over" notification, driven from the
/// web app: liveSync() in index.html sends the card's whole state whenever the
/// workout changes, and ends it when the workout is finished or discarded. The
/// clocks on the card tick on their own.
@objc(RepStarLivePlugin)
public class RepStarLivePlugin: CAPPlugin, CAPBridgedPlugin, NotificationHandlerProtocol {
    public let identifier = "RepStarLivePlugin"
    public let jsName = "RepStarLive"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "end", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "takeActions", returnType: CAPPluginReturnPromise)
    ]

    override public func load() {
        bridge?.notificationRouter.localNotificationHandler = self
        // a lock-screen button was tapped while the web app is awake: tell it to replay
        NotificationCenter.default.addObserver(forName: LiveActions.posted, object: nil, queue: .main) { [weak self] _ in
            self?.notifyListeners("action", data: [:])
        }
    }

    /// lock-screen button taps the web app hasn't replayed yet (see WorkoutIntents.swift)
    @objc func takeActions(_ call: CAPPluginCall) {
        call.resolve(["actions": LiveActions.take()])
    }

    @objc func update(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else { call.resolve(["supported": false]); return }
        guard let id = call.getString("id"), let raw = call.getObject("state"),
              let data = try? JSONSerialization.data(withJSONObject: raw),
              let state = try? JSONDecoder().decode(WorkoutAttributes.ContentState.self, from: data) else {
            call.reject("bad state"); return
        }
        RestAlarm.sync(state)
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { call.resolve(["supported": false]); return }
        // past the end of a rest the card switches itself to "rest over"
        let stale = state.phase == "rest" ? state.restEnd?.msDate : nil
        let content = ActivityContent(state: state, staleDate: stale)
        LiveCards.serially {
            let live = Activity<WorkoutAttributes>.onScreen
            let card = live.first(where: { $0.attributes.workoutId == id })
            if let card = card {
                await card.update(content)
            } else {
                _ = try? Activity.request(attributes: WorkoutAttributes(workoutId: id), content: content, pushType: nil)
            }
            // one card: anything left from an earlier workout goes, and so does any duplicate of this one
            for a in live where a.id != card?.id { await a.end(nil, dismissalPolicy: .immediate) }
            call.resolve(["supported": true])
        }
    }

    @objc func end(_ call: CAPPluginCall) {
        RestAlarm.cancel()
        guard #available(iOS 16.2, *) else { call.resolve(); return }
        LiveCards.serially {
            for a in Activity<WorkoutAttributes>.activities { await a.end(nil, dismissalPolicy: .immediate) }
            call.resolve()
        }
    }

    // with the app open the workout screen chimes by itself, so no banner on top
    public func willPresent(notification: UNNotification) -> UNNotificationPresentationOptions {
        notification.request.identifier == RestAlarm.id ? [] : [.banner, .sound]
    }

    public func didReceive(response: UNNotificationResponse) {}
}
