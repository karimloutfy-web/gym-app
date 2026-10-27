import ActivityKit
import Capacitor
import Foundation

/// The workout Live Activity, driven from the web app: liveSync() in index.html
/// sends the card's whole state whenever the workout changes, and ends it when
/// the workout is finished or discarded. The clocks on the card tick on their own.
@objc(RepStarLivePlugin)
public class RepStarLivePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "RepStarLivePlugin"
    public let jsName = "RepStarLive"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "end", returnType: CAPPluginReturnPromise)
    ]

    @objc func update(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *), ActivityAuthorizationInfo().areActivitiesEnabled else {
            call.resolve(["supported": false]); return
        }
        guard let id = call.getString("id"), let raw = call.getObject("state"),
              let data = try? JSONSerialization.data(withJSONObject: raw),
              let state = try? JSONDecoder().decode(WorkoutAttributes.ContentState.self, from: data) else {
            call.reject("bad state"); return
        }
        // past the end of a rest the card switches itself to "rest over"
        let stale = state.phase == "rest" ? state.restEnd?.msDate : nil
        let content = ActivityContent(state: state, staleDate: stale)
        LiveCards.serially {
            let live = Activity<WorkoutAttributes>.activities.filter { $0.activityState == .active }
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
        guard #available(iOS 16.2, *) else { call.resolve(); return }
        LiveCards.serially {
            for a in Activity<WorkoutAttributes>.activities { await a.end(nil, dismissalPolicy: .immediate) }
            call.resolve()
        }
    }
}
