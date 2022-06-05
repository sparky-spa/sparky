# HOW TO USE

## Install

Run `composer require sparky-spa/sparky`

### Setup config

Set up the settings
```php
\SparkySpa\Sparky::config([
    // Mandatory properties
    'namespace' => 'App\SparkyComponent', // the namespace of your components
    'ajax_uri' => '<ajax_uri>', // endpoint for ajax request. It could be relate or absolute link. 
    'view_callback' => function(string $view_name, array $data = []): string 
    {
        // here you can use any views handler, blade, twig, handlebar etc.
        // Or, just implement the native PHP includes things  
        return view($view_name, $data)
            ->render();
    },
    
    // Optional properties
    'return_jquery_element' => true, // TRUE by default. If TRUE, an event listener will receive `$(this)` otherwise `this`
    'is_dev_mode' => true, // FALSE by default. If TRUE, will display threw errors instead return 500 Internal Server Error
]);
```

### Endpoint `ajax_uri` implementation

It has to support the next URIs

```php
// POST <ajax_uri>/{$component_name}/{$action}/{$args}
// POST <ajax_uri>/{$component_name}/{$action}
// POST <ajax_uri>/{$component_name}

// GET <ajax_uri>/{\SparkySpa\Sparky::NAME_MINI_JS}
```

Also, use the function `handleHttpRequest()` to implement the endpoints correctly

#### For `POST <ajax_uri>/....` requests

```php
use function SparkySpa\handleHttpRequest;

echo handleHttpRequest(
	$component_name,
	$action,
	$args,
	$post_body
);
```

#### For `GET <ajax_uri>/{Sparky::NAME_MINI_JS}` request

```php

use function SparkySpa\handleHttpRequest;
use SparkySpa\Sparky;

echo handleHttpRequest(
	Sparky::NAME_MINI_JS
);

```

Feel free to use the tool 😉


# Back-end

## Implement a Component

Let imagine, we have the component

```php

namespace App\SparkyComponent;

use SparkySpa\Component;

class ChatCheckerComponent extends Component
{
    #region Actions

    /**
     * @inheritDoc
     */
    public function render()
    {
        return $this->view('spa/chat_checker');
    }

    #endregion
}
```

## Insert component into a page

The all next variants will work correctly

```php
use function SparkySpa\sparky;
use App\SparkyComponent\ChatCheckerComponent;

echo sparky('chat_checker', []);
echo sparky(ChatCheckerComponent::getName(), []);
echo ChatCheckerComponent::getTplBody([]);
```

If you place a component to an additional namespace (e.g. `User\ChatCheckerComponent`), use the next syntax

```php
use function SparkySpa\sparky;

echo sparky('user.chat_checker');
```

## Component Actions

Calling order of a component actions

```php
$component->mount(); // it doesn't call in Ajax request
 
$component->beforeExecuting();

$response = $component->customAction(); // an emitted method

if (!is_string($response)) {
    $component->beforeRendering();

    $response = $component->render();
}

$component->afterRendering();
```

### customAction

This is an action, which calls by `emit` actions.

Return a string to skip the `$component->render();` calling. The returned string will be a response onto an ajax request.
In the case, the action `$component->beforeRendering();` will be skipped too. So, please, call it inside the `$component->customAction();`, if it needs.

# Views

## Emit component action

### onClick: emit action

It makes request to back-end to an action

```html
<div spa:click="action_name('param')"></div>
```

### onClick: init event

It doesn't make request to back-end but trig an event/action listeners only

```html
<div spa:click="event:event_name('param')"></div>
```

### Emit action

```html
<div spa:emit="action_name({name: 123})">0s delay by default</div>
<div spa:emit.750ms="action_name('param')">trigger action in 750ms after loading</div>
<div spa:emit.2s="action_name('param_1', 'param_2')"></div>
<div spa:emit.5m="action_name()"></div>
<div spa:emit.1h="action_name"></div>
```

The time - is delay to an action will emit after the Sparky loading

## Init component event

