package io.github.mimir.browser.privacy

import android.content.Context
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.webkit.ProxyConfig
import androidx.webkit.ProxyController
import androidx.webkit.WebViewFeature

object SvalinnProxyController {
    private const val TAG = "SvalinnProxyController"

    fun applyProxy(
        context: Context,
        enabled: Boolean,
        proxyType: String,
        server: String,
        bypassList: String = "<local>;localhost;127.0.0.1",
        onComplete: (success: Boolean) -> Unit
    ) {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.PROXY_OVERRIDE)) {
            Log.w(TAG, "Proxy override not supported on this Android system WebView.")
            onComplete(false)
            return
        }

        val executor = ContextCompat.getMainExecutor(context)
        val proxyController = ProxyController.getInstance()

        if (!enabled || proxyType == "direct" || server.isBlank()) {
            proxyController.clearProxyOverride(executor) {
                Log.d(TAG, "Direct network conduit restored.")
                onComplete(true)
            }
            return
        }

        try {
            val builder = ProxyConfig.Builder()

            when (proxyType) {
                "tor" -> {
                    // Default local Orbot port is 9050
                    builder.addProxyRule("socks://127.0.0.1:9050")
                }
                "socks5" -> {
                    val sanitized = server.replace("socks5://", "").replace("socks://", "")
                    builder.addProxyRule("socks://$sanitized")
                }
                "http" -> {
                    val sanitized = server.replace("http://", "")
                    builder.addProxyRule("http://$sanitized")
                }
                else -> {
                    builder.addProxyRule(server)
                }
            }

            // Add bypass rules
            for (bypass in bypassList.split(";")) {
                val trimmed = bypass.trim()
                if (trimmed.isNotBlank()) {
                    builder.addBypassRule(trimmed)
                }
            }

            proxyController.setProxyOverride(builder.build(), executor) {
                Log.d(TAG, "Svalinn Proxy Override applied successfully: $server")
                onComplete(true)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to apply Svalinn proxy configuration", e)
            onComplete(false)
        }
    }
}
