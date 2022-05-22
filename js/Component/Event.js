
export class Event
{
	name = null;
	component_name = null;
	data = [];
	element = null;

	/**
	 * @param {Event} data
	 */
	constructor(data)
	{
		this.name = data.name;
		this.component_name = data.component_name;
		this.data = data.data;

		if (data.element) {
			this.element = data.element;
		}
	}
}