/**
 * Tests for the store reducer and state management.
 */

import { describe, it, expect } from "bun:test";
import type { AppState, AppAction } from "./types";

const initialState: AppState = {
  mode: "normal",
  focus: "chat-list",
  chats: [],
  selectedChatId: null,
  messages: [],
  inputText: "",
  chatListOffset: 0,
  messageViewOffset: 0,
  tokenCount: 0,
  error: null,
  activeModal: null,
  modalInput: "",
  streaming: { isStreaming: false, content: "" },
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "setMode":
      return { ...state, mode: action.mode };
    case "setFocus":
      return { ...state, focus: action.focus };
    case "setChats":
      return { ...state, chats: action.chats };
    case "selectChat":
      return {
        ...state,
        selectedChatId: action.chatId,
        messages: [],
        messageViewOffset: 0,
      };
    case "setMessages":
      return { ...state, messages: action.messages };
    case "setInputText":
      return { ...state, inputText: action.text };
    case "appendInput":
      return { ...state, inputText: state.inputText + action.text };
    case "deleteInputChar":
      return {
        ...state,
        inputText: state.inputText.slice(0, -1),
      };
    case "deleteInputWord":
      return {
        ...state,
        inputText: state.inputText.replace(/\S+\s*$/, "").trimEnd(),
      };
    case "clearInput":
      return { ...state, inputText: "" };
    case "scrollChatList":
      return {
        ...state,
        chatListOffset: Math.max(0, state.chatListOffset + action.offset),
      };
    case "scrollMessageView":
      return {
        ...state,
        messageViewOffset: Math.max(0, state.messageViewOffset + action.offset),
      };
    case "setTokenCount":
      return { ...state, tokenCount: action.count };
    case "setError":
      return { ...state, error: action.error };
    case "openModal":
      return {
        ...state,
        activeModal: action.modal,
        modalInput: "",
        mode: "insert",
      };
    case "closeModal":
      return {
        ...state,
        activeModal: null,
        modalInput: "",
        mode: "normal",
      };
    case "setModalInput":
      return { ...state, modalInput: action.text };
    case "appendModalInput":
      return { ...state, modalInput: state.modalInput + action.text };
    case "deleteModalInputChar":
      return { ...state, modalInput: state.modalInput.slice(0, -1) };
    case "startStreaming":
      return { ...state, streaming: { isStreaming: true, content: "" } };
    case "appendStreaming":
      return {
        ...state,
        streaming: {
          isStreaming: true,
          content: state.streaming.content + action.content,
        },
      };
    case "completeStreaming":
      return {
        ...state,
        messages: [...state.messages, action.message],
        streaming: { isStreaming: false, content: "" },
      };
    case "cancelStreaming":
      return { ...state, streaming: { isStreaming: false, content: "" } };
    default:
      return state;
  }
}

