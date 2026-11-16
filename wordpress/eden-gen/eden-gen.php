<?php
/**
 * Plugin Name: Eden Gen
 * Description: Generate a featured image or an inline image in the block editor. The price is shown before any credit is spent.
 * Version: 0.1.0
 * Author: Edenmakers
 * License: MIT
 * Text Domain: eden-gen
 * Requires at least: 6.4
 * Requires PHP: 8.0
 */

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/includes/class-edengen-api.php';
require_once __DIR__ . '/includes/class-edengen-rest.php';

add_action('admin_menu', 'edengen_menu');
add_action('admin_init', 'edengen_settings');
add_action('enqueue_block_editor_assets', 'edengen_editor_assets');
add_action('rest_api_init', array('EdenGen_REST', 'register'));

function edengen_menu() {
    add_options_page('Eden Gen', 'Eden Gen', 'manage_options', 'edengen', 'edengen_settings_page');
}

function edengen_settings() {
    register_setting('edengen', 'edengen_token', array(
        'type' => 'string',
        'sanitize_callback' => 'edengen_sanitize_token',
        'show_in_rest' => false,
        'default' => '',
    ));
}

function edengen_sanitize_token($value) {
    $value = is_string($value) ? trim($value) : '';
    if ($value === '') {
        return (string) get_option('edengen_token', '');
    }
    if (!preg_match('/^(tkp_|tk_)/', $value)) {
        add_settings_error('edengen_token', 'edengen_token', 'Use a personal token (tkp_) or a developer key (tk_).');
        return (string) get_option('edengen_token', '');
    }
    return $value;
}

function edengen_settings_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    $saved = (string) get_option('edengen_token', '') !== '';
    echo '<div class="wrap"><h1>Eden Gen</h1>';
    echo '<p>Paste a personal token from <a href="https://edengen.ai/app/settings?tab=api">Settings, API and agents</a>. It stays on this site and is not sent to the block editor.</p>';
    settings_errors();
    echo '<form method="post" action="options.php">';
    settings_fields('edengen');
    echo '<table class="form-table"><tr><th scope="row"><label for="edengen_token">API token</label></th><td>';
    echo '<input type="password" class="regular-text" id="edengen_token" name="edengen_token" value="" autocomplete="off" placeholder="' . esc_attr($saved ? 'Token saved. Paste a new one to replace it.' : 'tkp_...') . '" />';
    echo '</td></tr></table>';
    submit_button('Save token');
    echo '</form></div>';
}

function edengen_editor_assets() {
    wp_enqueue_style('edengen-editor', plugins_url('assets/editor.css', __FILE__), array(), '0.1.0');
    wp_enqueue_script(
        'edengen-editor',
        plugins_url('assets/editor.js', __FILE__),
        array('wp-plugins', 'wp-edit-post', 'wp-element', 'wp-components', 'wp-data', 'wp-api-fetch', 'wp-blocks', 'wp-block-editor'),
        '0.1.0',
        true
    );
}
