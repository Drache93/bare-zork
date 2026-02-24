# Bare Zork

Zork everywhere

Powered by [Bare Native](https://github.com/holepunchto/bare-native), demonstrating server side rendering.

Data is streamed!
* Rendering is handled via `Cellery render -> Transform -> Websocket`
* Inputs are handled via `Websocket -> Transform -> State Machine -> Cellery`

Streaming state machine takes actions and performs state changes.

![demo](./demo.png)

## Build

```
npm run build:all
```

## Install

### MacOS

```
open ./build/darwin-arm64/bare-zork.app
```

### iOS

```
xcrun simctl install booted ./build/ios-arm64-simulator/bare-zork.app
```

### Adnroid

```
adb -e install build/android-arm64/BareZork.apk
```

Linux and Windows supported but not tested
