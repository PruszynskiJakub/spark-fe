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

<div class="content-container">
	<div class="card">
		<div class="card-header">
			<h1 class="page-title">🔐 Authentication Test</h1>
		</div>

		<div class="card-body">
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
					<p class="no-auth">Please <a href="/login" class="link">login</a> first to test authentication.</p>
				{:else}
					<button onclick={runAuthTests} disabled={isTestingAuth} class="btn btn-primary">
						{isTestingAuth ? 'Testing APIs...' : 'Test Protected APIs'}
					</button>

					<button onclick={handleLogout} class="btn btn-error">
						Logout
					</button>
				{/if}
			</div>

			{#if testResults.errors.length > 0}
				<div class="alert alert-error">
					<h3>❌ Test Errors</h3>
					{#each testResults.errors as error}
						<div class="error-item">{error}</div>
					{/each}
				</div>
			{/if}

			{#if testResults.userMe}
				<div class="alert alert-success">
					<h3>✅ GET /api/users/me</h3>
					<pre>{JSON.stringify(testResults.userMe, null, 2)}</pre>
				</div>
			{/if}

			{#if testResults.sparks}
				<div class="alert alert-success">
					<h3>✅ Sparks Endpoints</h3>
					<h4>GET /api/sparks:</h4>
					<pre>{JSON.stringify(testResults.sparks.getSparks, null, 2)}</pre>
					<h4>POST /api/sparks:</h4>
					<pre>{JSON.stringify(testResults.sparks.createSpark, null, 2)}</pre>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.auth-status {
		background: var(--surface-hover);
		border-radius: var(--radius-md);
		padding: var(--spacing-xl);
		margin-bottom: var(--spacing-xl);
	}

	.auth-status h2 {
		color: var(--text-secondary);
		margin-bottom: var(--spacing-lg);
		font-size: var(--text-xl);
	}

	.status-item {
		margin-bottom: var(--spacing-md);
		line-height: 1.5;
	}

	.success {
		color: var(--success-color);
		font-weight: var(--font-weight-medium);
	}

	.error {
		color: var(--error-color);
		font-weight: var(--font-weight-medium);
	}

	.token-preview {
		background: var(--border-light);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		font-family: var(--font-mono);
	}

	.test-actions {
		display: flex;
		gap: var(--spacing-lg);
		margin-bottom: var(--spacing-xl);
		flex-wrap: wrap;
	}

	.no-auth {
		color: var(--text-muted);
		font-style: italic;
	}

	.error-item {
		background: var(--surface-color);
		padding: var(--spacing-sm);
		border-radius: var(--radius-sm);
		margin-bottom: var(--spacing-sm);
		color: var(--error-color);
		border-left: 4px solid var(--error-color);
	}

	pre {
		background: var(--background-color);
		padding: var(--spacing-lg);
		border-radius: var(--radius-sm);
		overflow-x: auto;
		font-size: var(--text-sm);
		line-height: 1.4;
		border: 1px solid var(--border-color);
	}

	:global(.alert) h3 {
		margin-top: 0;
		margin-bottom: var(--spacing-lg);
		font-size: var(--text-lg);
	}

	:global(.alert) h4 {
		margin-top: var(--spacing-lg);
		margin-bottom: var(--spacing-sm);
		color: var(--text-tertiary);
		font-size: var(--text-base);
	}
</style>