package io.github.mimir.browser.bridge

import android.os.Handler
import android.os.Looper
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import io.github.mimir.browser.MainActivity
import org.json.JSONObject

/**
 * Native JavaScript Interface exposed as window.MimirNative in React Chrome UI.
 */
class MimirNativeBridge(
    private val activity: MainActivity,
    private val chromeWebView: WebView
) {
    private val mainHandler = Handler(Looper.getMainLooper())

    @JavascriptInterface
    fun postMessage(jsonString: String) {
        mainHandler.post {
            try {
                val json = JSONObject(jsonString)
                val type = json.optString("type")
                val payload = json.optJSONObject("payload")

                Log.d("MimirNativeBridge", "ᛗ Bridge dispatch: $type")

                when (type) {
                    "NAVIGATE", "NAVIGATE_TO" -> {
                        val url = payload?.optString("url") ?: ""
                        activity.navigateTo(url)
                    }
                    "REFRESH", "RELOAD" -> activity.reloadActiveTab()
                    "GO_BACK" -> activity.goBackActiveTab()
                    "GO_FORWARD" -> activity.goForwardActiveTab()
                    "CREATE_TAB", "NEW_TAB" -> {
                        val url = payload?.optString("url") ?: "mimir://newtab"
                        val realm = payload?.optString("realm") ?: "midgard"
                        activity.createNewTab(url, realm)
                    }
                    "CLOSE_TAB" -> {
                        val tabId = payload?.optString("tabId") ?: ""
                        activity.closeTab(tabId)
                    }
                    "SWITCH_TAB" -> {
                        val tabId = payload?.optString("tabId") ?: ""
                        activity.switchTab(tabId)
                    }
                    "DOWNLOAD_URL" -> {
                        val url = payload?.optString("url") ?: ""
                        if (url.isNotBlank()) activity.downloadUrl(url)
                    }
                    "EXECUTE_SCRIPT" -> {
                        val script = payload?.optString("script") ?: ""
                        if (script.isNotBlank()) activity.executeScript(script)
                    }
                    "GET_SYSTEM_TELEMETRY" -> {
                        activity.sendSystemTelemetry()
                    }
                    "RECLAIM_MEMORY" -> {
                        activity.reclaimMemory()
                    }
                    "REQUEST_BIOMETRIC_AUTH" -> {
                        activity.requestBiometricAuth()
                    }
                    "CLEAR_BROWSING_DATA" -> {
                        activity.clearBrowsingData()
                    }
                    "SET_PROXY_CONFIG" -> {
                        val enabled = payload?.optBoolean("enabled", false) ?: false
                        val proxyType = payload?.optString("proxy_type", "direct") ?: "direct"
                        val server = payload?.optString("server", "") ?: ""
                        val bypassList = payload?.optString("bypass_list", "<local>;localhost;127.0.0.1") ?: "<local>;localhost;127.0.0.1"
                        activity.setProxyConfig(enabled, proxyType, server, bypassList)
                    }
                    "GET_PROXY_CONFIG" -> {
                        activity.getProxyConfig()
                    }
                    "SHARE_URL" -> {
                        val url = payload?.optString("url", "") ?: ""
                        val title = payload?.optString("title", "Mímir Browser") ?: "Mímir Browser"
                        activity.shareUrl(url, title)
                    }
                    "SET_REALM" -> {
                        val realm = payload?.optString("realm", "midgard") ?: "midgard"
                        activity.updateSystemBars(realm)
                    }
                    "SET_OVERLAY_STATE" -> {
                        val isOpen = payload?.optBoolean("isOpen", false) ?: false
                        activity.isOverlayOpen = isOpen
                    }
                    else -> {
                        Log.d("MimirNativeBridge", "Unhandled command type: $type")
                    }
                }
            } catch (e: Exception) {
                Log.e("MimirNativeBridge", "Failed to parse IPC message", e)
            }
        }
    }

    /**
     * Helper to safely execute JavaScript callback in the React Chrome context
     */
    fun evaluateJs(script: String) {
        mainHandler.post {
            chromeWebView.evaluateJavascript(script, null)
        }
    }
}
