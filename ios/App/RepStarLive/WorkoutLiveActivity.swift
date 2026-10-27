import ActivityKit
import SwiftUI
import WidgetKit

// Volt: black card, lime accent, bold numbers
private let lime = Color(red: 0xC8 / 255, green: 0xF0 / 255, blue: 0x31 / 255)
private let faint = Color.white.opacity(0.55)

struct WorkoutLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WorkoutAttributes.self) { context in
            LockScreenCard(state: context.state, stale: context.isStale)
                .activityBackgroundTint(Color.black)
                .activitySystemActionForegroundColor(lime)
        } dynamicIsland: { context in
            let s = context.state, stale = context.isStale
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label(s.title, systemImage: "star.fill")
                        .font(.caption.weight(.semibold))
                        .foregroundColor(faint)
                        .lineLimit(1)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    ElapsedText(state: s).font(.caption.weight(.semibold)).foregroundColor(faint)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 10) {
                        CardBody(state: s, stale: stale)
                        if #available(iOS 17.0, *) { CardButtons(state: s, stale: stale) }
                    }
                }
            } compactLeading: {
                Image(systemName: "star.fill").foregroundColor(lime)
            } compactTrailing: {
                CompactClock(state: s, stale: stale)
            } minimal: {
                CompactClock(state: s, stale: stale)
            }
            .keylineTint(lime)
        }
    }
}

private struct LockScreenCard: View {
    let state: WorkoutAttributes.ContentState
    let stale: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Label(state.title, systemImage: "star.fill")
                    .font(.caption.weight(.semibold))
                    .lineLimit(1)
                Spacer()
                ElapsedText(state: state).font(.caption.weight(.semibold))
            }
            .foregroundColor(faint)
            CardBody(state: state, stale: stale)
            if #available(iOS 17.0, *) { CardButtons(state: state, stale: stale) }
        }
        .padding(16)
    }
}

/// what's happening now: the set to do, the rest countdown, or the conditioning clock
private struct CardBody: View {
    let state: WorkoutAttributes.ContentState
    let stale: Bool

    var body: some View {
        switch state.phase {
        case "rest":
            restBody
        case "clock":
            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(state.headline).font(.headline.weight(.heavy)).foregroundColor(.white).lineLimit(1)
                    Text(state.detail).font(.subheadline).foregroundColor(lime).lineLimit(1)
                }
                Spacer()
                ClockText(state: state).font(.system(size: 34, weight: .heavy).monospacedDigit()).foregroundColor(.white)
            }
        default:
            VStack(alignment: .leading, spacing: 2) {
                Text(state.headline).font(.title3.weight(.heavy)).foregroundColor(.white).lineLimit(1)
                Text(state.detail).font(.subheadline.weight(.semibold)).foregroundColor(lime).lineLimit(1)
            }
        }
    }

    @ViewBuilder private var restBody: some View {
        let over = stale || (state.restEnd ?? 0).msDate <= Date()
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .center) {
                VStack(alignment: .leading, spacing: 0) {
                    Text(over ? "REST OVER" : "REST").font(.caption.weight(.heavy)).foregroundColor(lime)
                    if over {
                        Text("Go").font(.system(size: 34, weight: .heavy)).foregroundColor(.white)
                    } else if let end = state.restEnd {
                        Text(timerInterval: Date()...max(Date(), end.msDate), countsDown: true)
                            .font(.system(size: 34, weight: .heavy).monospacedDigit())
                            .foregroundColor(.white)
                    }
                }
                Spacer(minLength: 12)
                VStack(alignment: .trailing, spacing: 1) {
                    Text("Up next").font(.caption).foregroundColor(faint)
                    Text(state.nextName ?? "").font(.subheadline.weight(.heavy)).foregroundColor(.white).lineLimit(1)
                    Text(state.nextDetail ?? "").font(.caption.weight(.semibold)).foregroundColor(lime).lineLimit(1)
                }
            }
            if !over, let end = state.restEnd, let total = state.restTotal, total > 0 {
                let start = end.msDate.addingTimeInterval(-total)
                ProgressView(timerInterval: min(start, end.msDate)...end.msDate, countsDown: true) { EmptyView() } currentValueLabel: { EmptyView() }
                    .tint(lime)
            }
        }
    }
}

/// Skip rest / +0:30 while resting, Log set otherwise (iOS 17+; see WorkoutIntents.swift)
@available(iOS 17.0, *)
private struct CardButtons: View {
    let state: WorkoutAttributes.ContentState
    let stale: Bool

    var body: some View {
        let resting = state.phase == "rest" && !stale && (state.restEnd ?? 0).msDate > Date()
        let canLog = (state.phase == "set" || state.phase == "rest") && !(state.steps ?? []).isEmpty
        if resting {
            HStack(spacing: 8) {
                Button(intent: AddRestIntent()) { pill("+0:30", filled: false) }.buttonStyle(.plain)
                Button(intent: SkipRestIntent()) { pill("Skip rest", filled: true) }.buttonStyle(.plain)
            }
        } else if canLog {
            Button(intent: LogSetIntent()) { pill("Log set", filled: true) }.buttonStyle(.plain)
        }
    }

    private func pill(_ title: String, filled: Bool) -> some View {
        Text(title)
            .font(.subheadline.weight(.heavy))
            .foregroundColor(filled ? .black : .white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(Capsule().fill(filled ? lime : Color.white.opacity(0.14)))
    }
}

/// total workout time, counting up
private struct ElapsedText: View {
    let state: WorkoutAttributes.ContentState
    var body: some View {
        let start = state.startedAt.msDate
        Text(timerInterval: start...start.addingTimeInterval(12 * 3600), countsDown: false).monospacedDigit()
    }
}

/// the conditioning clock: frozen, counting down to the cap, or counting up
private struct ClockText: View {
    let state: WorkoutAttributes.ContentState
    var body: some View {
        if let frozen = state.clockText {
            Text(frozen)
        } else if let to = state.clockTo {
            Text(timerInterval: Date()...max(Date(), to.msDate), countsDown: true)
        } else if let from = state.clockFrom {
            Text(timerInterval: from.msDate...from.msDate.addingTimeInterval(12 * 3600), countsDown: false)
        } else {
            Text("0:00")
        }
    }
}

/// the small clock in the Dynamic Island: rest left, the conditioning clock, or total time
private struct CompactClock: View {
    let state: WorkoutAttributes.ContentState
    let stale: Bool
    var body: some View {
        Group {
            if state.phase == "rest", let end = state.restEnd, !stale, end.msDate > Date() {
                Text(timerInterval: Date()...end.msDate, countsDown: true)
            } else if state.phase == "rest" {
                Text("Go")
            } else if state.phase == "clock" {
                ClockText(state: state)
            } else {
                ElapsedText(state: state)
            }
        }
        .font(.caption.weight(.heavy).monospacedDigit())
        .foregroundColor(lime)
        .frame(maxWidth: 52)
    }
}
