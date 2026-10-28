package io.github.mimir.browser

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.webkit.ConsoleMessage
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebStorage
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import io.github.mimir.browser.bridge.MimirNativeBridge
import io.github.mimir.browser.downloads.MimirDownloadManager
import io.github.mimir.browser.haptics.MimirHaptics
import io.github.mimir.browser.privacy.SvalinnProxyController
import io.github.mimir.browser.tab.MimirWebViewCallback
import io.github.mimir.browser.tab.TabManager
import org.json.JSONArray
import org.json.JSONObject

class MainActivity : AppCompatActivity(), MimirWebViewCallback {

    private lateinit var rootLayout: FrameLayout
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var viewportContainer: FrameLayout
    private lateinit var chromeWebView: WebView
    private lateinit var fullscreenContainer: FrameLayout
    private lateinit var bridge: MimirNativeBridge
    private lateinit var tabManager: TabManager

    private var customVideoView: View? = null
    private var customViewCallback: WebChromeClient.CustomViewCallback? = null

    // Proxy State Cache
    private var isProxyEnabled = false
    private var proxyType = "direct"
    private var proxyServer = ""
    private var proxyBypassList = "<local>;localhost;127.0.0.1"

    var isOverlayOpen = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        rootLayout = findViewById(R.id.root_layout)
        swipeRefresh = findViewById(R.id.swipe_refresh)
        viewportContainer = findViewById(R.id.viewport_container)
        chromeWebView = findViewById(R.id.chrome_webview)
        fullscreenContainer = findViewById(R.id.fullscreen_custom_view_container)

        setupSwipeRefresh()
        setupViewportBounds()
        setupTabManager()
        setupChromeWebView()
        setupBackNavigation()
        updateSystemBars("midgard")

