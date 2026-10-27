package io.github.mimir.browser.tab

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.net.http.SslError
import android.os.Build
import android.webkit.SslErrorHandler
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import io.github.mimir.browser.privacy.SvalinnAdBlocker
import java.io.ByteArrayInputStream

interface MimirWebViewCallback {
    fun onPageStarted(tabId: String, url: String)
    fun onPageFinished(tabId: String, url: String, title: String?)
    fun onProgressChanged(tabId: String, progress: Int)
    fun onTitleChanged(tabId: String, title: String)
    fun onFaviconReceived(tabId: String, icon: Bitmap?)
    fun onTrackerBlocked(tabId: String, domain: String, url: String)
}

@SuppressLint("SetJavaScriptEnabled")
class MimirWebView(
    context: Context,
    val tabId: String,
    var realmId: String = "midgard",
    var callback: MimirWebViewCallback? = null
) : WebView(context) {

    init {
        setupSettings()
        setupClients()
    }

    private fun setupSettings() {
        settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            useWideViewPort = true
            loadWithOverviewMode = true
            setSupportZoom(true)
            builtInZoomControls = true
            displayZoomControls = false
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            cacheMode = WebSettings.LOAD_DEFAULT

            // Enable safe browsing
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                safeBrowsingEnabled = true
            }

            // Mobile User-Agent tuning
            val defaultUa = userAgentString
            userAgentString = "$defaultUa MimirMobile/0.9.0 (Sovereign Citadel)"
        }
    }

    private fun setupClients() {
        webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest?
            ): WebResourceResponse? {
                val uri = request?.url
                if (SvalinnAdBlocker.isBlocked(uri)) {
                    val domain = uri?.host ?: "unknown"
                    callback?.onTrackerBlocked(tabId, domain, uri?.toString() ?: "")
                    // Return empty response to drop the connection
                    return WebResourceResponse("text/plain", "UTF-8", ByteArrayInputStream(ByteArray(0)))
                }
                return super.shouldInterceptRequest(view, request)
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                url?.let { callback?.onPageStarted(tabId, it) }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                url?.let { callback?.onPageFinished(tabId, it, view?.title) }
            }

            override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: SslError?) {
                // Deny untrusted certs by default for sovereign security
                handler?.cancel()
            }
        }

        webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                callback?.onProgressChanged(tabId, newProgress)
            }

            override fun onReceivedTitle(view: WebView?, title: String?) {
                super.onReceivedTitle(view, title)
                title?.let { callback?.onTitleChanged(tabId, it) }
            }

            override fun onReceivedIcon(view: WebView?, icon: Bitmap?) {
                super.onReceivedIcon(view, icon)
                callback?.onFaviconReceived(tabId, icon)
            }
        }
    }
}
