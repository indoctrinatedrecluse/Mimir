package io.github.mimir.browser.tab

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.net.http.SslError
import android.os.Build
import android.view.View
import android.webkit.SslErrorHandler
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import io.github.mimir.browser.downloads.MimirDownloadManager
import io.github.mimir.browser.haptics.MimirHaptics
import io.github.mimir.browser.privacy.SvalinnAdBlocker
import java.io.ByteArrayInputStream

interface MimirWebViewCallback {
    fun onPageStarted(tabId: String, url: String)
    fun onPageFinished(tabId: String, url: String, title: String?)
    fun onProgressChanged(tabId: String, progress: Int)
    fun onTitleChanged(tabId: String, title: String)
    fun onFaviconReceived(tabId: String, icon: Bitmap?)
    fun onTrackerBlocked(tabId: String, domain: String, url: String)
    fun onDownloadStarted(tabId: String, id: Long, filename: String)
    fun onShowCustomView(view: View, callback: WebChromeClient.CustomViewCallback)
    fun onHideCustomView()
    fun onContextMenuRequested(tabId: String, type: String, targetUrl: String)
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
        setupDownloads()
        setupContextMenu()
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

            override fun onShowCustomView(view: View?, customCallback: CustomViewCallback?) {
                super.onShowCustomView(view, customCallback)
                if (view != null && customCallback != null) {
                    callback?.onShowCustomView(view, customCallback)
                }
            }

            override fun onHideCustomView() {
                super.onHideCustomView()
                callback?.onHideCustomView()
            }
        }
    }

    private fun setupDownloads() {
        setDownloadListener { url, userAgent, contentDisposition, mimetype, contentLength ->
            MimirDownloadManager.enqueueDownload(
                context,
                url,
                userAgent,
                contentDisposition,
                mimetype,
                contentLength
            ) { downloadId, filename ->
                callback?.onDownloadStarted(tabId, downloadId, filename)
            }
        }
    }

    private fun setupContextMenu() {
        setOnLongClickListener {
            val result = hitTestResult
            val extra = result.extra ?: ""
            when (result.type) {
                HitTestResult.SRC_ANCHOR_TYPE,
                HitTestResult.SRC_IMAGE_ANCHOR_TYPE -> {
                    MimirHaptics.performClick(context)
                    callback?.onContextMenuRequested(tabId, "link", extra)
                    true
                }
                HitTestResult.IMAGE_TYPE -> {
                    MimirHaptics.performClick(context)
                    callback?.onContextMenuRequested(tabId, "image", extra)
                    true
                }
                else -> false
            }
        }
    }
}
