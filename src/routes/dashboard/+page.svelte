<script lang="ts">
	import { onMount } from 'svelte';
	import { getAuthState, clearAuth, getUserStats, type UserStatsResponse } from '$lib/auth';
	import { goto } from '$app/navigation';
	import AppNav from '$lib/components/AppNav.svelte';

	let authState = $state(getAuthState());
	let userStats = $state<UserStatsResponse | null>(null);
	let isLoadingStats = $state(true);
	let statsError = $state('');

	onMount(() => {
		authState = getAuthState();
		if (!authState.isAuthenticated) {
			goto('/login');
			return;
		}
		loadUserStats();
	});

	async function loadUserStats() {
		try {
			isLoadingStats = true;
			statsError = '';
			userStats = await getUserStats();
		} catch (err) {
			statsError = err instanceof Error ? err.message : 'Failed to load user stats';
			console.error('Error loading user stats:', err);
		} finally {
			isLoadingStats = false;
		}
	}

	function getGreeting(): string {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 17) return 'Good afternoon';
		return 'Good evening';
	}

	function getUserDisplayName(): string {
		if (authState.user?.name) return authState.user.name;
		if (authState.user?.email) return authState.user.email.split('@')[0];
		return 'there';
	}
</script>

<svelte:head>
	<title>Dashboard - Spark</title>
</svelte:head>

<AppNav />

