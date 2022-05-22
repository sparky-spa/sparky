import {Action} from "./Action";
import {Component} from "../Component";

export class EmitAction extends Action
{
	/**
	 * @inheritDoc
	 */
	process(args)
	{
		/** @type {Component} component */
		let component = args.param_1;
		/** @type {string} method_data */
		let action_data = args.param_2;
		/** @type {int} time */
		let time = EmitAction.readTime(args.param_3);

		if (time === null) {
			return;
		}

		setTimeout(() => global.Sparky.callActionData(component, action_data), time);
	}


	/**
	 * @param {string} time_data
	 * @return {null|number}
	 */
	static readTime(time_data)
	{
		let array = [...time_data.matchAll(/([0-9]+)[ ]?(h|m|s)?/g)];

		if (
			typeof array === 'undefined'
			|| typeof array[0] === 'undefined'
			|| typeof array[0][1] === 'undefined'
		) {
			return null;
		}

		let time = array[0][1];

		let unit = typeof array[0][2] !== 'undefined'
			? array[0][2]
			: 's';

		switch (unit) {
			case 'ms':
				return time;

			case 's':
				return 1000 * time;

			case 'm':
				return 60000 * time;

			case 'h':
				return 3600000 * time;

			default:
				return null;
		}
	}
}