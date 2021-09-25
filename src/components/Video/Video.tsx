import React, { useEffect, useRef, useState, useCallback } from "react";
import style from "./Video.module.css";
import { poster, volume_off, volume_on } from "../../assets";

enum VideoEngagements {
	BLUR = "BLUR",
	FOCUS = "FOCUS",
	VIDEO_LOAD_START = "VIDEO_LOAD_START",
	VIDEO_CAN_PLAY = "VIDEO_CAN_PLAY",
	VIDEO_MUTE = "VIDEO_MUTE",
	VIDEO_UNMUTE = "VIDEO_UNMUTE",
	VIDEO_PLAY = "VIDEO_PLAY",
	VIDEO_FIRST_QUARTILE = "VIDEO_FIRST_QUARTILE",
	VIDEO_HALF = "VIDEO_HALF",
	VIDEO_THIRD_QUARTILE = "VIDEO_THIRD_QUARTILE",
	VIDEO_FINISH = "VIDEO_FINISH",
	VIDEO_PAUSE = "VIDEO_PAUSE",
	VIDEO_VIEWED = "VIDEO_VIEWED",
}

//Actions caused by the user or automatically
enum EventBy {
	USER = "USER",
	AUTO = "AUTO",
}

interface VideoControlProps {
	isMuted: boolean;
	changeMute: (val: boolean) => void;
}

interface VideoProps {
	isMuted: boolean;
	onCustomEvent: (e: VideoEngagements, data?: {}) => void;
	setIsFinished: (val: boolean) => void;
}

const VideoControls: React.FunctionComponent<VideoControlProps> = ({ isMuted, changeMute }) => {
	//Storing the mute button element in a ref to change its src when it's clicked/tapped
	//I don't actually know if replacing the src costs more (performance wise) than having 2 image elements and showing/hiding them when clicking/tapping
	//I decided to keep 1 image and replace its src. Otherwise I would have to store 2 image elements in 2 refs
	//Well, of course I could access the children by accessing `element.children` or `element.getElementsByTagName("img")` but I don't use them since they appear wrong in React projects
	//And because, Mother React gave us useRef!
	const imgRef = useRef<HTMLImageElement>(null);

	useEffect(() => {
		if (imgRef.current) {
			if (isMuted) {
				imgRef.current.src = volume_off;
				imgRef.current.alt = "volume off button";
			} else {
				imgRef.current.src = volume_on;
				imgRef.current.alt = "volume on button";
			}
		}
	}, [isMuted]);

	/**
	 * Calls changeMute function that was passed from VideWrapper
	 */
	const onClickMute = (): void => {
		changeMute(!isMuted);
	};

	return (
		<>
			<div className={style.muteButtonContainer} onClick={onClickMute}>
				<img src={volume_off} ref={imgRef} alt={"volume off button"} />
			</div>
		</>
	);
};

