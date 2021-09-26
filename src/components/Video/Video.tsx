import React, { useEffect, useRef, useState, useCallback } from "react";
import { usePrevious } from "../../CustomHooks";
import { calculateVisibilityPercentage, engage } from "./helper";
import style from "./Video.module.css";
import { poster, volume_off, volume_on } from "../../assets";
import { EventBy, VideoEngagements, VideoControlProps, VideoProps } from "../../app.module";

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
	const prevBlur = usePrevious(blur); //Previous blur value. A custom hook

	//Video event fire flags
	const [videoViewed, setVideoViewed] = useState(false);
	const [firstQuartileFired, setFirstQuartileFired] = useState(false);
	const [halfFired, setHalfFired] = useState(false);
	const [thirdQuartileFired, setThirdQuartileFired] = useState(false);
	const [ended, setEnded] = useState(false);

	/**
	 *
	 * @param {boolean} play Video will play based on this boolean if it can play
	 * @param data
	 */
	const playPauseHandler = useCallback(
		(play: boolean): void => {
			//If isPlaying is not equal to play and videRef.current exists
			if (videoRef.current) {
				if (play && !ended) {
					videoRef.current.play();
					onCustomEvent(VideoEngagements.VIDEO_PLAY, { eventBy: EventBy.AUTO });
					setIsPlaying(true);
				} else {
					videoRef.current.pause();
					onCustomEvent(VideoEngagements.VIDEO_PAUSE, { eventBy: EventBy.AUTO });
					setIsPlaying(false);
				}
			}
		},
		[onCustomEvent, ended]
	);

	/**
	 * Time update listener function of the video
	 * @param {React.SyntheticEvent} e
	 */
	const timeUpdateListener = (e: React.SyntheticEvent): void => {
		const video = e.target as HTMLVideoElement,
			{ currentTime } = video;

		if (!videoViewed) {
			//2 seconds view time
			if (currentTime >= 2) {
				setVideoViewed(true);
				onCustomEvent(VideoEngagements.VIDEO_VIEWED);
			}
		}
		if (!firstQuartileFired) {
			//25% view time
			if (currentTime > video.duration * 0.25) {
				setFirstQuartileFired(true);
				onCustomEvent(VideoEngagements.VIDEO_FIRST_QUARTILE);
			}
		} else if (!halfFired) {
			//50% view time
			if (currentTime > video.duration * 0.5) {
				setHalfFired(true);
				onCustomEvent(VideoEngagements.VIDEO_HALF);
			}
		} else if (!thirdQuartileFired) {
			//75% view time
			if (currentTime > video.duration * 0.75) {
				setThirdQuartileFired(true);
				onCustomEvent(VideoEngagements.VIDEO_THIRD_QUARTILE);
			}
		} else if (!ended) {
			//100% view time
			//I had issues with onEnded event. I used setEnded(true) in the listener
			//I had to manually check if the video is ended or not
			if (videoRef.current?.ended) {
				//Remove the scrollListener since the video does not loop and we won't be needing it anymore
				document.removeEventListener("scroll", scrollListener);
				setEnded(true);
				//Caling this with ended parameter. Note that this function was passed from VideoWrapper
				setIsFinished(true);
				onCustomEvent(VideoEngagements.VIDEO_FINISH);
			}
		}
	};

	/**
	 * To fire engagement `VIDEO_LOAD_START`
	 * Combining `VIDEO_LOAD_START` and `VIDEO_PLAY` may give us some idea about the content quality (Will the user skip reading and scroll to the bottom fast or not)
	 */
	const loadStartListener = () => {
		onCustomEvent(VideoEngagements.VIDEO_LOAD_START);
	};

	/**
	 * Listener function that binds to the document's scroll event. Calculations for the visibility of the adunit are done here
	 */
	const scrollListener = useCallback(() => {
		if (videoRef.current) {
			const { top, bottom } = videoRef.current.getBoundingClientRect();
			const percentage = calculateVisibilityPercentage({
				top,
				bottom,
				viewportHeight: window.visualViewport?.height | window.innerHeight, // Visual Viewport seems promising. See https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API
			});
			setVisiblePercentage(percentage);
			if (percentage >= 50) {
				//If the visiblity percentage is greater than or equal to 50%, then play it
				!isPlaying && playPauseHandler(true);
			} else {
				//If the video can not be played, then pause it
				isPlaying && playPauseHandler(false);
			}
		}
	}, [playPauseHandler, isPlaying]);

	/**
	 * visibilitychange listener function that updates blur state
	 */
	const blurFocusListener = useCallback(() => {
		if (document.visibilityState === "hidden") {
			setBlur(true);
			onCustomEvent(VideoEngagements.BLUR);
		} else {
			setBlur(false);
			onCustomEvent(VideoEngagements.FOCUS);
		}
	}, [onCustomEvent]);

	useEffect(() => {
		//Checking if blur value has changed or not. So the code block in this if will only run when blur dependency changes.
		//Normally when one of the dependency changes, the callback runs
		//Undefined check is to prevent first run. If we are to remove that then it automatically tries to run the video when the page loads
		if (prevBlur !== undefined && prevBlur !== blur) {
			if (blur && isPlaying) {
				//If the user task away from the page (Goes to home screen of their device or goes to another tab), pause the video
				playPauseHandler(false);
			} else if (!ended && visiblePercentage >= 50) {
				//If the video has not yet been finished and it is more than 50% visible in the viewport, play the video
				playPauseHandler(true);
			}
		}
	}, [prevBlur, blur, visiblePercentage, isPlaying, ended, playPauseHandler]);

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
			data-testid="video"
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
				<img className={style.poster} src={poster} data-testid="poster" alt="airbnb ad poster" />
			)}
		</div>
	);
};

export { VideoWrapper as Video };
