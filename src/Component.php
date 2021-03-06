<?php

namespace SparkySpa;

use Opis\Closure\SerializableClosure;
use SparkySpa\DataContainer\Action;
use WebXID\BasicClasses\DataContainer;

abstract class Component extends DataContainer
{
    const ANY_COMPONENT = 'spa:any-component';

    /** @var string[] */
    protected $public_properties = [];

     /** @var Action[] */
     private $emitted_actions = [];

    #region Abstract methods

    /**
     * @return string
     */
    abstract protected function render();

    #endregion

    #region Actions

    /**
     * @return void
     */
    protected function mount() {}

    /**
     * @return void
     */
    protected function beforeExecuting() {}

    /**
     * Reserved method to refresh a component by ajax
     */
    final public function refresh() {}

    /**
     * @return void
     */
    protected function beforeRendering() {}

    /**
     * @return void
     */
    protected function afterRendering() {}

    /**
     * @param string|null $method_name
     * @param array $args
     *
     * @return array [
     *      'body' => string,
     *      'emits' => array
     * ]
     */
    public function init(string $method_name = null, array $args = []): array
    {
        if (!$method_name) {
            $this->mount();
        }

        $this->beforeExecuting();

        if ($method_name) {
            $component_html = $this->callAction($method_name, $args);

            if (is_string($component_html)) {
                $this->afterRendering();

                return $this->getResponseBody($component_html);
            }
        }

        $this->beforeRendering();

        $component_html = $this->render();

        $this->afterRendering();

        if ($method_name) {
            return $this->getResponseBody($component_html);
        }

        $component_html = '
            <div sparky-x-new-component sparky-x-component-name="' . static::getName() . '" sparky-x-component-context="' . $this->getContext() . '">
                ' . $this->getHtmlBody($component_html) . '
                ' . $this->getEmittedActionsHtml() .'
            </div>';

        return $this->getResponseBody($component_html, false);
    }

    /**
     * @param string $method_name
     * @param array $args
     *
     * @return string|mixed
     */
    private function callAction(string $method_name, array $args = [])
    {
        if (!method_exists($this, $method_name)) {
            throw new \LogicException('Method `' . $method_name . '` does not exist in ' . get_class($this));
        }

        return call_user_func_array([$this, $method_name], $args);
    }

    /**
     * @param string $component
     * @param string $action_name
     * @param array $data
     *
     * @return $this
     */
    public function emit(string $action_name, array $data = []): self
    {
        $this->emitTo(static::getName(), $action_name, $data);

        return $this;
    }

    /**
     * @param string $component
     * @param string $action_name
     * @param array $data
     *
     * @return $this
     */
    public function emitTo(string $component, string $action_name, array $data = [], $type = Action::TYPE_LOUD): self
    {
        $component_class = $component === static::ANY_COMPONENT
            ? null
            : static::getClassName($component);

        switch ($type) {
            case Action::TYPE_LOUD:
            case Action::TYPE_INIT:
            case Action::TYPE_INIT_ANY:
                break;

            default:
                if (!method_exists($component_class, $action_name)) {
                    throw new \InvalidArgumentException("The component `{$component}` does not have action `{$action_name}`");
                }
        }

        $this->emitted_actions[] = Action::make([
            'component_name' => $component_class === null
                ? static::ANY_COMPONENT
                : $component_class::getName(),
            'name' => $action_name,
            'data' => $data,
            'type' => $type,
        ]);

        return $this;
    }

    /**
     * @param string $component
     * @param array $data
     *
     * @return $this
     */
    public function emitRefreshTo(string $component, array $data = [])
    {
        return $this->emitTo($component, 'refresh', $data);
    }

    /**
     * @param string $event
     * @param array $data
     *
     * @return $this
     */
    public function initEvent(string $event, array $data = []): self
    {
        $this->emitTo(static::getName(), $event, $data, Action::TYPE_INIT);

        return $this;
    }

    /**
     * @param string $event
     * @param array $data
     *
     * @return $this
     */
    public function initEventTo(string $component, string $event, array $data = []): self
    {
        $this->emitTo($component, $event, $data, Action::TYPE_INIT);

        return $this;
    }

    /**
     * @param string $event
     * @param array $data
     *
     * @return $this
     */
    public function initEventAny(string $event, array $data = []): self
    {
        $this->emitTo(static::ANY_COMPONENT, $event, $data, Action::TYPE_INIT_ANY);

        return $this;
    }

    #endregion

    #region Setters



    #endregion

    #region Getters

    /**
     * @param string $view_name
     * @param array $data
     *
     * @return string
     */
    protected function view(string $view_name, array $data = []): string
    {
        $view = Sparky::getConfig('view_callback');

        return $view($view_name, $data + $this->toArray());
    }

