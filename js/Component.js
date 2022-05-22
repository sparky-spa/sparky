import $ from "jquery";
import {Sparky} from "./Sparky";

export class Component
{
	name = null;
	id = window.performance.now() + '.' + Math.floor(Math.random() * 10000000000);
	context = null;
	element = null;

	/**
	 * @param {HTMLElement} element
	 */
	constructor(element)
	{
		this.element = element;
		this.name = Sparky.sanitizeComponentName($(this.element).attr('sparky-x-component-name'));
		this.context = $(this.element).attr('sparky-x-component-context');

		$(this.element).first().attr('sparky-x-component-id', this.id);
	}

	/**
	 * @param {string|Component} component_name
	 * @return {boolean}
	 */
	is(component_name)
	{
		if (component_name instanceof Component) {
			return this.name === component_name.name;
		}

		return this.name === Sparky.sanitizeComponentName(component_name)
	}

	/**
	 * @return {boolean}
	 */
	isExist()
	{
		return document.contains($(this.element)[0]);
	}
}