### Action on a page/component load

The main different between `spa:emit` and `spa:event` is the last one inits an event listeners but not to call the component action on back-end 

```html
<div spa:event="event_name({name: 123})">0s interval by default</div>
<div spa:event.750ms="event_name('param')">trigger event in 750ms after loading</div>
<div spa:event.2s="event_name('param_1', 'param_2')"></div>
<div spa:event.5m="event_name()"></div>
<div spa:event.1h="event_name"></div>
```

## Bind Component property to a HTML field

The `component_property_name` has to be public property of a component

```html
<input spa:bind="component_property_name" type="text" name="field-name">
<input spa:bind type="text" name="component_property_name">
```


# JavaScript

## Sparky load events

It's important to use the load events, because it's a safety way to prevent the error `Uncaught ReferenceError: Sparky is not defined`

```js
document.addEventListener('SparkySpaLoad', function() 
{
	// a code
});
```

### Events list

**Inits once per a page load** 
- `SparkySpaSetConfig` - Sparky config could not be set up at the moment. Please do not use the event if you`re not sure
- `SparkySpaBeforeInit` - the event after the config setting up
- `SparkySpaInit` - the all Sparky elements have been initiated

**Inits after a page loading and each time after a component receiving answer on an action request from back-end**
- `SparkySpaLoad` - inits before a component events queue will be process.




### Emit component action in JS

The next executions will call a component method

```js
document.addEventListener('SparkySpaLoad', function() 
{
	Sparky.emitTo('component_name', 'action_name');

	let data = [];

	Sparky.emitTo('component_name', 'action_name', data);

	Sparky.emitTo('component_name', 'action_name', [], () => {});

	// this emition will not replace a component html on the page
	Sparky.emitQuietlyTo('component_name', 'action_name', data, (component, response) => {
		// a code
	});
});
```

`action_name` - it's a component method name, which will call. It also is an `event_name` for listeners
`data` - this is args list of `action_name` method
`callback` - it will execute after an emit request will be done and before a listener calling


## Init component event

### To init component event in JS

It also will not call a component method but inits the event listeners 

```js
document.addEventListener('SparkySpaLoad', function() 
{
	Sparky.initEventTo('component_name', 'event_name');
	Sparky.initEventTo('component_name', 'event_name', []);
	Sparky.initEventTo('component_name', 'event_name', [], dom_element);

	Sparky.initEventAny('event_name'); // inits all events with `event_name` without any relation to a component.
	Sparky.initEventAny('event_name', []); // inits all events with `event_name` without any relation to a component.
	Sparky.initEventAny('event_name', [], dom_element); // inits all events with `event_name` without any relation to a component.
});
```


## Event/Action Listener in JS

Use the next things to listen an event

```js
document.addEventListener('SparkySpaLoad', function() 
{
	Sparky.on('component_name', 'event_name', (dom_element, event_data, component) => {});

	// listens all events with `event_name` without any relation to a component.
    	Sparky.onAny('event_name', (dom_element, event_data, component) => {
		if (!component.is('component_name')) {
			return;
        	}

		if (!dom_element) {
			// dom_element coould be null in 2 cases
            		// 1. There was calling `Sparky.initEventTo()` without `dom_element`
            		// 2. A component has been refreshed and the element was replaced with new one
			
			return Sparky.LISTENER_FORGET; // will remove the listener from a stack
		}
		
		// a code
    });
});
```
`event_name` - it's a component method name, which was called
`component_name` - a component name of an event.

`event_data.response` - it will contain HTML body of response if an action (not event) was emitted quietly   

> Note
> Do not check a component 

### Reserved event names

#### sparky:update_binds

`sparky:update_binds` - executes on a component property update by a bound tag.

```html
<input spa:bind="component_property_name" type="text" name="field-name">
<input spa:bind type="text" name="component_property_name">
```

This event pass an updated properties list to a listener
 

## WARNING

> Please, do not pass secure data into a Component's public property. It passes to front-end and could be readed in browser  
