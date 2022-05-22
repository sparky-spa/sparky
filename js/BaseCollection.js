
export class BaseCollection
{
	#items = [];

	/**
	 * @param {function} condition (item)
	 * @return {boolean}
	 */
	has(condition)
	{
		return Boolean(this.get(condition, false));
	}

	/**
	 * @param {any} item
	 * @return {BaseCollection}
	 */
	push(item)
	{
		if (!item.id) {
			item.id = window.performance.now() + '.' + Math.floor(Math.random() * 10000000000);
		}

		this.#items.push(item);

		return this;
	}

	/**
	 * @param {function} condition (item, id) => {}
	 *
	 * @return {BaseCollection}
	 */
	forget(condition)
	{
		this.#items.forEach((item) => {
			if (!condition(item, item.id)) {
				return;
			}

			this.remove(item);
		});

		return this;
	}

	/**
	 * @param {object} target_item
	 * @return {BaseCollection}
	 */
	remove(target_item)
	{
		let item_index = null;

		this.#items.some((item, index) => {
			if (item.id !== target_item.id) {
				return false;
			}

			item_index = index;

			return true
		});

		if (item_index === null) {
			return this;
		}

		this.#items.splice(item_index, 1);

		return this;
	}

	/**
	 * @param {function} condition (item) => {}
	 * @param {any} default_value
	 *
	 * @return {any[]}
	 */
	get(condition, default_value = [])
	{
		let result = this.#items.filter(condition);

		return result.length > 0 ? result : default_value;
	}

	/**
	 * @param {function} condition (item)
	 * @param {any} default_value
	 *
	 * @return {any}
	 */
	getFirst(condition, default_value = null)
	{
		let result = this.get(condition, [default_value]);

		return result[0];
	}

	/**
	 *
	 * @param {function} callback (item, index, array) => {}
	 * @param {any} thisArg
	 */
	forEach(callback, thisArg = null)
	{
		this.#items.forEach(callback, thisArg);
	}

	//endregion
}