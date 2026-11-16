# Adventure Forge (`TextAdventure`)

A Choose-Your-Own-Adventure (CYOA) story builder and interactive reader built with **bare React Native (`0.88.1`)** and native Android (Gradle / Android Studio) — no Expo required.

## Prerequisites

- **Node.js** `>= 22.11.0`
- **Android Studio** (includes Android SDK and JetBrains Runtime JDK)
- On Windows, if `JAVA_HOME` and `ANDROID_HOME` are not set globally:
  - `JAVA_HOME`: `C:\Program Files\Android\Android Studio\jbr`
  - `ANDROID_HOME`: `%LOCALAPPDATA%\Android\Sdk`
  - `android/local.properties` (not committed to git) should point `sdk.dir` to your Android SDK path, e.g.:
    ```properties
    sdk.dir=C\:\\Users\\<your-user>\\AppData\\Local\\Android\\Sdk
    ```

## Getting Started

Install JavaScript dependencies:

```sh
npm install
```

Run TypeScript typechecking:

```sh
npm run typecheck
```

## Running in Development

1. Start the Metro bundler:
   ```sh
   npm start
   ```
2. In another terminal, build and launch on a connected Android device or emulator:
   ```sh
   npm run android
   ```

You can also open the `android/` folder directly in **Android Studio** to sync Gradle, run on an emulator/device, or build APKs via **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

## Building an APK for Phone Testing

### Standalone Release APK (recommended for testing on phones)

Builds a self-contained APK with the JavaScript bundle embedded (no Metro server needed):

```powershell
# PowerShell (if JAVA_HOME / ANDROID_HOME are not already set)
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

npm run apk:release
```

Output:
- `android/app/build/outputs/apk/release/app-release.apk`

> **Note:** `android/app/build.gradle` currently signs the `release` build type with the debug keystore (`debug.keystore`) so it can be installed directly on test phones. Before publishing to the Google Play Store, configure a proper release signing keystore.

### Debug APK

```sh
npm run apk:debug
```

Output:
- `android/app/build/outputs/apk/debug/app-debug.apk`

### Installing on a Phone

Via `adb` (USB debugging enabled):

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r "android\app\build\outputs\apk\release\app-release.apk"
```

Or copy `app-release.apk` to your phone and open it to install.

## Project Structure

- `App.tsx` — App root: initializes SQLite, seeds the sample story if empty, and configures React Navigation (`Library`, `Editor`, `Play`).
- `index.js` — React Native entry point (`AppRegistry.registerComponent`).
- `android/` — Native Android Gradle project.
- `src/app/` — Screen components:
  - `index.tsx` — Story Library (create, import/export `.cyoa.json`, launch editor or reader).
  - `editor/[storyId].tsx` — Node-graph and outline story editor with validation and auto-layout.
  - `play/[storyId].tsx` — Interactive story reader with rewind history, save slots, and reader themes.
- `src/components/` — Editor modals/canvas (`GraphCanvas`, `OutlineList`, `SceneEditorModal`, `ChoiceLinkerModal`, `ValidatorModal`) and player UI (`ReaderSettingsModal`, `RewindDrawer`, `SaveSlotsModal`).
- `src/db/` — Local persistence powered by `@op-engineering/op-sqlite` (`client.ts`, `migrations.ts`, `seed.ts`, `storyRepo.ts`, `sessionRepo.ts`).
- `src/store/` — Zustand state stores (`useEditorStore.ts`, `usePlayStore.ts`, `useSettingsStore.ts`).
- `src/navigation/` — Typed React Navigation stack definitions (`types.ts`).
- `src/utils/` — Graph validation, auto-layout, ID generation, and `.cyoa.json` serialization.
- `src/types/` — Shared TypeScript interfaces (`story.ts`).

## Key Dependencies

- **Navigation:** `@react-navigation/native`, `@react-navigation/native-stack`, `react-native-screens`, `react-native-safe-area-context`
- **Database:** `@op-engineering/op-sqlite`
- **File Import / Export:** `@react-native-documents/picker`, `react-native-fs`, `react-native-share`
- **State & UI:** `zustand`, `lucide-react-native`, `react-native-svg`
