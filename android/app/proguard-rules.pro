# Keep JavaScript Interface methods so ProGuard does not strip or rename them
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keepattributes JavascriptInterface
-keepattributes *Annotation*

# Keep WebKit and Biometrics
-keep class androidx.webkit.** { *; }
-keep class androidx.biometric.** { *; }
