<?php

namespace SparkySpa;

/**
 * @param string $component
 * @param array $data
 *
 * @return mixed
 */
function sparky(string $component, array $data = []): string
{
    return Sparky::render($component, $data)['body'] ?? '';
}

/**
 * @param string $component
 * @param string|array $action_name
 * @param array $data
 *
 * @return string
 */
function emit(string $component, $action_name, array $data = []): string
{
    return Sparky::emitTo($component, $action_name, $data)['body'] ?? '';
}

/**
 * @param bool $include_lib_js
 *
 * @return string
 */
function sparkyScripts(bool $include_lib_js = true): string
{
    static $is_added = false;

    if ($is_added) {
        return '';
    }

    $ajax_uri = Sparky::getConfig('ajax_uri');

    if (substr($ajax_uri, -1) === '/') {
        $ajax_uri = substr($ajax_uri, 0, -1);
    }

    $lib_mini_js = $ajax_uri . '/' . Sparky::NAME_MINI_JS;

    $config_data = json_encode([
        'uri' => '/' . trim(Sparky::getConfig('ajax_uri'), '/ '),
        'return_jquery_element' => (bool) Sparky::getConfig('return_jquery_element'),
    ]);

    return "<script>document.addEventListener('SparkySpaSetConfig', function(){ Sparky.setConfig({$config_data}) });</script><script src='{$lib_mini_js}'></script>";
}

/**
 * @param string $component_name
 * @param string|null $action
 * @param string|null $args
 * @param string|null $post_body
 *
 * @return string
 */
function handleHttpRequest(string $component_name, string $action = null, string $args = null, string $post_body = null)
{
    try {

        if (Sparky::NAME_MINI_JS === $component_name) {
            header('Content-Type: text/javascript');

            echo file_get_contents(__DIR__ . '/../assets/js/sparky-spa.min.js');

            exit;
        }

        $component_data = json_decode($post_body ?? '', true);

        $component_data = (
                $component_data['binds'] ?? []
            ) + (
            isset($component_data['data'])
                ? unserialize(base64_decode($component_data['data']))()
                : []
            );

        if (!$action) {
            return Sparky::updateBindsTo($component_name, $component_data);
        }

        return json_encode(Sparky::emitTo(
            $component_name,
            [
                $action,
                !$args ? [] : json_decode(urldecode(base64_decode($args)), true)
            ],
            $component_data
        ));
    } catch (\Throwable $e) {
        if (Sparky::getConfig('is_dev_mode', false)) {
            print_r([
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'route' => __DIR__ . '/' . __FILE__ . ':' . __LINE__,
            ]);

            exit;
        }


        throw new $e;
    }
}