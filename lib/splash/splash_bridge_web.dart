import 'dart:js_interop';

import 'package:flutter/widgets.dart';

@JS('window.__qportalLogoRect')
external set _logoRect(JSAny? value);

void reportSplashLogoRect(Rect rect) {
  _logoRect = {
    'x': rect.left,
    'y': rect.top,
    'w': rect.width,
    'h': rect.height,
  }.jsify();
}
