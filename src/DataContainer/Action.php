<?php

namespace SparkySpa\DataContainer;

use WebXID\EDMo\AbstractClass\BasicDataContainer;

/**
 * @property string component_name
 * @property string name
 * @property array data
 * @property string type
 */
class Action extends BasicDataContainer
{
    const TYPE_LOUD = 'loud';
    const TYPE_INIT = 'init';
    const TYPE_INIT_ANY = 'init_any';
}