    /**
     * @return string
     */
    public static function getName(): string
    {
        $namespace = trim(str_replace(Sparky::getConfig('namespace'), '', static::class), '\\ ');

        if (substr($namespace, -9) === 'Component') {
            $namespace = substr($namespace, 0, -9);
        }

        return static::sanitizeComponentName( str_replace(['\\', '/'], '.', $namespace));
    }

    /**
     * @param string $component_name
     *
     * @return Component|string
     */
    final public static function getClassName(string $component_name_1): string
    {
        $component_name = static::sanitizeComponentName($component_name_1);

        $namespace = str_replace('_', '', $component_name);

        $namespace = '\\' . trim($namespace, '\\');

        $component_name = Sparky::getConfig('namespace') . $namespace;

        if (!class_exists($component_name)) {
            $component_name .= 'Component';

            if (!class_exists($component_name)) {
                if (!class_exists($namespace)) {
                    throw new \LogicException('Component `' . $namespace . '` does not exist');
                }

                $component_name = $namespace;
            }
        }

        return $component_name ;
    }

    /**
     * Render a component layout
     *
     * @param array $component_data
     *
     * @return string
     */
    final public static function renderBody(array $component_data = []): string
    {
        return Sparky::render(static::getName(), $component_data)['body'] ?? '';
    }

    /**
     * Render a component method
     *
     * @param string $action_name
     * @param array $args
     * @param array $component_data
     *
     * @return array
     */
    final public static function renderAction(string $action_name, array $args = [], array $component_data = []): array
    {
        return Sparky::emitTo(static::getName(), [$action_name, $args], $component_data);
    }

    /**
     * @inheritDoc
     */
    public function toArray()
    {
        $result = [];

        foreach ($this->public_properties as $name) {
            $result[$name] = $this->$name;
        }

        return $result;
    }

    /**
     * @return array
     */
    private function getEmittedActions(): array
    {
        $result = [];

        foreach ($this->emitted_actions as $event) {
            $result[] = [
                'component_name' => $event->component_name,
                'action_name' => $event->name,
                'data' => $event->data,
                'type' => $event->type,
            ];
        }

        return $result;
    }

    /**
     * @return string
     */
    private function getEmittedActionsHtml(): string
    {
        $result = '';

        foreach ($this->emitted_actions as $event) {
            $data = json_encode($event->data);

            switch ($event->type) {
                case Action::TYPE_LOUD:
                    $result .= "Sparky.emitTo('{$event->component_name}', '{$event->name}', {$data});";
                    break;

                case Action::TYPE_INIT:
                    $result .= "Sparky.initEventTo('{$event->component_name}', '{$event->name}', {$data});";
                    break;

                case Action::TYPE_INIT_ANY:
                    $result .= "Sparky.initEventAny('{$event->name}', {$data});";
                    break;

                default:
                    throw new \LogicException('Invalid $event->type, given `' . $event->type . '`');
            }
        }

        if (!$result) {
            return '';
        }

        return "<script>{$result}</script>";
    }

    /**
     * Returns a Component context for a front-end part
     *
     * @return string
     */
    public function getContext()
    {
        $public_properties = $this->toArray();

        return base64_encode(serialize(new SerializableClosure(
            function() use ($public_properties) {
                return $public_properties;
            }
        )));
    }

    /**
     * @param string $component_html
     *
     * @return array|string|string[]
     */
    private function getHtmlBody(string $component_html)
    {
        return str_replace('\'spa:', '\' sparky-x-element sparky-x-',
            str_replace('"spa:', '" sparky-x-element sparky-x-',
                str_replace(' spa:', ' sparky-x-element sparky-x-', $component_html)
            )
        );
    }

    /**
     * @param string $component_html
     *
     * @return array
     */
    private function getResponseBody(string $component_html, $render_context = true): array
    {
        if (!$render_context) {
            return [
                'body' => $this->getHtmlBody($component_html),
                'emits' => $this->getEmittedActions(),
            ];
        }

        return [
            'body' => $this->getHtmlBody($component_html),
            'emits' => $this->getEmittedActions(),
            'context' => $this->getContext(),
        ];
    }

    #endregion

    #region Helpers

    /**
     * @param string $component_name
     *
     * @return string
     */
    private static function sanitizeComponentName(string $component_name, $string_case = 'ucfirst'): string
    {
        $array_el_to_ucfirst = function (array $data) use ($string_case) {
            foreach ($data as &$name) {
                $name = $string_case($name);
            }

            return $data;
        };

        $component_name = str_replace('-', '_', $component_name);
        $component_name = str_replace(['\\', '/'], '.', $component_name);

        $component_name = implode('', $array_el_to_ucfirst(
            explode('_', $component_name)
        ));

        $component_name = implode('.', $array_el_to_ucfirst(
            explode('.', $component_name)
        ));

        return $component_name;
    }

    #endregion
}