import { useEffect, useRef } from "react";
/**
 * To get the previous state. This can be handy for `useEffect`s when we only want to listen for one dependency change for the code block in callback to run.
 * @param {any} value
 * @returns previous value of the given parameter
 * @see https://reactjs.org/docs/hooks-faq.html#how-to-get-the-previous-props-or-state
 */
function usePrevious(value: any) {
	const ref = useRef();
	useEffect(() => {
		ref.current = value;
	}, [value]);
	return ref.current;
}

export { usePrevious };
