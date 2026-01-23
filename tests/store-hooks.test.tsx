/**
 * Tests for store hooks to ensure stable function references.
 *
 * These tests prevent regressions of the "Maximum update depth exceeded" bug (#39)
 * which was caused by hooks returning new function references on every render,
 * leading to infinite useEffect loops.
 */

import { describe, expect, test } from "bun:test";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { StoreProvider, useInputTextActions, useModal, useStreaming } from "../src/ui/store";

/**
 * Wrapper component for testing hooks within the StoreProvider context.
 */
function wrapper({ children }: { children: ReactNode }) {
	return <StoreProvider>{children}</StoreProvider>;
}

describe("store hooks stability", () => {
	describe("useInputTextActions", () => {
		test("returns stable function references across re-renders", () => {
			const { result, rerender } = renderHook(() => useInputTextActions(), { wrapper });

			const initialSetText = result.current.setText;
			const initialAppend = result.current.append;
			const initialDeleteChar = result.current.deleteChar;
			const initialDeleteWord = result.current.deleteWord;
			const initialClear = result.current.clear;

			// Trigger a re-render
			rerender();

			// All function references should remain stable
			expect(result.current.setText).toBe(initialSetText);
			expect(result.current.append).toBe(initialAppend);
			expect(result.current.deleteChar).toBe(initialDeleteChar);
			expect(result.current.deleteWord).toBe(initialDeleteWord);
			expect(result.current.clear).toBe(initialClear);
		});

		test("functions remain stable after multiple re-renders", () => {
			const { result, rerender } = renderHook(() => useInputTextActions(), { wrapper });

			const initialRefs = { ...result.current };

			// Multiple re-renders
			for (let i = 0; i < 5; i++) {
				rerender();
			}

			expect(result.current.setText).toBe(initialRefs.setText);
			expect(result.current.append).toBe(initialRefs.append);
			expect(result.current.deleteChar).toBe(initialRefs.deleteChar);
			expect(result.current.deleteWord).toBe(initialRefs.deleteWord);
			expect(result.current.clear).toBe(initialRefs.clear);
		});
	});

	describe("useModal", () => {
		test("returns stable function references across re-renders", () => {
			const { result, rerender } = renderHook(() => useModal(), { wrapper });

			const initialOpenModal = result.current.openModal;
			const initialCloseModal = result.current.closeModal;
			const initialSetModalInput = result.current.setModalInput;
			const initialAppendModalInput = result.current.appendModalInput;
			const initialDeleteModalInputChar = result.current.deleteModalInputChar;

			// Trigger a re-render
			rerender();

			// All function references should remain stable
			expect(result.current.openModal).toBe(initialOpenModal);
			expect(result.current.closeModal).toBe(initialCloseModal);
			expect(result.current.setModalInput).toBe(initialSetModalInput);
			expect(result.current.appendModalInput).toBe(initialAppendModalInput);
			expect(result.current.deleteModalInputChar).toBe(initialDeleteModalInputChar);
		});

		test("functions remain stable after multiple re-renders", () => {
			const { result, rerender } = renderHook(() => useModal(), { wrapper });

			const initialRefs = {
				openModal: result.current.openModal,
				closeModal: result.current.closeModal,
				setModalInput: result.current.setModalInput,
				appendModalInput: result.current.appendModalInput,
				deleteModalInputChar: result.current.deleteModalInputChar,
			};

			// Multiple re-renders
			for (let i = 0; i < 5; i++) {
				rerender();
			}

			expect(result.current.openModal).toBe(initialRefs.openModal);
			expect(result.current.closeModal).toBe(initialRefs.closeModal);
			expect(result.current.setModalInput).toBe(initialRefs.setModalInput);
			expect(result.current.appendModalInput).toBe(initialRefs.appendModalInput);
			expect(result.current.deleteModalInputChar).toBe(initialRefs.deleteModalInputChar);
		});
	});

	describe("useStreaming", () => {
		test("returns stable function references across re-renders", () => {
			const { result, rerender } = renderHook(() => useStreaming(), { wrapper });

			const initialStartStreaming = result.current.startStreaming;
			const initialAppendStreaming = result.current.appendStreaming;
			const initialCompleteStreaming = result.current.completeStreaming;
			const initialCancelStreaming = result.current.cancelStreaming;

			// Trigger a re-render
			rerender();

			// All function references should remain stable
			expect(result.current.startStreaming).toBe(initialStartStreaming);
			expect(result.current.appendStreaming).toBe(initialAppendStreaming);
			expect(result.current.completeStreaming).toBe(initialCompleteStreaming);
			expect(result.current.cancelStreaming).toBe(initialCancelStreaming);
		});

		test("functions remain stable after multiple re-renders", () => {
			const { result, rerender } = renderHook(() => useStreaming(), { wrapper });

			const initialRefs = {
				startStreaming: result.current.startStreaming,
				appendStreaming: result.current.appendStreaming,
				completeStreaming: result.current.completeStreaming,
				cancelStreaming: result.current.cancelStreaming,
			};

			// Multiple re-renders
			for (let i = 0; i < 5; i++) {
				rerender();
			}

			expect(result.current.startStreaming).toBe(initialRefs.startStreaming);
			expect(result.current.appendStreaming).toBe(initialRefs.appendStreaming);
			expect(result.current.completeStreaming).toBe(initialRefs.completeStreaming);
			expect(result.current.cancelStreaming).toBe(initialRefs.cancelStreaming);
		});
	});
});
