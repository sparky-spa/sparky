<?php

namespace SparkySpa;

class Sparky
{
    const NAME_MINI_JS = '___sparky-spa-min-js';

    private static $config = [
        'return_jquery_element' => true,
        'is_dev_mode' => false,
    ];

    #region Builders

    /**
     * @param string $component_name
     *
     * @return Component
     */
    final public static function factory(string $component_name, array $data = [])
    {
        $class_name = Component::getClassName($component_name);

        $component = $class_name::make($data);

        $component->public_properties = array_keys(get_object_vars($component));

        return $component;
    }

    /**
     * @param string $component
     * @param array $data // component data
     *
     * @return array
     */
    public static function render(string $component, array $data = [])
    {
        return static::factory($component, $data)
            ->init();
    }

    /**
     * @param string $component
     * @param string|array $action_data
     * [
     *      method,
     *      [
     *          arg_1,
     *          ...
     *      ],
     * ]
     *
     * @param array $data
     *
     * @return array
     */
    public static function emitTo(string $component, $action_data, array $data = []): array
    {
        $component = static::factory($component, $data);

        $args = is_array($action_data) ? $action_data[1] : [];
        $action_name = is_array($action_data) ? $action_data[0] : $action_data;

        return $component->init($action_name, $args);
    }

    /**
     * @param string $component
     * @param array $data
     *
     * @return string
     */
    public static function updateBindsTo(string $component, array $data = []): string
    {
        $component = static::factory($component);

        foreach ($component->public_properties as $name) {
            $component->$name = $data[$name] ?? null;
        }

        return $component->getContext();
    }

    #endregion

    #region Setters

    /**
     * @param array $data
     */
    public static function config(array $data = [])
    {
        self::$config = $data + self::$config;
    }

    #endregion

    #region Getters

    /**
     * @param string $key
     * @param null $default
     */
    public static function getConfig(string $config_key, $default = null)
    {
        if ($config_key === null) {
            return self::$config;
        }

        $config_key = explode('.', $config_key);
        $first_key = array_shift($config_key);
        $result = self::$config;

        while (isset($result[$first_key])) {
            $result = $result[$first_key];

            if (empty($config_key)) {
                return $result;
            }

            $first_key = array_shift($config_key);
        }

        return $default;
    }

    #endregion
}