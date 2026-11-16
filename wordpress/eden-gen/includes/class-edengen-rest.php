<?php

if (!defined('ABSPATH')) {
    exit;
}

class EdenGen_REST {
    public static function register() {
        register_rest_route('edengen/v1', '/models', array(
            'methods' => 'GET',
            'permission_callback' => array(__CLASS__, 'can_edit'),
            'callback' => array(__CLASS__, 'models'),
        ));
        register_rest_route('edengen/v1', '/estimate', array(
            'methods' => 'POST',
            'permission_callback' => array(__CLASS__, 'can_edit'),
            'callback' => array(__CLASS__, 'estimate'),
        ));
        register_rest_route('edengen/v1', '/takes', array(
            'methods' => 'POST',
            'permission_callback' => array(__CLASS__, 'can_edit'),
            'callback' => array(__CLASS__, 'create'),
        ));
        register_rest_route('edengen/v1', '/takes/(?P<id>[A-Za-z0-9]+)', array(
            'methods' => 'GET',
            'permission_callback' => array(__CLASS__, 'can_edit'),
            'callback' => array(__CLASS__, 'take'),
        ));
        register_rest_route('edengen/v1', '/sideload', array(
            'methods' => 'POST',
            'permission_callback' => array(__CLASS__, 'can_edit'),
            'callback' => array(__CLASS__, 'sideload'),
        ));
    }

    public static function can_edit() {
        return current_user_can('edit_posts');
    }

    public static function models() {
        $models = EdenGen_API::models();
        if (is_wp_error($models)) {
            return $models;
        }
        $images = array();
        foreach ($models as $model) {
            if (is_array($model) && isset($model['kind']) && $model['kind'] === 'image') {
                $images[] = array(
                    'id' => (string) $model['id'],
                    'name' => isset($model['name']) ? (string) $model['name'] : (string) $model['id'],
                );
            }
        }
        return rest_ensure_response($images);
    }

    public static function estimate($request) {
        $input = self::input($request);
        if (is_wp_error($input)) {
            return $input;
        }
        $estimate = EdenGen_API::estimate($input);
        if (is_wp_error($estimate)) {
            return $estimate;
        }
        return rest_ensure_response($estimate);
    }

    public static function create($request) {
        $input = self::input($request);
        if (is_wp_error($input)) {
            return $input;
        }
        $key = (string) $request->get_param('idempotency_key');
        if (!preg_match('/^[A-Za-z0-9-]{8,80}$/', $key)) {
            return new WP_Error('edengen_key', 'Missing idempotency key.', array('status' => 400));
        }
        $created = EdenGen_API::create($input, $key, true);
        if (is_wp_error($created)) {
            return $created;
        }
        return rest_ensure_response($created);
    }

    public static function take($request) {
        $take = EdenGen_API::take((string) $request['id']);
        if (is_wp_error($take)) {
            return $take;
        }
        return rest_ensure_response($take);
    }

    public static function sideload($request) {
        $id = (string) $request->get_param('id');
        $post_id = (int) $request->get_param('post_id');
        $target = (string) $request->get_param('target');
        if ($post_id <= 0 || !current_user_can('edit_post', $post_id)) {
            return new WP_Error('edengen_post', 'You cannot edit that post.', array('status' => 403));
        }
        $file = EdenGen_API::download($id);
        if (is_wp_error($file)) {
            return $file;
        }
        if (!isset($file['body'])) {
            return new WP_Error('edengen_file', 'Eden Gen did not return file bytes.', array('status' => 502));
        }
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';
        $mime = isset($file['mime']) ? $file['mime'] : 'image/png';
        $ext = $mime === 'image/jpeg' ? 'jpg' : ($mime === 'image/webp' ? 'webp' : 'png');
        $tmp = wp_tempnam('edengen-' . $id);
        if (!$tmp) {
            return new WP_Error('edengen_tmp', 'Could not store the image.', array('status' => 500));
        }
        file_put_contents($tmp, $file['body']);
        $attachment_id = media_handle_sideload(array(
            'name' => 'eden-' . $id . '.' . $ext,
            'tmp_name' => $tmp,
        ), $post_id, 'Eden Gen take ' . $id);
        if (is_wp_error($attachment_id)) {
            @unlink($tmp);
            return $attachment_id;
        }
        if ($target === 'featured') {
            set_post_thumbnail($post_id, $attachment_id);
        }
        return rest_ensure_response(array(
            'attachment_id' => $attachment_id,
            'url' => wp_get_attachment_url($attachment_id),
            'target' => $target,
        ));
    }

    private static function input($request) {
        $prompt = trim((string) $request->get_param('prompt'));
        $model = trim((string) $request->get_param('model'));
        $aspect = trim((string) $request->get_param('aspect_ratio'));
        if ($prompt === '') {
            return new WP_Error('edengen_prompt', 'Write a prompt first.', array('status' => 400));
        }
        if ($model === '') {
            $model = 'nano-banana-2.1';
        }
        if (!in_array($aspect, array('1:1', '16:9', '9:16', '4:3'), true)) {
            $aspect = '16:9';
        }
        return array(
            'prompt' => $prompt,
            'model' => $model,
            'aspect_ratio' => $aspect,
        );
    }
}
