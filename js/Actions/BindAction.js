import $ from "jquery";
import {Action} from "./Action";
import {Component} from "../Component";
import {BaseCollection} from "../BaseCollection";
import {Queue} from "./BindAction/Queue";

export class BindAction extends Action
{
	static REQUEST_DELAY = 200;

	/**
	 * @type {BaseCollection|Queue[]}
	 * {
	 *     component_id: string
	 *     property_name: string
	 *     timeout: int
	 * }
	 *
	 */
	static #queue = new BaseCollection();

	/**
	 * @inheritDoc
	 */
	process(args)
	{
		/** @type action_selector */
		let action_selector = args.param_1;
		/** @type {Component} component */
		let component = args.param_2;
		/** @type {string} property_name */
		let property_name = args.param_3;

		if (!property_name) {
			console.error('[Sparky] spa:bind does not contain a property name');
		}

		$(action_selector).on('keyup', (e) => {
			let value = $(e.target).val();

			global.Sparky.setBind(component, property_name, value);

			BindAction.#addQueue(component.id, property_name);

			BindAction.#processQueue(component, property_name);
		});
	}

	/**
	 * @param {Component} component
	 * @param {string} property_name
	 */
	static #processQueue(component, property_name)
	{
		let queue = BindAction.#getQueue(component.id, property_name);

		if (!queue) {
			return;
		}

		if (queue.timeout > window.performance.now()) {
			setTimeout(() => {
				BindAction.#processQueue(component, property_name);
			}, BindAction.REQUEST_DELAY);

			return;
		}

		BindAction.#cleanupQueue(component.id, property_name);

		Sparky.updateBindsTo(component);
	}

	//region Setters

	/**
	 * @param {string} component_id
	 * @param {string} property_name
	 */
	static #addQueue(component_id, property_name)
	{
		let condition = (item) => item.component_id === component_id && item.property_name === property_name;

		let queue = BindAction.#queue.getFirst(condition, new Queue({component_id, property_name}));

		queue.timeout = BindAction.#getTimeout();

		BindAction.#queue.forget(condition);
		BindAction.#queue.push(queue);
	}

	/**
	 * @param {string} component_id
	 * @param {string} property_name
	 */
	static #cleanupQueue(component_id, property_name)
	{
		BindAction.#queue.forget((item) => item.component_id === component_id && item.property_name === property_name);
	}

	//endregion

	//region Getters

	/**
	 * @param {string} component_id
	 * @param {string} property_name
	 *
	 * @return {Queue|null}
	 */
	static #getQueue(component_id, property_name)
	{
		return BindAction.#queue.getFirst((item) => item.component_id === component_id && item.property_name === property_name);
	}

	/**
	 * @return {int}
	 */
	static #getTimeout()
	{
		return Math.round(window.performance.now()) + BindAction.REQUEST_DELAY;
	}

	//endregion
}