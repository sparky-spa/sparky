import $ from "jquery";
import {Component} from "./Component";
import {ClickAction} from "./Actions/ClickAction";
import {EmitAction} from "./Actions/EmitAction";
import {BindAction} from "./Actions/BindAction";
import {BaseCollection} from "./BaseCollection";
import {Event} from "./Component/Event";
import {Bind} from "./Component/Bind";
import {Listener} from "./Component/Listener";
import {EventAction} from "./Actions/EventAction";

export class Sparky
{
	LISTENER_FORGET = 1;

	/** @type {BaseCollection|Component[]} */
	static #components = new BaseCollection();
	/** @type {BaseCollection|Event[]} */
	static #events = new BaseCollection();
	/** @type {BaseCollection|Listener[]} */
	static #listeners = new BaseCollection();
	static #config = {};

	/** @type {BaseCollection|Bind[]} */
	#binds = new BaseCollection();

	//region Builders

	/**
	 * @return {Sparky}
	 */
	static build()
	{
		let spa = new Sparky();

		return spa.init().afterInit();
	}

	/**
	 * @return {Sparky}
	 */
	init()
	{
		$('[sparky-x-new-component]').each(function() {
			let component = new Component(Sparky.#prepareElement(this));

			Sparky.#setupElements(component);

			$(component.element).removeAttr('sparky-x-new-component');
		});

		return this;
	}

	/**
	 * @return {Sparky}
	 */
	afterInit()
	{
		document.dispatchEvent(new CustomEvent('SparkySpaLoad'));

		this.#processEventsQueue();

		return this;
	}

	//endregion

	//region Actions

	/**
	 * @param {Component} component
	 */
	static #setupElements(component)
	{
		Sparky.#components.push(component);

		$(component.element).find('[sparky-x-element]').each(function () {
			let element = Sparky.#prepareElement(this);

			if ($(element).parents('[sparky-x-component-name]').first().attr('sparky-x-component-name') !== $(component.element).attr('sparky-x-component-name')) {
				return;
			}

			$.each(this.attributes, function() {
				if(!this.specified) {
					return;
				}

				let data = this.name.split('.');

				let action = data[0];
				let time = typeof data[1] !== 'undefined'
					? data[1]
					: null;

				let data_object = {
					param_1: null,
					param_2: null,
					param_3: null,
					param_4: null
				};
				/** @type {Action} */
				let data_processor = null;

				switch (action) {
					case 'sparky-x-click':
						data_object.param_1 = element;
						data_object.param_2 = component;
						data_object.param_3 = this.value;

						data_processor = new ClickAction();

						break;

					case 'sparky-x-bind':
						data_object.param_1 = element;
						data_object.param_2 = component;
						data_object.param_3 = this.value ? this.value : $(element).attr('name');

						data_processor = new BindAction();

						break;

					case 'sparky-x-emit':
						data_object.param_1 = component;
						data_object.param_2 = this.value;
						data_object.param_3 = time ? time : '0';

						data_processor = new EmitAction();

						break;

					case 'sparky-x-event':
						data_object.param_1 = component;
						data_object.param_2 = this.value;
						data_object.param_3 = time ? time : '0';
						data_object.param_4 = element;

						data_processor = new EventAction();

						break;

					default:
						return;
				}

				data_processor.process(data_object);
			});
		})
	}

	/**
	 * Pushes available Listeners for events in the queue
	 *
	 * @param {string} for_component
	 * @param {string} event_name
	 */
	#processEventsQueue(for_component = null, event_name = null)
	{
		Sparky.#components.forget((item) => !item.isExist());

		Sparky.#events
			.get((event) => {
				return (for_component ? event.component_name === for_component : true)
					&& (event_name ? event.name === event_name : true)
			})
			.forEach((event, index) =>
			{
				let i = 0;

				Sparky.#components
					.get((item) => {
						return item.name === event.component_name
							|| event.component_name === 'spa:any-component';
					})
					.forEach(component => {
						let forget_list = [];

						Sparky.#listeners
							.get((item) => {
								return item.event === event.name
									&& (
										item.event_type
											? (item.event_type === event.type)
											: true
									)
									&& (
										item.component_name === component.name
										|| item.component_name === 'spa:any-component'
									);
							})
							.forEach((listener) => {
								switch (listener.callback(event.element, event.data, component)) {
									case this.LISTENER_FORGET:
										forget_list.push(listener.id);
										break;
								}
							});

						Sparky.#listeners.forget((item, id) =>  forget_list.includes(id));
					});

				Sparky.#events.remove(event);
			});
	}

	/**
	 * @param {string|Component} component_name
	 * @param {string} event_name
	 * @param {object} data
	 * @param {function|null} callback
	 *
	 * @return {Sparky}
	 */
	emitTo(component_name, event_name, data = [], callback = null)
	{
		let spa = this;

		Sparky
			.#getComponents(component_name)
			.forEach((component) => {
				spa.#callAction(component, event_name, data, callback)
			});

		return this;
	}

	/**
	 * @param {string|Component} component_name
	 * @param {string} event_name
	 * @param {object} data
	 * @param {function|null} callback
	 *
	 * @return {Sparky}
	 */
	emitQuietlyTo(component_name, event_name, data = [], callback = null)
	{
		let spa = this;

		Sparky
			.#getComponents(component_name)
			.forEach((component) => {
				spa.#callAction(component, event_name, data, callback, true)
			});
	}

	/**
	 * @param {string} component_name
	 * @param {string} event_name
	 * @param {array|null} data
	 * @param {HTMLElement|jQuery} element
	 */
	initEventTo(component_name, event_name, data = null, element = null)
	{
		component_name = Sparky.sanitizeComponentName(component_name);

		this.addEvent(new Event({
			name: event_name,
			component_name: component_name,
			data: data,
			element: element
		}));

		this.#processEventsQueue(component_name, event_name);

		return this;
	}

	/**
	 * @param {string} event_name
	 * @param {array|null} data
	 * @param {HTMLElement|jQuery} element
	 */
	initEventAny(event_name, data = null, element = null)
	{
		this.initEventTo('spa:any-component', event_name, data, element);

		return this;
	}

	/**
	 * @param {Component} component
	 * @return {Sparky}
	 */
	updateBindsTo(component)
	{
		let url = Sparky.#config.uri + "/" + component.name;
		let spa = this;

		this.#sendRequest(url, component, function (data, textStatus) {
			if (!data.target.response || !component) {
				return;
			}

			component.context = data.target.response;

			spa.addEvent(new Event({
				name: 'sparky:update_binds',
				component_name: component.name,
				data: spa.getBoundPropertyValues((item) => item.component_id === component.id)
			}));
		});

