; Mimir Browser NSIS Installer Script
Unicode True
!include "MUI2.nsh"
!include "LogicLib.nsh"

Name "Mimir Browser"
OutFile "..\mimir-setup.exe"
InstallDir "$LOCALAPPDATA\Programs\Mimir"
RequestExecutionLevel user

!define MUI_ABORTWARNING
!define MUI_ICON "..\mimir.ico"
!define MUI_UNICON "..\mimir.ico"

; Launch program option on finish page
!define MUI_FINISHPAGE_RUN "$INSTDIR\mimir.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch Mimir Browser"
!define MUI_FINISHPAGE_RUN_CHECKED

; Installer Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Uninstaller Pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "Mimir Browser (required)" SecMimir
  SectionIn RO
  SetOutPath "$INSTDIR"
  
  ; Executable
  File "..\src-rust\target\release\mimir-core.exe"
  Rename "$INSTDIR\mimir-core.exe" "$INSTDIR\mimir.exe"

  ; Frontend built bundle
  SetOutPath "$INSTDIR\dist"
  File /r "..\dist\*.*"

  ; Legal, icon & documentation
  SetOutPath "$INSTDIR"
  File "..\mimir.ico"
  File "..\LICENSE"
  File "..\README.md"

  ; Check if WebView2 Runtime is installed; if missing, install via bundled Evergreen bootstrapper
  ReadRegStr $0 HKLM "SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
  ${If} $0 == ""
    ReadRegStr $0 HKCU "SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
  ${EndIf}
  ${If} $0 == ""
    ReadRegStr $0 HKLM "SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
  ${EndIf}
  ${If} $0 == ""
    ReadRegStr $0 HKLM "SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-9447-402A-8377-800732A6A5E2}" "pv"
  ${EndIf}
  ${If} $0 == ""
    ReadRegStr $0 HKCU "SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-9447-402A-8377-800732A6A5E2}" "pv"
  ${EndIf}

  ${If} $0 == ""
    DetailPrint "Microsoft Edge WebView2 not found. Installing Evergreen Runtime..."
    IfFileExists "..\MicrosoftEdgeWebview2Setup.exe" 0 +4
      File "..\MicrosoftEdgeWebview2Setup.exe"
      ExecWait '"$INSTDIR\MicrosoftEdgeWebview2Setup.exe" /silent /install' $1
      Delete "$INSTDIR\MicrosoftEdgeWebview2Setup.exe"
      DetailPrint "WebView2 setup exited with code $1"
  ${Else}
    DetailPrint "Microsoft Edge WebView2 detected ($0)."
  ${EndIf}

  ; Create Start Menu shortcuts
  CreateDirectory "$SMPROGRAMS\Mimir"
  CreateShortcut "$SMPROGRAMS\Mimir\Mimir Browser.lnk" "$INSTDIR\mimir.exe" "" "$INSTDIR\mimir.ico" 0

  ; Create uninstaller
  WriteUninstaller "$INSTDIR\uninstall.exe"
  CreateShortcut "$SMPROGRAMS\Mimir\Uninstall Mimir.lnk" "$INSTDIR\uninstall.exe" "" "$INSTDIR\uninstall.exe" 0
SectionEnd

Section "Create Desktop Shortcut" SecDesktop
  CreateShortcut "$DESKTOP\Mimir Browser.lnk" "$INSTDIR\mimir.exe" "" "$INSTDIR\mimir.ico" 0
SectionEnd

; Component Descriptions
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecMimir} "Core Mimir Browser binaries, UI sanctuary, and Start Menu entries."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecDesktop} "Create a shortcut icon for Mimir Browser on your Desktop."
!insertmacro MUI_FUNCTION_DESCRIPTION_END

Section "Uninstall"
  Delete "$DESKTOP\Mimir Browser.lnk"
  Delete "$DESKTOP\Mímir Browser.lnk"
  Delete "$SMPROGRAMS\Mimir\Mimir Browser.lnk"
  Delete "$SMPROGRAMS\Mimir\Uninstall Mimir.lnk"
  RMDir "$SMPROGRAMS\Mimir"
  Delete "$SMPROGRAMS\Mímir\Mímir Browser.lnk"
  Delete "$SMPROGRAMS\Mímir\Uninstall Mímir.lnk"
  RMDir "$SMPROGRAMS\Mímir"

  RMDir /r "$INSTDIR\dist"
  Delete "$INSTDIR\mimir.exe"
  Delete "$INSTDIR\mimir.ico"
  Delete "$INSTDIR\LICENSE"
  Delete "$INSTDIR\README.md"
  Delete "$INSTDIR\uninstall.exe"
  RMDir "$INSTDIR"
SectionEnd