<div class="content-container">
	<header class="page-header">
		<h1 class="page-title">✨ {getGreeting()}, {getUserDisplayName()}!</h1>
		<p class="page-subtitle">Welcome to your content creative workspace</p>
	</header>

	<main class="main-content">
		{#if statsError}
			<div class="alert alert-error flex justify-between items-center mb-xl">
				<span>Stats: {statsError}</span>
				<button onclick={loadUserStats} class="btn btn-error btn-sm">Retry</button>
			</div>
		{/if}

		<!-- User Stats Cards -->
		{#if isLoadingStats}
			<div class="stats-container loading mb-xl">
				<div class="stats-card">
					<div class="stats-skeleton">
						<div class="stats-number skeleton"></div>
						<div class="stats-label skeleton"></div>
					</div>
				</div>
				<div class="stats-card">
					<div class="stats-skeleton">
						<div class="stats-number skeleton"></div>
						<div class="stats-label skeleton"></div>
					</div>
				</div>
				<div class="stats-card">
					<div class="stats-skeleton">
						<div class="stats-number skeleton"></div>
						<div class="stats-label skeleton"></div>
					</div>
				</div>
			</div>
		{:else if userStats}
			<div class="stats-container mb-xl">
				<div class="stats-card">
					<div class="stats-content">
						<div class="stats-number">{userStats.totalSparks}</div>
						<div class="stats-label">Total Sparks</div>
					</div>
				</div>
				<div class="stats-card">
					<div class="stats-content">
						<div class="stats-number">{userStats.thisWeekSparks}</div>
						<div class="stats-label">Sparks This Week</div>
					</div>
				</div>
				<div class="stats-card">
					<div class="stats-content">
						<div class="stats-number">{userStats.totalArtifacts}</div>
						<div class="stats-label">Total Artifacts</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Quick Actions -->
		<div class="card quick-actions-card mb-xl">
			<div class="card-header">
				<h2>Quick Actions</h2>
			</div>
			<div class="card-body">
				<div class="quick-actions-grid">
					<a href="/sparks" class="action-card">
						<div class="action-icon">✨</div>
						<h3 class="action-title">My Sparks</h3>
						<p class="action-description">View and manage your creative sparks</p>
					</a>

					<a href="/artifacts" class="action-card">
						<div class="action-icon">🎨</div>
						<h3 class="action-title">My Artifacts</h3>
						<p class="action-description">Browse your AI-generated content</p>
					</a>

					<button onclick={() => goto('/sparks')} class="action-card action-button">
						<div class="action-icon">➕</div>
						<h3 class="action-title">New Spark</h3>
						<p class="action-description">Create a new creative spark</p>
					</button>
				</div>
			</div>
		</div>

		<!-- Recent Activity -->
		<div class="card recent-activity-card">
			<div class="card-header">
				<h2>Getting Started</h2>
			</div>
			<div class="card-body">
				<div class="getting-started-content">
					<div class="step">
						<div class="step-number">1</div>
						<div class="step-content">
							<h3>Create Your First Spark</h3>
							<p>Start by creating a spark with your initial ideas and thoughts.</p>
							<a href="/sparks" class="btn btn-primary btn-sm">Create Spark</a>
						</div>
					</div>

					<div class="step">
						<div class="step-number">2</div>
						<div class="step-content">
							<h3>Develop Your Backstory</h3>
							<p>Add rich context and background to your spark to enhance AI generation.</p>
						</div>
					</div>

					<div class="step">
						<div class="step-number">3</div>
						<div class="step-content">
							<h3>Generate Artifacts</h3>
							<p>Use AI to create LinkedIn posts, articles, and other content from your sparks.</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</main>
</div>

<style>
	/* Stats Cards */
	.stats-container {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--spacing-lg);
		margin-bottom: var(--spacing-xl);
	}

	.stats-card {
		background: var(--card-bg);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		padding: var(--spacing-xl);
		transition: border-color var(--transition-normal), box-shadow var(--transition-normal);
	}

	.stats-card:hover {
		border-color: var(--primary-color);
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
	}

	.stats-content {
		text-align: center;
	}

	.stats-number {
		font-size: 2.5rem;
		font-weight: var(--font-weight-bold);
		color: var(--primary-color);
		line-height: 1;
		margin-bottom: var(--spacing-sm);
	}

	.stats-label {
		font-size: var(--text-sm);
		color: var(--text-muted);
		font-weight: var(--font-weight-medium);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Loading skeleton */
	.stats-skeleton {
		text-align: center;
	}

	.skeleton {
		background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
		background-size: 200% 100%;
		animation: skeleton-loading 1.5s infinite;
		border-radius: var(--border-radius-md);
	}

	.stats-number.skeleton {
		height: 2.5rem;
		width: 4rem;
		margin: 0 auto var(--spacing-sm);
	}

	.stats-label.skeleton {
		height: 1rem;
		width: 5rem;
		margin: 0 auto;
	}

	@keyframes skeleton-loading {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	/* Quick Actions */
	.card-header h2 {
		margin: 0;
		color: var(--text-primary);
		font-size: var(--text-xl);
		font-weight: var(--font-weight-semibold);
	}

	.quick-actions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: var(--spacing-lg);
	}

	.action-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: var(--spacing-xl);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		text-decoration: none;
		color: inherit;
		transition: all var(--transition-normal);
		background: var(--surface-color);
		cursor: pointer;
	}

	.action-button {
		border: none;
		font-family: inherit;
		font-size: inherit;
	}

	.action-card:hover {
		border-color: var(--primary-color);
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
		transform: translateY(-2px);
	}

	.action-icon {
		font-size: 2rem;
		margin-bottom: var(--spacing-md);
	}

	.action-title {
		margin: 0 0 var(--spacing-sm) 0;
		color: var(--text-primary);
		font-size: var(--text-lg);
		font-weight: var(--font-weight-semibold);
	}

	.action-description {
		margin: 0;
		color: var(--text-muted);
		font-size: var(--text-sm);
		line-height: 1.5;
	}

	/* Getting Started */
	.getting-started-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xl);
	}

	.step {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-lg);
	}

	.step-number {
		flex-shrink: 0;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--primary-color);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: var(--font-weight-bold);
		font-size: var(--text-sm);
	}

	.step-content {
		flex: 1;
	}

	.step-content h3 {
		margin: 0 0 var(--spacing-sm) 0;
		color: var(--text-primary);
		font-size: var(--text-lg);
		font-weight: var(--font-weight-semibold);
	}

	.step-content p {
		margin: 0 0 var(--spacing-md) 0;
		color: var(--text-secondary);
		line-height: 1.6;
	}

	@media (max-width: 768px) {
		.stats-container {
			grid-template-columns: 1fr;
			gap: var(--spacing-md);
		}

		.stats-card {
			padding: var(--spacing-lg);
		}

		.stats-number {
			font-size: 2rem;
		}

		.quick-actions-grid {
			grid-template-columns: 1fr;
		}

		.step {
			flex-direction: column;
			text-align: center;
		}

		.step-number {
			align-self: center;
		}
	}
</style>