describe("Store Reducer", () => {
  it("should set mode", () => {
    const result = reducer(initialState, { type: "setMode", mode: "insert" });
    expect(result.mode).toBe("insert");
  });

  it("should set focus", () => {
    const result = reducer(initialState, { type: "setFocus", focus: "input" });
    expect(result.focus).toBe("input");
  });

  it("should set chats", () => {
    const chats = [
      { id: 1, title: "Test Chat", anchorPrompt: "test", anchorSummary: null, turnCount: 0, createdAt: 0, updatedAt: 0 },
    ];
    const result = reducer(initialState, { type: "setChats", chats });
    expect(result.chats).toEqual(chats);
  });

  it("should select chat and clear messages", () => {
    const stateWithMessages = {
      ...initialState,
      messages: [{ id: 1, chatId: 1, role: "user" as const, content: "test", turnNumber: 1, createdAt: 0 }],
      messageViewOffset: 5,
    };
    const result = reducer(stateWithMessages, { type: "selectChat", chatId: 1 });
    expect(result.selectedChatId).toBe(1);
    expect(result.messages).toEqual([]);
    expect(result.messageViewOffset).toBe(0);
  });

  it("should set input text", () => {
    const result = reducer(initialState, { type: "setInputText", text: "hello" });
    expect(result.inputText).toBe("hello");
  });

  it("should append to input text", () => {
    const state = { ...initialState, inputText: "hello" };
    const result = reducer(state, { type: "appendInput", text: " world" });
    expect(result.inputText).toBe("hello world");
  });

  it("should delete input character", () => {
    const state = { ...initialState, inputText: "hello" };
    const result = reducer(state, { type: "deleteInputChar" });
    expect(result.inputText).toBe("hell");
  });

  it("should delete input word", () => {
    const state = { ...initialState, inputText: "hello world" };
    const result = reducer(state, { type: "deleteInputWord" });
    expect(result.inputText).toBe("hello");
  });

  it("should clear input", () => {
    const state = { ...initialState, inputText: "hello" };
    const result = reducer(state, { type: "clearInput" });
    expect(result.inputText).toBe("");
  });

  it("should scroll chat list", () => {
    const result = reducer(initialState, { type: "scrollChatList", offset: 5 });
    expect(result.chatListOffset).toBe(5);
  });

  it("should not scroll chat list below zero", () => {
    const state = { ...initialState, chatListOffset: 3 };
    const result = reducer(state, { type: "scrollChatList", offset: -5 });
    expect(result.chatListOffset).toBe(0);
  });

  it("should set token count", () => {
    const result = reducer(initialState, { type: "setTokenCount", count: 1000 });
    expect(result.tokenCount).toBe(1000);
  });

  it("should set error", () => {
    const result = reducer(initialState, { type: "setError", error: "Test error" });
    expect(result.error).toBe("Test error");
  });

  it("should clear error", () => {
    const state = { ...initialState, error: "Test error" };
    const result = reducer(state, { type: "setError", error: null });
    expect(result.error).toBeNull();
  });

  // Modal state tests
  it("should open new-chat modal", () => {
    const result = reducer(initialState, { type: "openModal", modal: "new-chat" });
    expect(result.activeModal).toBe("new-chat");
    expect(result.modalInput).toBe("");
    expect(result.mode).toBe("insert");
  });

  it("should open edit-tone modal", () => {
    const result = reducer(initialState, { type: "openModal", modal: "edit-tone" });
    expect(result.activeModal).toBe("edit-tone");
    expect(result.mode).toBe("insert");
  });

  it("should close modal and return to normal mode", () => {
    const state = { ...initialState, activeModal: "new-chat", modalInput: "test", mode: "insert" };
    const result = reducer(state, { type: "closeModal" });
    expect(result.activeModal).toBeNull();
    expect(result.modalInput).toBe("");
    expect(result.mode).toBe("normal");
  });

  it("should set modal input", () => {
    const result = reducer(initialState, { type: "setModalInput", text: "test input" });
    expect(result.modalInput).toBe("test input");
  });

  it("should append to modal input", () => {
    const state = { ...initialState, modalInput: "hello" };
    const result = reducer(state, { type: "appendModalInput", text: " world" });
    expect(result.modalInput).toBe("hello world");
  });

  it("should delete modal input character", () => {
    const state = { ...initialState, modalInput: "hello" };
    const result = reducer(state, { type: "deleteModalInputChar" });
    expect(result.modalInput).toBe("hell");
  });

  // Streaming state tests
  it("should start streaming", () => {
    const result = reducer(initialState, { type: "startStreaming" });
    expect(result.streaming.isStreaming).toBe(true);
    expect(result.streaming.content).toBe("");
  });

  it("should append streaming content", () => {
    const state = { ...initialState, streaming: { isStreaming: true, content: "Hello" } };
    const result = reducer(state, { type: "appendStreaming", content: " World" });
    expect(result.streaming.isStreaming).toBe(true);
    expect(result.streaming.content).toBe("Hello World");
  });

  it("should complete streaming and add message", () => {
    const state = { ...initialState, streaming: { isStreaming: true, content: "Response" } };
    const message = { id: 1, chatId: 1, role: "assistant" as const, content: "Response", turnNumber: 1, createdAt: 0 };
    const result = reducer(state, { type: "completeStreaming", message });
    expect(result.streaming.isStreaming).toBe(false);
    expect(result.streaming.content).toBe("");
    expect(result.messages).toContainEqual(message);
  });

  it("should cancel streaming", () => {
    const state = { ...initialState, streaming: { isStreaming: true, content: "Partial" } };
    const result = reducer(state, { type: "cancelStreaming" });
    expect(result.streaming.isStreaming).toBe(false);
    expect(result.streaming.content).toBe("");
  });
});
