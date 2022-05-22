
export class Listener
{
	component_name = null;
	event = null;
	event_type = null;
	callback = null;

	/**
	 * @param {Listener} data
	 */
	constructor(data)
	{
		this.component_name = data.component_name;
		this.event = data.event;
		this.event_type = data.event_type;
		this.callback = data.callback;
	}
}