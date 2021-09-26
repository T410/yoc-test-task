import { VideoEngagements } from "../../app.module";
/**
 * Calculates and returns the visibility percentage of the given element of the viewport
 * @param {object}
 * @returns {number} positive integer number
 */
const calculateVisibilityPercentage = ({
	top,
	bottom,
	viewportHeight,
}: {
	top: number;
	bottom: number;
	viewportHeight: number;
}): number => {
	let result: number = -1;
	if (isInViewport({ top, bottom, viewportHeight })) {
		//This if block may look confusing but note that this function will only get called when the element is visible on the viewport
		if (top < 0) {
			//If the element's top is less than 0, which means the element is "at least" 1 pixel above the viewport.
			result = (bottom / (bottom - top)) * 100;
		} else if (bottom > viewportHeight) {
			//If the element's bottom is greater than viewport height, which means the element is "at least" 1 pixel below the viewport.
			result = ((viewportHeight - top) / (bottom - top)) * 100;
		} else {
			//If the element's top is greater than 0 and its bottom is less than viewportHeight, that means it's 100% visible.
			result = 100;
		}
	}
	return Math.floor(result);
};

/**
 * Checks and returns boolean if the given element is visible on the viewport
 * @param {HTMLElement} element
 * @returns {boolean}
 */
const isInViewport = ({
	top,
	bottom,
	viewportHeight,
}: {
	top: number;
	bottom: number;
	viewportHeight: number;
}): boolean => {
	//If top of the element is less than viewportHeight and the bottom is greater than 0 that means the element is in the viewport
	return top < viewportHeight && bottom > 0;
};

/**
 * Fires engagements to the console. Note that this function is putting `ENGAGE_` string before engagementName. ie: `ENGAGE_${eventName}`
 * Data gets `timestamp` property and its value is `Date.now()`
 * @param {VideoEngagements} engagementName
 * @param {object} data
 */
const engage = (engagementName: VideoEngagements, data?: {}) => {
	console.log(`ENGAGE_${engagementName.toString()}`, { ...data, timestamp: Date.now() });
};

export { calculateVisibilityPercentage, isInViewport, engage };
