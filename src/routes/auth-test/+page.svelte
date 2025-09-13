<script lang="ts">
	import { onMount } from 'svelte';
	import { getAuthState, clearAuth, testProtectedEndpoint, testSparksEndpoints } from '$lib/auth';
	import type { User } from '$lib/auth';

	let authState = $state(getAuthState());
	let testResults = $state<{
		userMe?: User;
		sparks?: any;
		errors: string[];
	}>({ errors: [] });
	let isTestingAuth = $state(false);

	onMount(() => {
		authState = getAuthState();
	});

	async function runAuthTests() {
		isTestingAuth = true;
		testResults = { errors: [] };

		try {
			// Test /api/users/me
			console.log('Testing /api/users/me...');
			const userMe = await testProtectedEndpoint();
			testResults.userMe = userMe;
			console.log('✅ /api/users/me success:', userMe);

			// Test sparks endpoints
			console.log('Testing sparks endpoints...');
			const sparksData = await testSparksEndpoints();
			testResults.sparks = sparksData;
			console.log('✅ Sparks endpoints success:', sparksData);

		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unknown error';
			testResults.errors.push(errorMsg);
			console.error('❌ Auth test failed:', error);
		} finally {
			isTestingAuth = false;
		}
	}

	function handleLogout() {
		clearAuth();
		authState = getAuthState();
		testResults = { errors: [] };
	}
</script>

<svelte:head>
	<title>Auth Test - Spark</title>
</svelte:head>

<div class="test-container">
	<div class="test-card">
		<h1>🔐 Authentication Test</h1>

		<div class="auth-status">
			<h2>Current Auth State</h2>
			<div class="status-item">
				<strong>Authenticated:</strong>
				<span class={authState.isAuthenticated ? 'success' : 'error'}>
					{authState.isAuthenticated ? '✅ Yes' : '❌ No'}
				</span>
			</div>

			{#if authState.user}
				<div class="status-item">
					<strong>User:</strong> {authState.user.email} (ID: {authState.user.id})
				</div>
				<div class="status-item">
					<strong>Created:</strong> {new Date(authState.user.createdAt).toLocaleString()}
				</div>
			{/if}

			{#if authState.token}
				<div class="status-item">
					<strong>Token:</strong>
					<code class="token-preview">{authState.token.substring(0, 20)}...</code>
				</div>
			{/if}
		</div>

		<div class="test-actions">
			{#if !authState.isAuthenticated}
				<p class="no-auth">Please <a href="/login">login</a> first to test authentication.</p>
			{:else}
				<button onclick={runAuthTests} disabled={isTestingAuth} class="test-button">
					{isTestingAuth ? 'Testing APIs...' : 'Test Protected APIs'}
				</button>

				<button onclick={handleLogout} class="logout-button">
					Logout
				</button>
			{/if}
		</div>

		{#if testResults.errors.length > 0}
			<div class="test-results error">
				<h3>❌ Test Errors</h3>
				{#each testResults.errors as error}
					<div class="error-item">{error}</div>
				{/each}
			</div>
		{/if}

		{#if testResults.userMe}
			<div class="test-results success">
				<h3>✅ GET /api/users/me</h3>
				<pre>{JSON.stringify(testResults.userMe, null, 2)}</pre>
			</div>
		{/if}

		{#if testResults.sparks}
			<div class="test-results success">
				<h3>✅ Sparks Endpoints</h3>
				<h4>GET /api/sparks:</h4>
				<pre>{JSON.stringify(testResults.sparks.getSparks, null, 2)}</pre>
				<h4>POST /api/sparks:</h4>
				<pre>{JSON.stringify(testResults.sparks.createSpark, null, 2)}</pre>
			</div>
		{/if}
	</div>
</div>

<style>
	.test-container {
		min-height: 100vh;
		padding: 2rem;
		background: #f8fafc;
		font-family: system-ui, -apple-system, sans-serif;
	}

	.test-card {
		max-width: 800px;
		margin: 0 auto;
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	h1 {
		color: #1f2937;
		margin-bottom: 1.5rem;
		font-size: 2rem;
	}

	h2 {
		color: #374151;
		margin-bottom: 1rem;
		font-size: 1.25rem;
	}

	.auth-status {
		background: #f3f4f6;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.status-item {
		margin-bottom: 0.75rem;
		line-height: 1.5;
	}

	.success {
		color: #059669;
		font-weight: 500;
	}

	.error {
		color: #dc2626;
		font-weight: 500;
	}

	.token-preview {
		background: #e5e7eb;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.875rem;
		font-family: monospace;
	}

	.test-actions {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.test-button {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 500;
		transition: transform 0.2s;
	}

	.test-button:hover:not(:disabled) {
		transform: translateY(-1px);
	}

	.test-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.logout-button {
		background: #ef4444;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 500;
	}

	.logout-button:hover {
		background: #dc2626;
	}

	.no-auth {
		color: #6b7280;
		font-style: italic;
	}

	.no-auth a {
		color: #667eea;
		text-decoration: none;
	}

	.no-auth a:hover {
		text-decoration: underline;
	}

	.test-results {
		margin-bottom: 1.5rem;
		border-radius: 8px;
		padding: 1rem;
	}

	.test-results.success {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
	}

	.test-results.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
	}

	.test-results h3 {
		margin-top: 0;
		margin-bottom: 1rem;
		font-size: 1.125rem;
	}

	.test-results h4 {
		margin-top: 1rem;
		margin-bottom: 0.5rem;
		color: #4b5563;
		font-size: 1rem;
	}

	.error-item {
		background: white;
		padding: 0.5rem;
		border-radius: 4px;
		margin-bottom: 0.5rem;
		color: #dc2626;
		border-left: 4px solid #ef4444;
	}

	pre {
		background: #f8fafc;
		padding: 1rem;
		border-radius: 4px;
		overflow-x: auto;
		font-size: 0.875rem;
		line-height: 1.4;
		border: 1px solid #e2e8f0;
	}
</style>