        // Handle URL launched from intent
        intent?.dataString?.let { incomingUrl ->
            if (incomingUrl.isNotBlank()) {
                tabManager.loadUrl(incomingUrl)
            }
        }
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        intent?.dataString?.let { incomingUrl ->
            if (incomingUrl.isNotBlank()) {
                tabManager.createTab(incomingUrl, "midgard")
                syncTabsToReact()
            }
        }
    }

    private fun setupSwipeRefresh() {
        swipeRefresh.apply {
            setColorSchemeColors(0xFF38BDF8.toInt(), 0xFFFBBF24.toInt()) // Bifröst Cyan & Valhalla Gold
            setProgressBackgroundColorSchemeColor(0xFF090D14.toInt()) // Sanctum Surface
            setOnRefreshListener {
                val active = tabManager.getActiveTab()
                if (active != null && active.url != "mimir://newtab") {
                    active.webView.reload()
                } else {
                    isRefreshing = false
                }
            }
        }
    }

    private fun setupTabManager() {
        tabManager = TabManager(this, viewportContainer, this)
        tabManager.createTab("mimir://newtab", "midgard")
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupChromeWebView() {
        bridge = MimirNativeBridge(this, chromeWebView)

        val assetLoader = WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .addPathHandler("/realms/", object : WebViewAssetLoader.PathHandler {
                override fun handle(path: String): WebResourceResponse? {
                    return try {
                        val inputStream = assets.open("dist/realms/$path")
                        val mimeType = if (path.endsWith(".mp4")) "video/mp4" else "image/jpeg"
                        val headers = mapOf(
                            "Access-Control-Allow-Origin" to "*",
                            "Access-Control-Allow-Methods" to "GET, OPTIONS",
                            "Access-Control-Allow-Headers" to "*"
                        )
                        WebResourceResponse(mimeType, "UTF-8", 200, "OK", headers, inputStream)
                    } catch (e: Exception) {
                        null
                    }
                }
            })
            .build()

        chromeWebView.apply {
            setBackgroundColor(Color.TRANSPARENT)
            setLayerType(View.LAYER_TYPE_HARDWARE, null)
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                cacheMode = WebSettings.LOAD_DEFAULT
            }
            addJavascriptInterface(bridge, "MimirNative")

            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest
                ): WebResourceResponse? {
                    val uri = request.url
                    if (uri.host == "appassets.androidplatform.net") {
                        val loaded = assetLoader.shouldInterceptRequest(uri)
                        if (loaded != null) return loaded

                        val path = uri.path?.trimStart('/') ?: ""
                        val candidates = listOf(
                            "dist/$path",
                            path,
                            "dist/${path.removePrefix("dist/")}",
                            "dist/${path.removePrefix("assets/dist/")}"
                        ).distinct()

                        for (candidate in candidates) {
                            try {
                                val isStream = assets.open(candidate)
                                val mime = when {
                                    candidate.endsWith(".html") -> "text/html"
                                    candidate.endsWith(".js") -> "application/javascript"
                                    candidate.endsWith(".css") -> "text/css"
                                    candidate.endsWith(".svg") -> "image/svg+xml"
                                    candidate.endsWith(".png") -> "image/png"
                                    candidate.endsWith(".jpg") || candidate.endsWith(".jpeg") -> "image/jpeg"
                                    candidate.endsWith(".webp") -> "image/webp"
                                    candidate.endsWith(".json") -> "application/json"
                                    candidate.endsWith(".mp4") -> "video/mp4"
                                    else -> "application/octet-stream"
                                }
                                val headers = mapOf(
                                    "Access-Control-Allow-Origin" to "*",
                                    "Access-Control-Allow-Methods" to "GET, OPTIONS",
                                    "Access-Control-Allow-Headers" to "*"
                                )
                                return WebResourceResponse(mime, "UTF-8", 200, "OK", headers, isStream)
                            } catch (_: Exception) {}
                        }
                    }
                    return super.shouldInterceptRequest(view, request)
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    Log.d("MimirChromeWebView", "Chrome UI mounted from $url")
                    syncTabsToReact()
                    sendSystemTelemetry()
                    getProxyConfig()
                }

                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: WebResourceError?
                ) {
                    super.onReceivedError(view, request, error)
                    Log.e("MimirChromeWebView", "Failed to load ${request?.url}: ${error?.description}")
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                    consoleMessage?.let {
                        Log.d("MimirChromeConsole", "[${it.messageLevel()}] ${it.message()} -- at ${it.sourceId()}:${it.lineNumber()}")
                    }
                    return true
                }
            }

            // Load local bundled React build via secure HTTPS asset loader domain
            loadUrl("https://appassets.androidplatform.net/assets/dist/index.html")
        }

        setupChromeTouchPassthrough()
    }

    private fun getHeaderHeight(): Int {
        val density = resources.displayMetrics.density
        val insets = ViewCompat.getRootWindowInsets(rootLayout)
        val statusBarHeight = insets?.getInsets(WindowInsetsCompat.Type.statusBars())?.top ?: (24 * density).toInt()
        return statusBarHeight + (40 * density).toInt()
    }

    private fun getDockHeight(): Int {
        val density = resources.displayMetrics.density
        val insets = ViewCompat.getRootWindowInsets(rootLayout)
        val navBarHeight = insets?.getInsets(WindowInsetsCompat.Type.navigationBars())?.bottom ?: (24 * density).toInt()
        return navBarHeight + (56 * density).toInt()
    }

    private fun updateViewportMargins() {
        val headerHeight = getHeaderHeight()
        val dockHeight = getDockHeight()
        val params = swipeRefresh.layoutParams as? FrameLayout.LayoutParams
        if (params != null) {
            if (params.topMargin != headerHeight || params.bottomMargin != dockHeight) {
                params.topMargin = headerHeight
                params.bottomMargin = dockHeight
                swipeRefresh.layoutParams = params
                swipeRefresh.requestLayout()
            }
        }
    }

    private fun setupViewportBounds() {
        ViewCompat.setOnApplyWindowInsetsListener(rootLayout) { _, insets ->
            updateViewportMargins()
            insets
        }
        updateViewportMargins()
    }

    private var isTrackingViewportTouch = false

    @SuppressLint("ClickableViewAccessibility")
    private fun setupChromeTouchPassthrough() {
        chromeWebView.setOnTouchListener { _, event ->
            // If viewing internal home (mimir://newtab) or an overlay is open, chrome handles all touches
            if (viewportContainer.visibility != View.VISIBLE || isOverlayOpen) {
                isTrackingViewportTouch = false
                return@setOnTouchListener false
            }

            val headerHeight = getHeaderHeight()
            val dockHeight = getDockHeight()
            val headerCutoff = headerHeight.toFloat()
            val dockCutoff = (rootLayout.height - dockHeight).toFloat()

            if (event.action == MotionEvent.ACTION_DOWN) {
                isTrackingViewportTouch = (event.y in headerCutoff..dockCutoff)
            }

            if (isTrackingViewportTouch) {
                val localEvent = MotionEvent.obtain(event)
                localEvent.offsetLocation(0f, -headerHeight.toFloat())
                val handled = swipeRefresh.dispatchTouchEvent(localEvent)
                localEvent.recycle()

                if (event.action == MotionEvent.ACTION_UP || event.action == MotionEvent.ACTION_CANCEL) {
                    isTrackingViewportTouch = false
                }
                return@setOnTouchListener (handled || event.action == MotionEvent.ACTION_DOWN)
            }

            false
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                // 1. If in HTML5 full-screen video, dismiss it first
                if (customVideoView != null) {
                    onHideCustomView()
                    return
                }

                // 2. Active Tab Back navigation
                val activeTab = tabManager.getActiveTab()
                if (activeTab != null && activeTab.webView.canGoBack()) {
                    MimirHaptics.performClick(this@MainActivity)
                    activeTab.webView.goBack()
                } else if (activeTab != null && activeTab.url != "mimir://newtab") {
                    MimirHaptics.performClick(this@MainActivity)
                    navigateTo("mimir://newtab")
                } else {
                    // Let default system back minimize app
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                    isEnabled = true
                }
            }
        })
    }

    // --- Tab and Navigation Handlers ---

    fun navigateTo(url: String) {
        runOnUiThread {
            MimirHaptics.performClick(this)
            tabManager.loadUrl(url)
            syncTabsToReact()
        }
    }

    fun reloadActiveTab() {
        runOnUiThread {
            MimirHaptics.performClick(this)
            tabManager.getActiveTab()?.webView?.reload()
        }
    }

    fun goBackActiveTab() {
        runOnUiThread {
            tabManager.getActiveTab()?.webView?.let {
                if (it.canGoBack()) {
                    MimirHaptics.performClick(this)
                    it.goBack()
                }
            }
        }
    }

    fun goForwardActiveTab() {
        runOnUiThread {
            tabManager.getActiveTab()?.webView?.let {
                if (it.canGoForward()) {
                    MimirHaptics.performClick(this)
                    it.goForward()
                }
            }
        }
    }

    fun createNewTab(url: String, realm: String) {
        runOnUiThread {
            MimirHaptics.performClick(this)
            tabManager.createTab(url, realm)
            updateSystemBars(realm)
            syncTabsToReact()
        }
    }

    fun closeTab(tabId: String) {
        runOnUiThread {
            MimirHaptics.performClick(this)
            tabManager.closeTab(tabId)
            syncTabsToReact()
        }
    }

    fun switchTab(tabId: String) {
        runOnUiThread {
            MimirHaptics.performClick(this)
            val active = tabManager.switchTab(tabId)
            active?.let { updateSystemBars(it.realm) }
            syncTabsToReact()
        }
    }

    fun clearBrowsingData() {
        runOnUiThread {
            MimirHaptics.performRunicPulse(this)
            WebStorage.getInstance().deleteAllData()
            CookieManager.getInstance().removeAllCookies(null)
            chromeWebView.clearCache(true)
            tabManager.getTabs().forEach { it.webView.clearCache(true) }
            bridge.evaluateJs("window.__mimirOnBrowsingDataCleared && window.__mimirOnBrowsingDataCleared();")
        }
    }

    fun setProxyConfig(enabled: Boolean, type: String, server: String, bypassList: String) {
        runOnUiThread {
            isProxyEnabled = enabled
            proxyType = type
            proxyServer = server
            proxyBypassList = bypassList

            SvalinnProxyController.applyProxy(this, enabled, type, server, bypassList) { success ->
                MimirHaptics.performRunicPulse(this)
                getProxyConfig()
            }
        }
    }

    fun getProxyConfig() {
        runOnUiThread {
            val json = JSONObject().apply {
                put("enabled", isProxyEnabled)
                put("proxy_type", proxyType)
                put("server", proxyServer)
                put("bypass_list", proxyBypassList)
            }
            bridge.evaluateJs("window.__mimirOnProxyConfig && window.__mimirOnProxyConfig($json);")
        }
    }

    fun sendSystemTelemetry() {
        val runtime = Runtime.getRuntime()
        val totalMemory = runtime.totalMemory()
        val freeMemory = runtime.freeMemory()
        val usedMemory = totalMemory - freeMemory

        val json = JSONObject().apply {
            put("systemTotalRamMb", totalMemory / (1024 * 1024))
            put("systemUsedRamMb", usedMemory / (1024 * 1024))
            put("browserWorkingSetMb", usedMemory / (1024 * 1024))
            put("activeTabsCount", tabManager.getTabs().size)
        }

        bridge.evaluateJs("window.__mimirOnSystemTelemetry && window.__mimirOnSystemTelemetry($json);")
    }

    fun downloadUrl(url: String) {
        runOnUiThread {
            MimirDownloadManager.enqueueDownload(this, url) { downloadId: Long, filename: String ->
                onDownloadStarted(tabManager.getActiveTab()?.id ?: "", downloadId, filename)
            }
        }
    }

    fun executeScript(script: String) {
        runOnUiThread {
            tabManager.getActiveTab()?.webView?.evaluateJavascript(script, null)
        }
    }

    fun reclaimMemory() {
        runOnUiThread {
            MimirHaptics.performRunicPulse(this)
            System.gc()
            Runtime.getRuntime().gc()
            tabManager.getTabs().forEach {
                if (it.id != tabManager.getActiveTab()?.id) {
                    it.webView.onPause()
                    it.webView.freeMemory()
                }
            }
            sendSystemTelemetry()
            bridge.evaluateJs("window.__mimirOnMemoryReclaimed && window.__mimirOnMemoryReclaimed({ bytesReclaimed: 0 });")
        }
    }

    fun requestBiometricAuth() {
        runOnUiThread {
            val executor = ContextCompat.getMainExecutor(this)
            val prompt = BiometricPrompt(this, executor, object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    MimirHaptics.performRunicPulse(this@MainActivity)
                    bridge.evaluateJs("window.__mimirOnBiometricResult && window.__mimirOnBiometricResult(true, null);")
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    val errEscaped = JSONObject.quote(errString.toString())
                    bridge.evaluateJs("window.__mimirOnBiometricResult && window.__mimirOnBiometricResult(false, $errEscaped);")
                }

                override fun onAuthenticationFailed() {
                    bridge.evaluateJs("window.__mimirOnBiometricResult && window.__mimirOnBiometricResult(false, 'Biometric verification failed');")
                }
            })

            val promptInfo = BiometricPrompt.PromptInfo.Builder()
                .setTitle("Fafnir's Treasury Protection")
                .setSubtitle("Prove your identity to unlock the vault")
                .setNegativeButtonText("Use Passphrase")
                .build()

            prompt.authenticate(promptInfo)
        }
    }

    private fun syncTabsToReact() {
        val tabsArray = JSONArray()
        for (tab in tabManager.getTabs()) {
            val obj = JSONObject().apply {
                put("id", tab.id)
                put("url", tab.url)
                put("title", tab.title)
                put("realm", tab.realm)
            }
            tabsArray.put(obj)
        }
        val activeId = JSONObject.quote(tabManager.getActiveTab()?.id ?: "")
        bridge.evaluateJs("window.__mimirOnTabsSync && window.__mimirOnTabsSync($tabsArray, $activeId);")
    }

    // --- MimirWebViewCallback implementation ---

    override fun onPageStarted(tabId: String, url: String) {
        val active = tabManager.getActiveTab()
        if (active?.id == tabId) {
            active.url = url
            val json = JSONObject().apply {
                put("tabId", tabId)
                put("url", url)
                put("isLoading", true)
            }
            bridge.evaluateJs("window.__mimirOnNavigationState && window.__mimirOnNavigationState($json);")
        }
    }

    override fun onPageFinished(tabId: String, url: String, title: String?) {
        swipeRefresh.isRefreshing = false
        val active = tabManager.getActiveTab()
        if (active?.id == tabId) {
            active.url = url
            title?.let { active.title = it }
            val json = JSONObject().apply {
                put("tabId", tabId)
                put("url", url)
                put("title", title ?: url)
                put("isLoading", false)
                put("canGoBack", active.webView.canGoBack())
                put("canGoForward", active.webView.canGoForward())
            }
            bridge.evaluateJs("window.__mimirOnNavigationState && window.__mimirOnNavigationState($json);")
        }
    }

    override fun onProgressChanged(tabId: String, progress: Int) {
        val active = tabManager.getActiveTab()
        if (active?.id == tabId) {
            bridge.evaluateJs("window.__mimirOnLoadProgress && window.__mimirOnLoadProgress($progress);")
        }
    }

    override fun onTitleChanged(tabId: String, title: String) {
        val tab = tabManager.getTabs().find { it.id == tabId }
        tab?.title = title
        syncTabsToReact()
    }

    override fun onFaviconReceived(tabId: String, icon: Bitmap?) {
        // Reserved for favicon synchronization
    }

    override fun onTrackerBlocked(tabId: String, domain: String, url: String) {
        MimirHaptics.performRunicPulse(this)
        val json = JSONObject().apply {
            put("domain", domain)
            put("category", "advertising")
            put("url", url)
        }
        bridge.evaluateJs("window.__mimirOnTrackerBlocked && window.__mimirOnTrackerBlocked($json);")
    }

    override fun onDownloadStarted(tabId: String, id: Long, filename: String) {
        MimirHaptics.performClick(this)
        val json = JSONObject().apply {
            put("id", id.toString())
            put("filename", filename)
            put("url", "")
            put("path", filename)
        }
        bridge.evaluateJs("window.__mimirOnDownloadStarted && window.__mimirOnDownloadStarted($json);")
    }

    // --- HTML5 Fullscreen Video Handling ---

    override fun onShowCustomView(view: View, callback: WebChromeClient.CustomViewCallback) {
        if (customVideoView != null) {
            callback.onCustomViewHidden()
            return
        }

        customVideoView = view
        customViewCallback = callback

        swipeRefresh.visibility = View.GONE
        chromeWebView.visibility = View.GONE
        fullscreenContainer.visibility = View.VISIBLE
        fullscreenContainer.addView(view, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))

        // Enter immersive mode
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
            window.insetsController?.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            )
        }
    }

    override fun onHideCustomView() {
        if (customVideoView == null) return

        fullscreenContainer.removeView(customVideoView)
        fullscreenContainer.visibility = View.GONE
        customVideoView = null
        customViewCallback?.onCustomViewHidden()
        customViewCallback = null

        swipeRefresh.visibility = View.VISIBLE
        chromeWebView.visibility = View.VISIBLE

        // Exit immersive mode
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.show(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_VISIBLE
        }
    }

    override fun onContextMenuRequested(tabId: String, type: String, targetUrl: String) {
        val json = JSONObject().apply {
            put("type", type)
            put("targetUrl", targetUrl)
            put("tabId", tabId)
        }
        bridge.evaluateJs("window.__mimirOnNativeContextMenu && window.__mimirOnNativeContextMenu($json);")
    }

    fun shareUrl(url: String, title: String) {
        runOnUiThread {
            MimirHaptics.performClick(this)
            val sendIntent = Intent().apply {
                action = Intent.ACTION_SEND
                putExtra(Intent.EXTRA_TEXT, url)
                putExtra(Intent.EXTRA_TITLE, title)
                type = "text/plain"
            }
            val shareIntent = Intent.createChooser(sendIntent, "Share with Bifröst Conduit")
            startActivity(shareIntent)
        }
    }

    fun updateSystemBars(realmId: String) {
        runOnUiThread {
            val statusBarColor = when (realmId) {
                "asgard" -> 0xFF141006.toInt()
                "vanaheim" -> 0xFF05140A.toInt()
                "alfheim" -> 0xFF0A1218.toInt()
                "jotunheim" -> 0xFF06101E.toInt()
                "muspelheim" -> 0xFF180A05.toInt()
                "niflheim" -> 0xFF0E1016.toInt()
                "nidavellir" -> 0xFF140D08.toInt()
                "helheim" -> 0xFF16060E.toInt()
                else -> 0xFF05070A.toInt()
            }
            window.statusBarColor = statusBarColor
            window.navigationBarColor = 0xFF030508.toInt()

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                window.insetsController?.setSystemBarsAppearance(
                    0,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS or WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
                )
            } else {
                @Suppress("DEPRECATION")
                window.decorView.systemUiVisibility = window.decorView.systemUiVisibility and
                    (View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR).inv()
            }
        }
    }
}
