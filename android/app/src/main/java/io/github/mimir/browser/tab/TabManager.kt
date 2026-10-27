package io.github.mimir.browser.tab

import android.content.Context
import android.graphics.Bitmap
import android.view.ViewGroup
import java.util.UUID

data class TabModel(
    val id: String,
    var url: String,
    var title: String,
    var realm: String,
    val webView: MimirWebView,
    var favicon: Bitmap? = null,
    var isLoading: Boolean = false,
    var progress: Int = 0
)

class TabManager(
    private val context: Context,
    private val viewportContainer: ViewGroup,
    private val callback: MimirWebViewCallback
) {
    private val tabs = mutableListOf<TabModel>()
    private var activeTabId: String? = null

    fun getTabs(): List<TabModel> = tabs.toList()

    fun getActiveTab(): TabModel? = tabs.find { it.id == activeTabId }

    fun createTab(initialUrl: String = "mimir://newtab", realm: String = "midgard"): TabModel {
        val tabId = "tab-${UUID.randomUUID().toString().take(8)}"
        val webView = MimirWebView(context, tabId, realm, callback)
        val tab = TabModel(
            id = tabId,
            url = initialUrl,
            title = if (initialUrl == "mimir://newtab") "Bifröst Portal" else "Sanctum Branch",
            realm = realm,
            webView = webView
        )

        tabs.add(tab)
        switchTab(tabId)

        if (initialUrl != "mimir://newtab" && initialUrl.isNotBlank()) {
            webView.loadUrl(initialUrl)
        }

        return tab
    }

    fun switchTab(tabId: String): TabModel? {
        val targetTab = tabs.find { it.id == tabId } ?: return null

        // 1. Pause previous active tab to save CPU/battery
        getActiveTab()?.let { prev ->
            prev.webView.onPause()
            viewportContainer.removeView(prev.webView)
        }

        // 2. Attach new active tab to the viewport container
        activeTabId = tabId
        targetTab.webView.onResume()

        if (targetTab.url == "mimir://newtab") {
            // Keep container hidden for internal dashboard
            viewportContainer.visibility = ViewGroup.GONE
        } else {
            viewportContainer.visibility = ViewGroup.VISIBLE
            if (targetTab.webView.parent == null) {
                viewportContainer.addView(
                    targetTab.webView,
                    ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                )
            }
        }

        return targetTab
    }

    fun closeTab(tabId: String): TabModel? {
        val idx = tabs.indexOfFirst { it.id == tabId }
        if (idx == -1) return null

        val removed = tabs.removeAt(idx)
        viewportContainer.removeView(removed.webView)
        removed.webView.destroy()

        // If closed active tab, switch to adjacent or create fallback
        if (activeTabId == tabId) {
            if (tabs.isNotEmpty()) {
                val nextIdx = (idx - 1).coerceAtLeast(0)
                switchTab(tabs[nextIdx].id)
            } else {
                return createTab("mimir://newtab", "midgard")
            }
        }

        return getActiveTab()
    }

    fun loadUrl(url: String) {
        val active = getActiveTab() ?: createTab(url)
        active.url = url
        if (url == "mimir://newtab") {
            viewportContainer.visibility = ViewGroup.GONE
        } else {
            viewportContainer.visibility = ViewGroup.VISIBLE
            if (active.webView.parent == null) {
                viewportContainer.addView(
                    active.webView,
                    ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                )
            }
            active.webView.loadUrl(url)
        }
    }
}
