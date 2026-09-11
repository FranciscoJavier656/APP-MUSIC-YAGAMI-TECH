#import <Capacitor/Capacitor.h>

CAP_PLUGIN(QobuzAudioPlugin, "QobuzAudioPlugin",
    CAP_PLUGIN_METHOD(play, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(pause, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(resume, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(seek, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(updateMetadata, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(setupRemoteControls, CAPPluginReturnPromise);
)
