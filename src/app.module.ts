export enum VideoEngagements {
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
export enum EventBy {
	USER = "USER",
	AUTO = "AUTO",
}

export interface VideoWrapperProps {
	engage: (engagementName: VideoEngagements, data?: {}) => void;
}

export interface VideoControlProps {
	isMuted: boolean;
	changeMute: (val: boolean) => void;
}

export interface VideoProps {
	isMuted: boolean;
	onCustomEvent: (e: VideoEngagements, data?: {}) => void;
	setIsFinished: (val: boolean) => void;
}
