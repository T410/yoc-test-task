import React from "react";
import { Video } from "../Video";
import { isInViewport, calculateVisibilityPercentage, engage } from "../../../helper";
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/extend-expect";
import { render } from "@testing-library/react";
import { VideoEngagements } from "../../../app.module";

//Custom matcher interface
interface ExtendedMatchers extends jest.Matchers<void> {
	toContainEventListener: (key: string) => EventListener;
}
describe("test for helper", () => {
	it("calculates if HTML Element is visible on the viewport by given top, bottom, viewportHeight parameter", () => {
		let top = 100,
			bottom = 200,
			viewportHeight = 1000;
		expect(isInViewport({ top, bottom, viewportHeight })).toBe(true);

		top = -200;
		bottom = -100;
		viewportHeight = 1000;
		expect(isInViewport({ top, bottom, viewportHeight })).toBe(false);

		top = 1100;
		bottom = 1200;
		viewportHeight = 1000;
		expect(isInViewport({ top, bottom, viewportHeight })).toBe(false);
	});

	it("calculates visibility percentage of an HTML Element by given top, bottom, viewportHeight parameter", () => {
		//Viewport height is 1000
		//The element is at the top of the viewport with 100px offset to the bottom
		//bottom parameter is 200 which means that height of the element is 100 (bottom-top)
		let top = 100,
			bottom = 200,
			viewportHeight = 1000;
		expect(calculateVisibilityPercentage({ top, bottom, viewportHeight })).toBe(100);

		//The element is at the top of the viewport with -50px offset. 50 percent of it is visible
		top = -50;
		bottom = 50;
		viewportHeight = 1000;
		expect(calculateVisibilityPercentage({ top, bottom, viewportHeight })).toBe(50);

		//The element is at the bottom of the viewport with 10px offset. 90 percent of it is visible
		top = 990;
		bottom = 1090;
		viewportHeight = 1000;
		expect(calculateVisibilityPercentage({ top, bottom, viewportHeight })).toBe(10);
	});

	it("logs with this format `ENGAGE_${engagementName.toString()}`, { ...data, timestamp: Date.now() }", () => {
		console.log = jest.fn();
		Date.now = jest.fn(() => 1632700404338);

		engage(VideoEngagements.VIDEO_CAN_PLAY);
		expect(console.log).toHaveBeenCalledWith("ENGAGE_VIDEO_CAN_PLAY", { timestamp: Date.now() });

		engage(VideoEngagements.VIDEO_CAN_PLAY, { test: "QWE123" });
		expect(console.log).toHaveBeenCalledWith("ENGAGE_VIDEO_CAN_PLAY", { test: "QWE123", timestamp: Date.now() });
	});
});

describe("test for video adunit", () => {
	it("renders without an issue", () => {
		const { getByTestId } = render(<Video engage={engage} />);
		const video = getByTestId("video");
		expect(video).toBeInTheDocument;
	});

	it("binds listeners to document on didMount and remove them when it unmounts", () => {
		type EventListenerObjectArray = [{ eventName: string; cb: EventListener }];
		let eventListeners: EventListenerObjectArray = [] as unknown as EventListenerObjectArray;

		document.addEventListener = jest.fn((event: string, cb: EventListener) => {
			eventListeners.push({ eventName: event, cb });
		});
		document.removeEventListener = jest.fn((event: string, cb: EventListener) => {
			eventListeners.splice(
				eventListeners.findIndex((x) => x.eventName === event),
				1
			);
		});
		const { unmount } = render(<Video engage={engage} />);

		//Extending expect to match for the type EventListenerObjectArray
		expect.extend({
			toContainEventListener(received: EventListenerObjectArray, key: string): jest.CustomMatcherResult {
				const found = received.find(({ eventName }) => eventName === key);
				const pass: boolean = !!found && typeof found.cb === "function";
				const message: () => string = () =>
					pass ? "" : `Received ${received} does not have EventListenerObjectArray with the ${key}`;
				return {
					message,
					pass,
				};
			},
		});

		(expect(eventListeners) as unknown as ExtendedMatchers).toContainEventListener("scroll");
		(expect(eventListeners) as unknown as ExtendedMatchers).toContainEventListener("visibilitychange");

		unmount();

		expect(eventListeners).toEqual([]);
	});

	/**
	 * I have tried to mock the engage function that passed to the Video component and test the engagements
	 * but I think jsdom prevents loading and playing the media elements too
	 */
	// it("fires VIDEO_LOAD_START when it starts loading", async () => {
	// 	const mock = (name: VideoEngagements, data?: {}) => {};
	// 	// console.log = jest.fn();
	// 	const { getByTestId } = render(<Video engage={mock} />);
	// 	const video = getByTestId("video") as HTMLVideoElement;
	// 	fireEvent(video, new Event("play", { bubbles: false }));
	// 	await waitFor(() => expect(console.log).toHaveBeenCalledWith("VIDEO_LOAD_START", { timestamp: Date.now() }), {
	// 		timeout: 5000,
	// 	});
	// });
});
