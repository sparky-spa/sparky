
export class Bind
{
	component_id = null;
	property_name = null;
	value = null;

	/**
	 * @param {Bind} data
	 */
	constructor(data)
	{
		this.component_id = data.component_id;
		this.property_name = data.property_name;
		this.value = data.value;
	}
}