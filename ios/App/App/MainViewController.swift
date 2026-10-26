import Capacitor

/// The app's web view. Capacitor finds the npm plugins by itself; Rep Star's
/// own native plugins live in this target and are registered here.
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(RepStarLivePlugin())
    }
}
