import $ from "jquery";
import {Action} from "./Action";

export class ClickAction extends Action
{
	/**
	 * @inheritDoc
	 */
	process(args)
	{
		/** @type {HTMLElement|jQuery} action_selector */
		let selector = args.param_1;
		/** @type {Component} component */
		let component = args.param_2;
		/** @type {string} action */
		let action_data = args.param_3;

		$(selector).on('click', () => {
			global.Sparky.callActionData(component, action_data);
		});
	}
}