const Video: React.FunctionComponent<VideoProps> = ({ isMuted, onCustomEvent, setIsFinished }) => {
	//Video element
	const videoRef = useRef<HTMLVideoElement>(null);

	//Video states that helps keep track of what's going on
	const [isPlaying, setIsPlaying] = useState(false);
	const [visiblePercentage, setVisiblePercentage] = useState(0); //This is the actual visibility percentage of the video.
	const [blur, setBlur] = useState(false); //Using the term blur/focus throughout the code. Blur is fired when the user tasks away from the page, and focus is fired vice versa.

	//Video event fire flags
	const [videoViewed, setVideoViewed] = useState(false);
	const [firstQuartileFired, setFirstQuartileFired] = useState(false);
	const [halfFired, setHalfFired] = useState(false);
	const [thirdQuartileFired, setThirdQuartileFired] = useState(false);
	const [ended, setEnded] = useState(false);

	/**
	 * Checks and returns boolean if the given element is visible on the viewport
	 * @param {HTMLElement} element
	 * @returns {boolean}
	 */
	const isInViewport = (element: HTMLElement): boolean => {
		const { top, bottom } = element.getBoundingClientRect();
		// Visual Viewport seems promising. See https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API
		const viewportHeight = window.visualViewport?.height | window.innerHeight;
		//If top of the element is less than viewportHeight and the bottom is greater than 0 that means the element is in the viewport
		return top < viewportHeight && bottom > 0;
	};

	/**
	 * Calculates and returns the visibility percentage of the given element of the viewport
	 * @param {HTMLElement} element
	 * @returns {number} positive integer number
	 */
	const calculateVisibilityPercentage = (element: HTMLElement): number => {
		const { height, top, bottom } = element.getBoundingClientRect();
		const viewportHeight = window.visualViewport?.height | window.innerHeight;
		let result: number;

		//This if block may look confusing but note that this function will only get called when the element is visible on the viewport
		if (top < 0) {
			//If the element's top is less than 0, which means the element is "at least" 1 pixel above the viewport.
			result = (bottom / height) * 100;
		} else if (bottom > viewportHeight) {
			//If the element's bottom is greater than viewport height, which means the element is "at least" 1 pixel below the viewport.
			result = ((viewportHeight - top) / height) * 100;
		} else {
			//If the element's top is greater than 0 and its bottom is less than viewportHeight, that means it's 100% visible.
			result = 100;
		}
		return Math.floor(result);
	};

	/**
	 *
	 * @param {boolean} play Video will play based on this boolean if it can play
	 * @param data
	 */
	const playPauseHandler = useCallback(
		(play: boolean, eventBy: EventBy = EventBy.AUTO): void => {
			if (play !== isPlaying) {
				setIsPlaying(play);
				if (videoRef.current) {
					if (play) {
						// setLastPlayTime(Date.now());
						videoRef.current.play();
						onCustomEvent(VideoEngagements.VIDEO_PLAY, { eventBy });
					} else {
						videoRef.current.pause();
						onCustomEvent(VideoEngagements.VIDEO_PAUSE, { eventBy });
					}
				}
			}
		},
		[onCustomEvent, isPlaying]
	);

	const timeUpdateListener = (e: React.SyntheticEvent): void => {
		const video = e.target as HTMLVideoElement,
			{ currentTime } = video;
		if (!videoViewed) {
			if (currentTime >= 2) {
				setVideoViewed(true);
				onCustomEvent(VideoEngagements.VIDEO_VIEWED);
			}
		}

		if (!firstQuartileFired) {
			if (currentTime > video.duration * 0.25) {
				setFirstQuartileFired(true);
				onCustomEvent(VideoEngagements.VIDEO_FIRST_QUARTILE);
			}
		} else if (!halfFired) {
			if (currentTime > video.duration * 0.5) {
				setHalfFired(true);
				onCustomEvent(VideoEngagements.VIDEO_HALF);
			}
		} else if (!thirdQuartileFired) {
			if (currentTime > video.duration * 0.75) {
				setThirdQuartileFired(true);
				onCustomEvent(VideoEngagements.VIDEO_THIRD_QUARTILE);
			}
		} else if (!ended) {
			//I had issues with onEnded event. I used setEnded(true) in the listener. But
			//I had to manually check if the video is ended or not
			if (currentTime >= video.duration) {
				// setIsPlaying(false);
				document.removeEventListener("scroll", scrollListener);
				setEnded(true);
				setIsFinished(true);
				onCustomEvent(VideoEngagements.VIDEO_FINISH);
			}
		}
	};

	const loadStartListener = () => {
		onCustomEvent(VideoEngagements.VIDEO_LOAD_START);
	};

	/**
	 * Listener function that binds to the document's scroll event. Calculations for the visibility of the adunit are done here
	 */
	const scrollListener = useCallback(() => {
		if (videoRef.current) {
			const isVisible = isInViewport(videoRef.current);
			if (isVisible) {
				setVisiblePercentage(calculateVisibilityPercentage(videoRef.current));
				if (visiblePercentage >= 50) {
					!ended && playPauseHandler(true);
				} else {
					playPauseHandler(false);
				}
			} else if (visiblePercentage > 0) {
				setVisiblePercentage(0);
				playPauseHandler(false);
			}
		}
	}, [ended, visiblePercentage, playPauseHandler]);

	const blurFocusListener = useCallback(() => {
		if (document.visibilityState === "hidden") {
			setBlur(true);
			onCustomEvent(VideoEngagements.BLUR);
		} else {
			onCustomEvent(VideoEngagements.FOCUS);
			setBlur(false);
		}
	}, [onCustomEvent]);

	useEffect(() => {
		if (blur) {
			playPauseHandler(false);
		} else if (!ended && visiblePercentage >= 50) {
			playPauseHandler(true);
		}
	}, [blur, ended, visiblePercentage, playPauseHandler]);

	useEffect(() => {
		document.addEventListener("scroll", scrollListener);
		document.addEventListener("visibilitychange", blurFocusListener);

		//For cleaning up the event listeners
		return () => {
			document.removeEventListener("scroll", scrollListener);
			document.removeEventListener("visibilitychange", blurFocusListener);
		};
	}, [scrollListener, blurFocusListener]);

	return (
		<video
			className={style.innerContainer}
			src="https://cdn.yoc.com/ad/demo/airbnb.mp4"
			ref={videoRef}
			muted={isMuted}
			autoPlay={false}
			controls={false}
			onLoadStart={loadStartListener}
			onTimeUpdate={timeUpdateListener}
			playsInline={true}
		></video>
	);
};

const VideoWrapper: React.FunctionComponent = () => {
	//To pass isMuted flag to Video Component from VideoControls Component.
	//By passing setIsMuted function to VideoControls, isMuted state mutes/unmutes the video
	const [isMuted, setIsMuted] = useState(true);

	//Passing this hook to video to trigger "video finish". Doing this because iOS behaves weird when you blur and focus the video, after the video finishes. Just shows white screen.
	//Then use "isFinished" to hide/show the video and the poster image respectively.
	//PS: using poster attribute also doesn't work after the video finishes.
	//Well, this behaviour is like hiding the video after it finishes and showing the endcard, obviously
	const [isFinished, setIsFinished] = useState(false);

	/**
	 * Fires engagements to the console. Note that this function is putting `ENGAGE_` string before engagementName. ie: `ENGAGE_${eventName}`
	 * Data gets `timestamp` property and its value is `Date.now()`
	 * @param {VideoEngagements} engagementName
	 * @param {object} data
	 */
	const engage = (engagementName: VideoEngagements, data?: {}) => {
		console.log(`ENGAGE_${engagementName.toString()}`, { ...data, timestamp: Date.now() });
	};

	/**
	 * Gets the new mute state from VideoControls, updates `isMuted` state and fires engagement according to that
	 * @param {boolean} val New mute state
	 */
	const changeMute = (val: boolean) => {
		setIsMuted(val);
		const engagementName = val ? VideoEngagements.VIDEO_MUTE : VideoEngagements.VIDEO_UNMUTE;
		engage(engagementName, { eventBy: EventBy.USER });
	};

	return (
		<div className={style.outerContainer}>
			{!isFinished ? (
				<div>
					<VideoControls isMuted={isMuted} changeMute={changeMute} />
					<div className={style.innerContainer}>
						<Video isMuted={isMuted} onCustomEvent={engage} setIsFinished={setIsFinished} />
					</div>
				</div>
			) : (
				<img className={style.poster} src={poster} alt="airbnb ad poster" />
			)}
		</div>
	);
};

export { VideoWrapper as Video };
