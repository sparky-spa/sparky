import {Sparky} from "./Sparky";

document.addEventListener('DOMContentLoaded', function() {

	global.Sparky = new Sparky();

	document.dispatchEvent(new CustomEvent('SparkySpaSetConfig')); // it has to be initiated ones per a page load

	document.dispatchEvent(new CustomEvent('SparkySpaBeforeInit')); // it has to be initiated ones per a page load

	global.Sparky.init();

	document.dispatchEvent(new CustomEvent('SparkySpaInit')); // it has to be initiated ones pe a page load

	global.Sparky.afterInit();

});