		return this;
	}

	/**
	 * @param {Component} component
	 * @param {string} action_data
	 */
	callActionData(component, action_data)
	{
		event = Sparky.parseEventData(action_data);

		this.#callAction(component, event.name, event.data)
	}

	/**
	 * @param {Component} component
	 * @param {string} action_name
	 * @param {array} data
	 * @param {function|null} callback
	 * @param {bool} is_quiet
	 */
	#callAction(component, action_name, data = [], callback = null, is_quiet = false)
	{
		if (!component) {
			console.error('[Sparky] invalid component value');

			return;
		}

		if (!component.isExist()) {
			Sparky.#components.remove(component);

			return;
		}

		let url = Sparky.#config.uri + "/" + component.name + "/" + action_name + '/' + window.btoa(encodeURIComponent(JSON.stringify(data)));

		this.#sendRequest(url, component, function (data, textStatus) {
			let response = data.target.response;

			if (response && typeof response === 'string') {
				response = JSON.parse(response);
			}

			if (typeof response.body === 'undefined' || !component) {
				return;
			}

			let selector = component.element;
			let component_name = component.name;

			let event = new Event({
				name: action_name,
				component_name: component_name,
			});

			if (!is_quiet) {
				Sparky.#components.forget((item, id) => id === component.id);

				component = null;

				$(selector).replaceWith(
					`<div sparky-x-new-component sparky-x-component-name="${component_name}" sparky-x-component-context="${response.context}">${response.body}</div>`
				);
			} else {
				event.data = {response: response.body};
				component.context = response.context;

				$(component.element).attr('sparky-x-component-context', response.context);
			}

			if (callback) {
				is_quiet
					? callback(component, response.body)
					: callback();
			}

			global.Sparky.addEvent(event);

			global.Sparky = Sparky.build();

			if (!response.emits.length) {
				return;
			}

			response.emits.forEach((item) => {
				switch (item.type) {
					case 'loud':
						global.Sparky.emitTo(item.component_name, item.action_name, item.data);
						break;

					case 'init':
						global.Sparky.initEventTo(item.component_name, item.action_name, item.data);
						break;

					case 'init_any':
						global.Sparky.initEventAny(item.action_name, item.data);
						break;

					default:
						console.warn('Unknown event type: ' + item.type);
				}

			});
		});
	}

	//endregion

	//region Setters

	/**
	 * An event comes from back-end
	 *
	 * @param {Event} data
	 *
	 * @returns {Sparky}
	 */
	addEvent(data)
	{
		data.component_name = Sparky.sanitizeComponentName(data.component_name);

		let condition = (item) => {
			return item.name === data.name
				&& item.component_name === data.component_name
				&& item.data === data.data
		}

		if (Sparky.#events.has(condition)) {
			return this;
		}

		Sparky.#events.push(new Event(data));

		return this;
	}

	/**
	 * An listener comes from front-end
	 *
	 * @param {string} component_name
	 * @param {string} event
	 * @param {function} callback
	 *
	 * @return {Sparky}
	 */
	on(component_name, event, callback)
	{
		Sparky.addListener(component_name, event, callback);

		return this;
	}

	/**
	 * An listener comes from front-end
	 *
	 * @param {string} event
	 * @param {function} callback
	 *
	 * @return {Sparky}
	 */
	onAny(event, callback)
	{
		Sparky.addListener('spa:any-component', event, callback);

		return this;
	}

	/**
	 * An listener comes from front-end
	 *
	 * @param {string} component_name
	 * @param {string} event
	 * @param {function} callback
	 * @param {string|null} event_type
	 */
	static addListener(component_name, event, callback, event_type = null)
	{
		component_name = Sparky.sanitizeComponentName(component_name);

		Sparky.#listeners.push(new Listener({
			component_name,
			event,
			event_type,
			callback
		}));
	}

	/**
	 * @param {object} data
	 * @return {Sparky}
	 */
	setConfig(data)
	{
		Sparky.#config = {
			'uri': data.uri,
			'return_jquery_element': Boolean(data.return_jquery_element),
		};

		return this;
	}

	/**
	 * @param {Component} component
	 * @param {string} property_name
	 * @param {mixed} value
	 * @return {Sparky}
	 */
	setBind(component, property_name, value)
	{
		let condition = (item) => item.component_id === component.id && item.property_name === property_name;

		if (this.#binds.has(condition)) {
			this.#binds.forget(condition);
		}

		this.#binds.push(new Bind({
			component_id: component.id,
			property_name: property_name,
			value: value
		}));

		return this;
	}

	//endregion

	//region Getters

	/**
	 * @param {string|Component} component_name
	 * @return {Component[]}
	 */
	static #getComponents(component_name)
	{
		if (component_name instanceof Component) {
			return Sparky.#components.get((item) => item.id === component_name.id);
		}

		component_name = component_name.trim();

		if (
			component_name.charAt(0) === '.'
			|| component_name.charAt(0) === '['
			|| component_name.indexOf(' ') !== -1
			|| component_name.indexOf('->') !== -1
			|| (
				component_name.charAt(0) === '#'
				&& (
					component_name.indexOf('.') !== -1
					|| component_name.indexOf('[') !== -1
					|| component_name.indexOf(' ') !== -1
					|| component_name.indexOf('->') !== -1
				)
			)
		) {
			console.error('[Sparky] Please, use HTMLElement #ID instead selector `' + component_name + '` to select specific component');

			return this;
		}

		// If component_name is component_id
		let component = Sparky.#components.get((item) => item.id === component_name);

		if (component.length > 0) {
			return component;
		}

		// If component_name is HTMLElement selector
		if (component_name.charAt(0) === '#') {
			let component_id = $(component_name).attr('sparky-x-component-id');

			if (!component_id) {
				console.error('[Sparky] HTMLElement with selector `' + component_name + '` is not component');

				return [];
			}

			let component = Sparky.#components.getFirst((item) => item.id === component_id);

			if (!component) {
				console.warn('[Sparky] There is no component with selector `' + component_name + '`');

				return [];
			}

			return [component];
		}

		component_name = Sparky.sanitizeComponentName(component_name);

		return Sparky.#components.get((item) => item.name === component_name);
	}

	/**
	 * @param {string} event_data
	 * @return {object}
	 * {
	 *     name: {string}
	 *     data: {any[]}
	 * }
	 */
	static parseEventData(event_data)
	{
		let array = [...event_data.matchAll(/([a-zA-Z0-9_]+)(\((.*)?\))?/g)];

		let method = array[0][1];
		let args = [];

		if (typeof array[0][3] !== 'undefined') {
			let data = array[0][3].split(',');

			data.forEach(name => {
				name = name.trim();
				name = name.replace(/^\'+|\'+$/gm,'');
				name = name.trim();

				args.push(name);
			});
		}

		return {
			name: method,
			data: args
		};
	}

	//endregion

	//region Helpers

	/**
	 * @param {string} component_name
	 *
	 * @return {string|null}
	 */
	static sanitizeComponentName(component_name)
	{
		let array_el_to_ucfirst = (items_list) => {
			items_list.forEach((value, index) => {
				items_list[index] = value.charAt(0).toUpperCase() + value.slice(1);
			});

			return items_list;
		};

		component_name = component_name.trim();

		if (!component_name) {
			console.error('Invalid `component_name`');
		}

		// Process reserved name
		if (component_name.indexOf(':') !== -1) {
			component_name = component_name.toLowerCase();
			component_name = component_name.replace('_', '-');

			return component_name;
		}

		// Process client name
		component_name = component_name.replace(/[\\\/]/g, '.');
		component_name = component_name.replace('-', '_');

		component_name = array_el_to_ucfirst(
			component_name.split('.')
		).join('.');

		component_name = array_el_to_ucfirst(
			component_name.split('_')
		).join('');

		if (component_name.slice(-10) === '_component') {
			component_name = component_name.slice(0, -10);
		}

		if (component_name.slice(-9) === 'Component' || component_name.slice(-9) === 'component') {
			component_name = component_name.slice(0, -9);
		}

		return component_name;
	}

	/**
	 * @param {string} url
	 * @param {Component} component
	 * @param {function} callback // executes after a request getting response
	 * @returns {boolean}
	 */
	#sendRequest(url, component, callback)
	{
		let httpRequest = false;

		if (window.XMLHttpRequest) { // Mozilla, Safari, ...
			httpRequest = new XMLHttpRequest();
			if (httpRequest.overrideMimeType) {
				httpRequest.overrideMimeType('text/xml');
			}
		} else if (window.ActiveXObject) { // IE
			try {
				httpRequest = new ActiveXObject("Msxml2.XMLHTTP");
			} catch (e) {
				try {
					httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
				} catch (e) {}
			}
		}

		if (!httpRequest) {
			return false;
		}

		httpRequest.onreadystatechange = callback;
		httpRequest.open('POST', url, true);
		httpRequest.send(JSON.stringify({
			data: component.context,
			binds: this.getBoundPropertyValues((item) => item.component_id === component.id)
		}));
	}

	/**
	 * @param {function} condition
	 *
	 * @return {object}
	 */
	getBoundPropertyValues(condition)
	{
		let result = {};

		this.#binds.get(condition)
			.forEach((bind) => {
				result[bind.property_name] = bind.value;
			});

		return result;
	}

	/**
	 * @param {HTMLElement} selector
	 * @return {jQuery|HTMLElement}
	 */
	static #prepareElement(selector)
	{
		return Sparky.#config.return_jquery_element
			? $(selector)
			: selector;
	}

	//endregion
}