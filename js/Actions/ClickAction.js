import $ from "jquery";
import {Action} from "./Action";
import {Sparky} from "../Sparky";

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
		let event_data = args.param_3;

		// event:action_name(data)
		let data = event_data.split('(', 2);
		// event:action_name
		let sub_action = data[0].split(':', 2);

		sub_action = typeof sub_action[1] !== 'undefined'
			? sub_action[0]
			: null;

		if (sub_action) {
			data = event_data.split(':', 2);

			event_data = data[1];
		}

		$(selector).on('click', () => {
			switch (sub_action) {
				case 'event':
					event = Sparky.parseEventData(event_data);

					global.Sparky.initEventTo(component.name, event.name, event.data, selector);

					return;

				default:
					global.Sparky.callActionData(component, event_data);
			}
		});
	}
}