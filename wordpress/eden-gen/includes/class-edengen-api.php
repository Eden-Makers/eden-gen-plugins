<?php

if (!defined('ABSPATH')) {
    exit;
}

class EdenGen_API {
    const BASE = 'https://edengen.ai/v1';

    public static function token() {
        $token = (string) get_option('edengen_token', '');
        return trim($token);
    }

    public static function request($method, $path, $body = null, $headers = array()) {
        $token = self::token();
        if ($token === '') {
            return new WP_Error('edengen_token', 'Save an Eden Gen token in Settings, Eden Gen.');
        }
        $args = array(
            'method' => $method,
            'timeout' => 60,
            'headers' => array_merge(array(
                'Authorization' => 'Bearer ' . $token,
                'Accept' => 'application/json',
            ), $headers),
        );
        if ($body !== null) {
            $args['headers']['Content-Type'] = 'application/json';
            $args['body'] = wp_json_encode($body);
        }
        $response = wp_remote_request(self::BASE . $path, $args);
        if (is_wp_error($response)) {
            return $response;
        }
        $code = (int) wp_remote_retrieve_response_code($response);
        $raw = (string) wp_remote_retrieve_body($response);
        $content_type = (string) wp_remote_retrieve_header($response, 'content-type');
        if (strpos($content_type, 'application/json') !== false || ($raw !== '' && ($raw[0] === '{' || $raw[0] === '['))) {
            $decoded = json_decode($raw, true);
            if ($code >= 400) {
                $message = 'Eden Gen returned HTTP ' . $code;
                if (is_array($decoded) && isset($decoded['error']['message'])) {
                    $message = (string) $decoded['error']['message'];
                }
                return new WP_Error('edengen_http', $message, array('status' => $code));
            }
            return $decoded;
        }
        if ($code >= 400) {
            return new WP_Error('edengen_http', 'Eden Gen returned HTTP ' . $code, array('status' => $code));
        }
        return array(
            'body' => $raw,
            'mime' => $content_type !== '' ? trim(strtok($content_type, ';')) : 'application/octet-stream',
        );
    }

    public static function models() {
        $page = self::request('GET', '/models');
        if (is_wp_error($page)) {
            return $page;
        }
        if (isset($page['data']) && is_array($page['data'])) {
            return $page['data'];
        }
        return is_array($page) ? $page : array();
    }

    public static function estimate($input) {
        return self::request('POST', '/estimate', self::body($input, false));
    }

    public static function create($input, $idempotency, $confirm) {
        $created = self::request('POST', '/takes', self::body($input, $confirm), array(
            'Idempotency-Key' => $idempotency,
        ));
        if (is_wp_error($created)) {
            return $created;
        }
        if (isset($created['data'][0])) {
            return $created['data'][0];
        }
        return $created;
    }

    public static function take($id) {
        return self::request('GET', '/takes/' . rawurlencode($id));
    }

    public static function download($id) {
        return self::request('GET', '/takes/' . rawurlencode($id) . '/content');
    }

    private static function body($input, $confirm) {
        $body = array(
            'model' => $input['model'],
            'prompt' => $input['prompt'],
            'aspect_ratio' => isset($input['aspect_ratio']) ? $input['aspect_ratio'] : '16:9',
            'count' => 1,
        );
        if ($confirm) {
            $body['confirm_cost'] = true;
        }
        return $body;
    }
}
