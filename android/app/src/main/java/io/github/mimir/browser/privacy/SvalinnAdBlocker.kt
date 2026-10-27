package io.github.mimir.browser.privacy

import android.net.Uri
import java.util.Locale

/**
 * Svalinn Ad & Tracker Sentinel for Android
 * Intercepts third-party telemetry, ads, and beacons prior to network dispatch.
 */
object SvalinnAdBlocker {
    private var isEnabled = true

    // Common tracking and ad networks
    private val BLOCKED_HOSTS = hashSetOf(
        "doubleclick.net",
        "googleadservices.com",
        "googlesyndication.com",
        "adnxs.com",
        "criteo.com",
        "taboola.com",
        "outbrain.com",
        "scorecardresearch.com",
        "quantserve.com",
        "facebook.net",
        "connect.facebook.net",
        "analytics.twitter.com",
        "pixel.advertising.com",
        "adservice.google.com",
        "pagead2.googlesyndication.com",
        "adsystem.com",
        "amazon-adsystem.com",
        "rubiconproject.com",
        "pubmatic.com",
        "openx.net",
        "casalemedia.com",
        "advertising.com",
        "adcolony.com",
        "unityads.unity3d.com",
        "applifier.com",
        "chartboost.com",
        "vungle.com",
        "ironsrc.com",
        "appsflyer.com",
        "adjust.com",
        "branch.io"
    )

    fun setEnabled(enabled: Boolean) {
        isEnabled = enabled
    }

    fun isEnabled(): Boolean = isEnabled

    /**
     * Determines whether the given URI should be blocked by the Svalinn ward.
     */
    fun isBlocked(uri: Uri?): Boolean {
        if (!isEnabled || uri == null) return false
        val host = uri.host?.lowercase(Locale.ROOT) ?: return false

        if (BLOCKED_HOSTS.contains(host)) return true

        // Domain suffix match (e.g. *.doubleclick.net)
        for (blocked in BLOCKED_HOSTS) {
            if (host.endsWith(".$blocked")) {
                return true
            }
        }

        // Generic ad keywords in path
        val path = uri.path?.lowercase(Locale.ROOT) ?: ""
        if (path.contains("/ads/") || path.contains("/adsvc/") || path.contains("/telemetry/")) {
            return true
        }

        return false
    }
}
