export interface Chat {
	id: number;
	title: string;
	anchorPrompt: string;
	anchorSummary: string | null;
	turnCount: number;
	createdAt: number;
	updatedAt: number;
}

export interface Message {
	id: number;
	chatId: number;
	role: "user" | "assistant" | "system";
	content: string;
	turnNumber: number;
	createdAt: number;
}

export interface Summary {
	id: number;
	chatId: number;
	type: "history";
	content: string;
	generatedAtTurn: number;
	createdAt: number;
}

export interface GlobalConfig {
	id: 1;
	globalTone: string | null;
	globalToneSummary: string | null;
	updatedAt: number;
}

export interface AppConfig {
	openai_api_key: string;
	turn_frequency: number;
}
