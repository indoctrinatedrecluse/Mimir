package io.github.mimir.browser

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.WebSettings
import android.webkit.WebStorage
import android.webkit.WebView
import android.widget.FrameLayout
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import io.github.mimir.browser.bridge.MimirNativeBridge
import io.github.mimir.browser.tab.MimirWebViewCallback
import io.github.mimir.browser.tab.TabManager
import org.json.JSONArray
import org.json.JSONObject

class MainActivity : AppCompatActivity(), MimirWebViewCallback {

    private lateinit var rootLayout: FrameLayout
    private lateinit var viewportContainer: FrameLayout
    private lateinit var chromeWebView: WebView
    private lateinit var bridge: MimirNativeBridge
    private lateinit var tabManager: TabManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        rootLayout = findViewById(R.id.root_layout)
        viewportContainer = findViewById(R.id.viewport_container)
        chromeWebView = findViewById(R.id.chrome_webview)

        setupTabManager()
        setupChromeWebView()
        setupBackNavigation()

        // Handle URL launched from intent
        intent?.dataString?.let { incomingUrl ->
            if (incomingUrl.isNotBlank()) {
                tabManager.loadUrl(incomingUrl)
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

        chromeWebView.apply {
            setBackgroundColor(0) // Transparent so viewport is visible behind if desired
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                cacheMode = WebSettings.LOAD_DEFAULT
            }
            addJavascriptInterface(bridge, "MimirNative")

            // Load local bundled React build
            loadUrl("file:///android_asset/dist/index.html")
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val activeTab = tabManager.getActiveTab()
                if (activeTab != null && activeTab.webView.canGoBack()) {
                    activeTab.webView.goBack()
                } else if (activeTab != null && activeTab.url != "mimir://newtab") {
                    navigateTo("mimir://newtab")
                } else {
                    // Let default system back handle (minimizes app)
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
            tabManager.loadUrl(url)
            syncTabsToReact()
        }
    }

    fun reloadActiveTab() {
        runOnUiThread {
            tabManager.getActiveTab()?.webView?.reload()
        }
    }

    fun goBackActiveTab() {
        runOnUiThread {
            tabManager.getActiveTab()?.webView?.let {
                if (it.canGoBack()) it.goBack()
            }
        }
    }

    fun goForwardActiveTab() {
        runOnUiThread {
            tabManager.getActiveTab()?.webView?.let {
                if (it.canGoForward()) it.goForward()
            }
        }
    }

    fun createNewTab(url: String, realm: String) {
        runOnUiThread {
            tabManager.createTab(url, realm)
            syncTabsToReact()
        }
    }

    fun closeTab(tabId: String) {
        runOnUiThread {
            tabManager.closeTab(tabId)
            syncTabsToReact()
        }
    }

    fun switchTab(tabId: String) {
        runOnUiThread {
            tabManager.switchTab(tabId)
            syncTabsToReact()
        }
    }

    fun clearBrowsingData() {
        runOnUiThread {
            WebStorage.getInstance().deleteAllData()
            CookieManager.getInstance().removeAllCookies(null)
            chromeWebView.clearCache(true)
            tabManager.getTabs().forEach { it.webView.clearCache(true) }
            bridge.evaluateJs("window.__mimirOnBrowsingDataCleared && window.__mimirOnBrowsingDataCleared();")
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

    fun requestBiometricAuth() {
        runOnUiThread {
            val executor = ContextCompat.getMainExecutor(this)
            val prompt = BiometricPrompt(this, executor, object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
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
        // Future: generate data URI or sync favicon
    }

    override fun onTrackerBlocked(tabId: String, domain: String, url: String) {
        val json = JSONObject().apply {
            put("domain", domain)
            put("category", "advertising")
            put("url", url)
        }
        bridge.evaluateJs("window.__mimirOnTrackerBlocked && window.__mimirOnTrackerBlocked($json);")
    }
}
