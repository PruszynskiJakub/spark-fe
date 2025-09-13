export interface User {
	id: string;
	email: string;
	name: string | null;
	strategy: string | null;
	createdAt: string;
}

export interface AuthState {
	token: string | null;
	user: User | null;
	isAuthenticated: boolean;
}

// Get current auth state
export function getAuthState(): AuthState {
	if (typeof window === 'undefined') {
		return { token: null, user: null, isAuthenticated: false };
	}

	const token = localStorage.getItem('token');
	const userStr = localStorage.getItem('user');
	let user: User | null = null;

	if (userStr) {
		try {
			user = JSON.parse(userStr);
		} catch (error) {
			console.error('Failed to parse user data:', error);
		}
	}

	return {
		token,
		user,
		isAuthenticated: Boolean(token && user)
	};
}

// Clear auth data
export function clearAuth(): void {
	if (typeof window !== 'undefined') {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
	}
}

// Make authenticated API request
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
	const { token } = getAuthState();

	if (!token) {
		throw new Error('No authentication token available');
	}

	const headers = new Headers(options.headers);
	headers.set('Authorization', `Bearer ${token}`);
	headers.set('Content-Type', 'application/json');

	return fetch(url, {
		...options,
		headers
	});
}

// Test protected endpoint
export async function testProtectedEndpoint(): Promise<User> {
	const response = await authenticatedFetch('http://localhost:3000/api/users/me');

	if (!response.ok) {
		if (response.status === 401) {
			clearAuth();
			throw new Error('Authentication expired');
		}
		throw new Error(`Failed to fetch user data: ${response.status}`);
	}

	return response.json();
}

// Get user profile
export async function getUserProfile(): Promise<User> {
	const response = await authenticatedFetch('http://localhost:3000/api/users/me');

	if (!response.ok) {
		if (response.status === 401) {
			clearAuth();
			throw new Error('Authentication expired');
		}
		throw new Error(`Failed to fetch user profile: ${response.status}`);
	}

	return response.json();
}

// Update user profile strategy
export async function updateUserStrategy(strategy: string): Promise<User> {
	const response = await authenticatedFetch('http://localhost:3000/api/users/me', {
		method: 'PUT',
		body: JSON.stringify({ strategy })
	});

	if (!response.ok) {
		if (response.status === 401) {
			clearAuth();
			throw new Error('Authentication expired');
		}
		if (response.status === 400) {
			throw new Error('Invalid strategy data');
		}
		if (response.status === 404) {
			throw new Error('User not found');
		}
		throw new Error(`Failed to update strategy: ${response.status}`);
	}

	const updatedUser = await response.json();

	// Update localStorage with new user data
	if (typeof window !== 'undefined') {
		localStorage.setItem('user', JSON.stringify(updatedUser));
	}

	return updatedUser;
}

// Test sparks endpoints
export async function testSparksEndpoints(): Promise<{ getSparks: any[], createSpark: any }> {
	// Test GET sparks
	const getSparksResponse = await authenticatedFetch('http://localhost:3000/api/sparks');
	if (!getSparksResponse.ok) {
		throw new Error(`Failed to get sparks: ${getSparksResponse.status}`);
	}
	const sparks = await getSparksResponse.json();

	// Test POST spark
	const testSpark = {
		title: 'Test Spark',
		content: 'This is a test spark created during authentication testing',
		tags: ['test']
	};

	const createSparkResponse = await authenticatedFetch('http://localhost:3000/api/sparks', {
		method: 'POST',
		body: JSON.stringify(testSpark)
	});

	if (!createSparkResponse.ok) {
		throw new Error(`Failed to create spark: ${createSparkResponse.status}`);
	}
	const newSpark = await createSparkResponse.json();

	return { getSparks: sparks, createSpark: newSpark };
}