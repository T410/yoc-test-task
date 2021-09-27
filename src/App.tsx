import React from "react";
import { Video } from "./components/Video/Video";
import { engage } from "./helper";
export const App: React.FunctionComponent = () => (
	//I have passed the engagement function from outside in hope for mocking it and testing it
	<>
		<Video engage={engage} />
	</>
);
