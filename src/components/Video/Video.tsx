import React, { useEffect, useRef, useState } from "react";
import style from "./Video.module.css";
import { close, volume_off, volume_on } from "../../assets";

interface VideoControlProps {
	changeMute: (val: boolean) => void;
}

interface VideoProps {
	isMuted: boolean;
}

const VideoControls: React.FunctionComponent<VideoControlProps> = ({ changeMute }) => {
	const imgRef = useRef<HTMLImageElement>(null);
	const [isMuted, setIsMuted] = useState(true);

	useEffect(() => {
		if (imgRef.current) {
			if (isMuted) {
				imgRef.current.src = volume_off;
			} else {
				imgRef.current.src = volume_on;
			}
		}
	}, [isMuted]);
	const onClickMute = () => {
		setIsMuted(!isMuted);
		changeMute(!isMuted);
	};

	return (
		<>
			<div className={style.closeButtonContainer}>
				<img src={close} />
			</div>
			<div className={style.muteButtonContainer} onClick={onClickMute}>
				<img src={volume_off} ref={imgRef} />
			</div>
		</>
	);
};

const Video: React.FunctionComponent<VideoProps> = ({ isMuted }) => {
	const videoRef = useRef<HTMLVideoElement>(null);

	//Runs when the Video mounts
	useEffect(() => {
		/**
		 * Checks and returns boolean if the given element is visible on the viewport
		 * @param {HTMLElement} element
		 * @returns {boolean}
		 */
		const isOnViewport = (element: HTMLElement): boolean => {
			const { top, bottom } = element.getBoundingClientRect();
			return top < window.innerHeight && bottom > 0;
		};

		/**
		 * Calculates and returns the visibility percentage of the given element of the viewport
		 * @param {HTMLElement} element
		 * @returns {number} positive integer number
		 */
		const calculateVisibilityPercentage = (element: HTMLElement): number => {
			const { height, top, bottom } = element.getBoundingClientRect();
			// Visual Viewport seems promising. See https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API
			const viewportHeight = window.visualViewport?.height | window.innerHeight;
			let result: number;

			if (top < 0) {
				//If the element's top is less than 0, which means the element is "at least" 1 pixel above the viewport.
				result = (bottom / height) * 100;
			} else if (bottom > viewportHeight) {
				//If the element's bottom is greater than viewport height, which means the element is "at least" 1 pixel below the viewport.
				result = ((viewportHeight - top) / height) * 100;
			} else {
				result = 100;
			}
			return Math.floor(result);
		};

		const scrollListener = () => {
			let isVisible = false,
				visiblePercentage: number;
			if (videoRef.current) {
				isVisible = isOnViewport(videoRef.current);
				if (isVisible) {
					visiblePercentage = calculateVisibilityPercentage(videoRef.current);
					if (visiblePercentage >= 50) {
						videoRef.current.play();
					} else {
						videoRef.current.pause();
					}
				}
			}
		};

		document.addEventListener("scroll", scrollListener);

		//To remove scroll event listener when "will unmount" occurs
		return () => {
			document.removeEventListener("scroll", scrollListener);
		};
	}, []);

	console.log(isMuted);
	if (!isMuted) {
		videoRef.current?.play();
	}

	return (
		<video
			className={style.innerContainer}
			src="https://cdn.yoc.com/ad/demo/airbnb.mp4"
			ref={videoRef}
			muted={isMuted}
			autoPlay={false}
			controls={false}
			playsInline={true}
		></video>
	);
};

const VideoWrapper: React.FunctionComponent = () => {
	const [isMuted, setIsMuted] = useState(true);

	const onClickMute = (isMuted: boolean): void => {
		setIsMuted(isMuted);
	};

	return (
		<div className={style.outerContainer}>
			<VideoControls changeMute={onClickMute} />
			<div className={style.innerContainer}>
				<Video isMuted={isMuted} />
			</div>
		</div>
	);
};

export { VideoWrapper as Video };
