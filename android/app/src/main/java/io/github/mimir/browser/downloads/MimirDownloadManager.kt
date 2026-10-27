package io.github.mimir.browser.downloads

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Environment
import android.webkit.URLUtil
import android.widget.Toast
import org.json.JSONObject

object MimirDownloadManager {

    fun enqueueDownload(
        context: Context,
        url: String,
        userAgent: String? = null,
        contentDisposition: String? = null,
        mimeType: String? = null,
        contentLength: Long = -1,
        onStarted: (downloadId: Long, filename: String) -> Unit = { _, _ -> }
    ) {
        try {
            val filename = URLUtil.guessFileName(url, contentDisposition, mimeType)
            val request = DownloadManager.Request(Uri.parse(url)).apply {
                if (!mimeType.isNullOrBlank()) {
                    setMimeType(mimeType)
                }
                if (!userAgent.isNullOrBlank()) {
                    addRequestHeader("User-Agent", userAgent)
                }
                setDescription("Acquiring artifact from the Nine Realms...")
                setTitle(filename)
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename)
            }

            val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            val downloadId = dm.enqueue(request)

            Toast.makeText(context, "ᛗ Inscribing download: $filename", Toast.LENGTH_SHORT).show()
            onStarted(downloadId, filename)
        } catch (e: Exception) {
            Toast.makeText(context, "Failed to acquire artifact: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    fun enqueueDownload(
        context: Context,
        url: String,
        onStarted: (downloadId: Long, filename: String) -> Unit
    ) {
        enqueueDownload(
            context = context,
            url = url,
            userAgent = null,
            contentDisposition = null,
            mimeType = null,
            contentLength = -1,
            onStarted = onStarted
        )
    }
}
