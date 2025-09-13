<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getAuthState, getUserProfile, updateUserStrategy } from '$lib/auth';
	import type { User } from '$lib/auth';
	import AppNav from '$lib/components/AppNav.svelte';

	let user: User | null = null;
	let loading = true;
	let updating = false;
	let error = '';
	let success = '';
	let strategyInput = '';

	onMount(async () => {
		const authState = getAuthState();

		if (!authState.isAuthenticated) {
			goto('/login');
			return;
		}

		try {
			user = await getUserProfile();
			strategyInput = user.strategy || '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load profile';
			if (error.includes('Authentication expired')) {
				goto('/login');
				return;
			}
		} finally {
			loading = false;
		}
	});

	async function handleUpdateStrategy() {
		if (!user) return;

		updating = true;
		error = '';
		success = '';

		try {
			user = await updateUserStrategy(strategyInput);
			success = 'Strategy updated successfully!';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update strategy';
			if (error.includes('Authentication expired')) {
				goto('/login');
				return;
			}
		} finally {
			updating = false;
		}
	}

</script>

<svelte:head>
	<title>Profile | Spark</title>
</svelte:head>

<AppNav />

<div class="container">
	<main class="main">
		<h1>Profile</h1>

		{#if loading}
			<div class="loading">Loading profile...</div>
		{:else if error && !user}
			<div class="error">
				<p>{error}</p>
				<button onclick={() => goto('/login')} class="btn">Go to Login</button>
			</div>
		{:else if user}
			<div class="profile-section">
				<h2>User Information</h2>
				<div class="info-grid">
					<div class="info-item">
						<span class="info-label">Email:</span>
						<span>{user.email}</span>
					</div>
					<div class="info-item">
						<span class="info-label">Name:</span>
						<span>{user.name || 'Not set'}</span>
					</div>
					<div class="info-item">
						<span class="info-label">Member since:</span>
						<span>{new Date(user.createdAt).toLocaleDateString()}</span>
					</div>
				</div>
			</div>

			<div class="strategy-section">
				<h2>Investment Strategy</h2>
				<form onsubmit={handleUpdateStrategy}>
					<div class="form-group">
						<label for="strategy">Strategy:</label>
						<textarea
							id="strategy"
							bind:value={strategyInput}
							placeholder="Describe your investment strategy..."
							rows="4"
							disabled={updating}
						></textarea>
					</div>

					{#if error}
						<div class="error-message">{error}</div>
					{/if}

					{#if success}
						<div class="success-message">{success}</div>
					{/if}

					<button type="submit" class="btn btn-primary" disabled={updating}>
						{updating ? 'Updating...' : 'Update Strategy'}
					</button>
				</form>
			</div>
		{/if}
	</main>
</div>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, sans-serif;
		min-height: calc(100vh - 4rem);
		background: #f8fafc;
	}

	.main {
		max-width: 600px;
		margin: 0 auto;
	}

	h1 {
		font-size: 2rem;
		font-weight: bold;
		margin-bottom: 2rem;
		color: #1f2937;
	}

	h2 {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: #374151;
	}

	.loading {
		text-align: center;
		padding: 2rem;
		color: #6b7280;
	}

	.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 0.5rem;
		padding: 1rem;
		color: #dc2626;
		text-align: center;
	}

	.profile-section,
	.strategy-section {
		background: #f9fafb;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.info-grid {
		display: grid;
		gap: 1rem;
	}

	.info-item {
		display: grid;
		grid-template-columns: 120px 1fr;
		align-items: center;
		gap: 1rem;
	}

	.info-label {
		font-weight: 600;
		color: #374151;
	}

	.info-item span {
		color: #6b7280;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-family: inherit;
		font-size: 1rem;
		resize: vertical;
	}

	textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	textarea:disabled {
		background: #f3f4f6;
		cursor: not-allowed;
	}

	.btn {
		background: #6b7280;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 0.375rem;
		cursor: pointer;
		font-weight: 500;
		font-size: 1rem;
	}

	.btn:hover {
		background: #4b5563;
	}

	.btn:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	.btn-primary {
		background: #3b82f6;
	}

	.btn-primary:hover {
		background: #2563eb;
	}

	.btn-primary:disabled {
		background: #9ca3af;
	}

	.error-message {
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 0.375rem;
		padding: 0.75rem;
		color: #dc2626;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.success-message {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		border-radius: 0.375rem;
		padding: 0.75rem;
		color: #15803d;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}
</style>