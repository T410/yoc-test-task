import React from "react";
import { Video } from "./components/Video/Video";
import { engage } from "./helper";
export const App: React.FunctionComponent = () => (
	<>
		<Video engage={engage} />
	</>
);
