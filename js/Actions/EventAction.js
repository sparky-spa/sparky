import {EmitAction} from "./EmitAction";
import {Event} from "../Component/Event";
import {Sparky} from "../Sparky";

export class EventAction extends EmitAction
{
	/**
	 * @inheritDoc
	 */
	process(args)
	{
		/** @type {Component} */
		let component = args.param_1;
		/** @type {string} */
		let event_data = args.param_2;
		/** @type {int} */
		let time = EventAction.readTime(args.param_3);
		/** @type {HTMLElement|jQuery} */
		let element = args.param_4;

		if (time === null) {
			return;
		}

		this.#initEvent(component, event_data, time, element);
	}

	/**
	 * @param {Component} component
	 * @param {string} event_data
	 * @param {int} time
	 * @param {HTMLElement|jQuery} element
	 */
	#initEvent(component, event_data, time, element)
	{
		event = Sparky.parseEventData(event_data);

		if (!time) {
			global.Sparky.addEvent(new Event({
				name: event.name,
				component_name: component.name,
				data: event.data,
				element: element
			}));

			return;
		}

		setTimeout(() => {
			global.Sparky.initEventTo(component.name, event.name, event.data, element);
		}, time ? time : 1);
	}
}