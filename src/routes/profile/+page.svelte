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

<div class="content-container">
	<main class="main">
		<div class="page-header">
			<h1 class="page-title">Profile</h1>
		</div>

		{#if loading}
			<div class="loading">
				<div class="spinner"></div>
				<p>Loading profile...</p>
			</div>
		{:else if error && !user}
			<div class="alert alert-error">
				<p>{error}</p>
				<button onclick={() => goto('/login')} class="btn btn-neutral">Go to Login</button>
			</div>
		{:else if user}
			<div class="card mb-xl">
				<div class="card-header">
					<h2>User Information</h2>
				</div>
				<div class="card-body">
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
			</div>

			<div class="card">
				<div class="card-header">
					<h2>Investment Strategy</h2>
				</div>
				<div class="card-body">
					<form onsubmit={handleUpdateStrategy}>
						<div class="form-group">
							<label for="strategy" class="form-label">Strategy:</label>
							<textarea
								id="strategy"
								bind:value={strategyInput}
								placeholder="Describe your investment strategy..."
								rows="4"
								class="form-textarea"
								disabled={updating}
							></textarea>
						</div>

						{#if error}
							<div class="alert alert-error">{error}</div>
						{/if}

						{#if success}
							<div class="alert alert-success">{success}</div>
						{/if}

						<button type="submit" class="btn btn-primary" disabled={updating}>
							{updating ? 'Updating...' : 'Update Strategy'}
						</button>
					</form>
				</div>
			</div>
		{/if}
	</main>
</div>

<style>
	.main {
		max-width: var(--form-max-width);
		margin: 0 auto;
	}

	.info-grid {
		display: grid;
		gap: var(--spacing-lg);
	}

	.info-item {
		display: grid;
		grid-template-columns: 120px 1fr;
		align-items: center;
		gap: var(--spacing-lg);
	}

	.info-label {
		font-weight: var(--font-weight-semibold);
		color: var(--text-secondary);
	}

	.info-item span {
		color: var(--text-muted);
	}

	.card-header h2 {
		font-size: var(--text-xl);
		font-weight: var(--font-weight-semibold);
		margin: 0;
		color: var(--text-secondary);
	}

	@media (max-width: 640px) {
		.info-item {
			grid-template-columns: 1fr;
			gap: var(--spacing-sm);
		}

		.info-label {
			font-size: var(--text-sm);
		}
	}
</style>