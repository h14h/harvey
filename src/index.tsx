/**
 * Harvey - CLI application for long-running AI conversations.
 */

import { render } from "ink";
import { HarveyApp } from "./ui/app";
import { StdinHandler } from "./ui/components/StdinHandler";

render(
	<>
		<HarveyApp />
		<StdinHandler />
	</>
);
