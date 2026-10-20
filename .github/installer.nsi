; Mímir Browser NSIS Installer Script
Unicode True
!include "MUI2.nsh"

Name "Mímir Browser"
OutFile "mimir-setup.exe"
InstallDir "$LOCALAPPDATA\Programs\Mimir"
RequestExecutionLevel user

!define MUI_ABORTWARNING
; !define MUI_ICON "..\public\favicon.ico"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "Mimir" SecMimir
  SetOutPath "$INSTDIR"
  
  ; Executable
  File "..\src-rust\target\release\mimir-core.exe"
  Rename "$INSTDIR\mimir-core.exe" "$INSTDIR\mimir.exe"

  ; Frontend built bundle
  SetOutPath "$INSTDIR\dist"
  File /r "..\dist\*.*"

  ; Legal & documentation
  SetOutPath "$INSTDIR"
  File "..\LICENSE"
  File "..\README.md"

  ; Create shortcuts
  CreateDirectory "$SMPROGRAMS\Mímir"
  CreateShortcut "$SMPROGRAMS\Mímir\Mímir Browser.lnk" "$INSTDIR\mimir.exe" "" "$INSTDIR\mimir.exe" 0
  CreateShortcut "$DESKTOP\Mímir Browser.lnk" "$INSTDIR\mimir.exe" "" "$INSTDIR\mimir.exe" 0

  ; Create uninstaller
  WriteUninstaller "$INSTDIR\uninstall.exe"
  CreateShortcut "$SMPROGRAMS\Mímir\Uninstall Mímir.lnk" "$INSTDIR\uninstall.exe"
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\Mímir Browser.lnk"
  Delete "$SMPROGRAMS\Mímir\Mímir Browser.lnk"
  Delete "$SMPROGRAMS\Mímir\Uninstall Mímir.lnk"
  RMDir "$SMPROGRAMS\Mímir"

  RMDir /r "$INSTDIR\dist"
  Delete "$INSTDIR\mimir.exe"
  Delete "$INSTDIR\LICENSE"
  Delete "$INSTDIR\README.md"
  Delete "$INSTDIR\uninstall.exe"
  RMDir "$INSTDIR"
SectionEnd
