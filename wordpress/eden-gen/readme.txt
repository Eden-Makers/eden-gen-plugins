=== Eden Gen ===
Contributors: edenmakers
Tags: images, ai, media
Requires at least: 6.4
Tested up to: 6.7
Requires PHP: 8.0
Stable tag: 0.1.0
License: MIT
License URI: https://opensource.org/licenses/MIT

Generate a featured image or an inline image. The price is shown before any credit is spent.

== Description ==

Eden Gen adds a document panel to the block editor. The token stays in a WordPress option and is used by the site, not by the browser, when calling https://edengen.ai/v1.

A price from the estimate is shown before a take is created. Set featured image stores the file in the media library and sets it as the featured image. Insert image adds a core image block.

== Installation ==

1. Upload the `eden-gen` folder to `/wp-content/plugins/`.
2. Activate Eden Gen.
3. Settings, Eden Gen, paste a personal token from https://edengen.ai/app/settings?tab=api.

== Frequently Asked Questions ==

= Does the block editor see the token? =

No. The editor calls `/wp-json/edengen/v1/`, and PHP calls Eden Gen.

= Can I cancel after I confirm? =

No. Closing the editor does not cancel a take that was created.

== Changelog ==

= 0.1.0 =
First scaffold. Not submitted to the plugin directory.
