/**
 * Set a value in localStorage with type safety
 * @param key Storage key
 * @param value Value to store
 */
export const setStorageValue = <T>(key: string, value: T): void => {
	try {
		const serializedValue = JSON.stringify(value);
		localStorage.setItem(key, serializedValue);
	} catch (error) {
		console.error("Error saving to localStorage:", error);
	}
};

/**
 * Get a value from localStorage with type safety
 * @param key Storage key
 * @param defaultValue Optional default value if key doesn't exist
 */
export const getStorageValue = <T>(key: string, defaultValue?: T): T | null => {
	try {
		const item = localStorage.getItem(key);
		if (item === null) {
			return defaultValue ?? null;
		}
		return JSON.parse(item) as T;
	} catch (error) {
		console.error("Error reading from localStorage:", error);
		return defaultValue ?? null;
	}
};
