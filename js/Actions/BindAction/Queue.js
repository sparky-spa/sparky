
export class Queue
{
	component_id = null;
	property_name = null;
	timeout = null;

	/**
	 * @param {Queue} data
	 */
	constructor(data) {
		this.component_id = data.component_id;
		this.property_name = data.property_name;
		this.timeout = data.timeout;
	}
}