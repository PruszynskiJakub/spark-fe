<script lang="ts">
	import { onMount } from 'svelte';
	import { getAuthState, clearAuth, getUserStats, getRecentSparks, getRecentArtifacts, type UserStatsResponse, type RecentSpark, type RecentArtifact } from '$lib/auth';
	import { goto } from '$app/navigation';
	import AppNav from '$lib/components/AppNav.svelte';

	let authState = $state(getAuthState());
	let userStats = $state<UserStatsResponse | null>(null);
	let isLoadingStats = $state(true);
	let statsError = $state('');
	let recentSparks = $state<RecentSpark[]>([]);
	let recentArtifacts = $state<RecentArtifact[]>([]);
	let isLoadingRecent = $state(true);
	let recentError = $state('');

	onMount(() => {
		authState = getAuthState();
		if (!authState.isAuthenticated) {
			goto('/login');
			return;
		}
		loadUserStats();
		loadRecentData();
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

	async function loadRecentData() {
		try {
			isLoadingRecent = true;
			recentError = '';
			const [sparksData, artifactsData] = await Promise.all([
				getRecentSparks(3),
				getRecentArtifacts(3)
			]);
			recentSparks = sparksData || [];
			recentArtifacts = artifactsData || [];
			console.log('Recent data loaded:', { sparksCount: recentSparks.length, artifactsCount: recentArtifacts.length, artifactsData });
		} catch (err) {
			recentError = err instanceof Error ? err.message : 'Failed to load recent data';
			console.error('Error loading recent data:', err);
			// Ensure arrays remain empty on error
			recentSparks = [];
			recentArtifacts = [];
		} finally {
			isLoadingRecent = false;
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

		{#if recentError}
			<div class="alert alert-error flex justify-between items-center mb-xl">
				<span>Recent Data: {recentError}</span>
				<button onclick={loadRecentData} class="btn btn-error btn-sm">Retry</button>
			</div>
		{/if}

		<!-- Recent Activity -->
		<div class="recent-sections">
			<!-- Recent Sparks -->
			<div class="card recent-sparks-card">
				<div class="card-header">
					<h2>Recent Sparks</h2>
					<a href="/sparks" class="btn btn-secondary btn-sm">View All</a>
				</div>
				<div class="card-body">
					{#if isLoadingRecent}
						<div class="recent-loading">
							<div class="recent-item-skeleton">
								<div class="skeleton recent-title-skeleton"></div>
								<div class="skeleton recent-content-skeleton"></div>
								<div class="skeleton recent-meta-skeleton"></div>
							</div>
							<div class="recent-item-skeleton">
								<div class="skeleton recent-title-skeleton"></div>
								<div class="skeleton recent-content-skeleton"></div>
								<div class="skeleton recent-meta-skeleton"></div>
							</div>
						</div>
                    {:else if recentSparks && recentSparks.length > 0}
						<div class="recent-items">
							{#each recentSparks as spark}
								<div class="recent-item" onclick={() => goto(`/sparks/${spark.id}`)}>
									<h3 class="recent-title">{spark.title}</h3>
									<p class="recent-content">{spark.content?.substring(0, 120) || ''}...</p>
									<div class="recent-meta">
										<span class="recent-date">{new Date(spark.createdAt).toLocaleDateString()}</span>
										{#if spark.tags && spark.tags.length > 0}
											<div class="recent-tags">
												{#each spark.tags.slice(0, 3) as tag}
													<span class="tag">{tag}</span>
												{/each}
											</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="empty-state">
							<div class="empty-state-icon">✨</div>
							<h3 class="empty-state-title">No sparks yet</h3>
							<p>Create your first spark to get started with content creation.</p>
							<a href="/sparks" class="btn btn-primary btn-sm">Create Spark</a>
						</div>
					{/if}
				</div>
			</div>

			<!-- Recent Artifacts -->
			<div class="card recent-artifacts-card">
				<div class="card-header">
					<h2>Recent Artifacts</h2>
					<a href="/artifacts" class="btn btn-secondary btn-sm">View All</a>
				</div>
				<div class="card-body">
					{#if isLoadingRecent}
						<div class="recent-loading">
							<div class="recent-item-skeleton">
								<div class="skeleton recent-title-skeleton"></div>
								<div class="skeleton recent-content-skeleton"></div>
								<div class="skeleton recent-meta-skeleton"></div>
							</div>
							<div class="recent-item-skeleton">
								<div class="skeleton recent-title-skeleton"></div>
								<div class="skeleton recent-content-skeleton"></div>
								<div class="skeleton recent-meta-skeleton"></div>
							</div>
						</div>
					{:else if recentArtifacts && recentArtifacts.length > 0}
						<div class="recent-items">
							{#each recentArtifacts as artifact}
								<div class="recent-item" onclick={() => goto('/artifacts')}>
									<h3 class="recent-title">{artifact.sparkTitle || `Artifact from Spark ${artifact.sparkId.substring(0, 8)}`}</h3>
									<p class="recent-content">{artifact.content?.text?.substring(0, 120) || ''}...</p>
									<div class="recent-meta">
										<span class="recent-date">{new Date(artifact.createdAt).toLocaleDateString()}</span>
										<span class="artifact-type">{artifact.typeName || artifact.status}</span>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="empty-state">
							<div class="empty-state-icon">🎨</div>
							<h3 class="empty-state-title">No artifacts yet</h3>
							<p>Generate your first artifact from a spark to see content here.</p>
							<a href="/sparks" class="btn btn-primary btn-sm">View Sparks</a>
						</div>
					{/if}
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

	/* Recent Sections */
	.recent-sections {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-xl);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.recent-items {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.recent-item {
		padding: var(--spacing-lg);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-md);
		transition: all var(--transition-normal);
		cursor: pointer;
		background: var(--surface-color);
	}

	.recent-item:hover {
		border-color: var(--primary-color);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
		transform: translateY(-2px);
		background: var(--card-bg);
	}

	.recent-item:active {
		transform: translateY(0);
		box-shadow: 0 2px 6px rgba(102, 126, 234, 0.1);
	}

	.recent-title {
		margin: 0 0 var(--spacing-sm) 0;
		color: var(--text-primary);
		font-size: var(--text-md);
		font-weight: var(--font-weight-semibold);
		line-height: 1.4;
	}

	.recent-content {
		margin: 0 0 var(--spacing-md) 0;
		color: var(--text-secondary);
		font-size: var(--text-sm);
		line-height: 1.5;
	}

	.recent-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
	}

	.recent-date {
		color: var(--text-muted);
		font-size: var(--text-xs);
	}

	.recent-tags {
		display: flex;
		gap: var(--spacing-xs);
		flex-wrap: wrap;
	}

	.tag {
		padding: var(--spacing-xs) var(--spacing-sm);
		background: var(--bg-secondary);
		border-radius: var(--border-radius-sm);
		font-size: var(--text-xs);
		color: var(--text-secondary);
	}

	.artifact-type {
		padding: var(--spacing-xs) var(--spacing-sm);
		background: var(--primary-color);
		color: white;
		border-radius: var(--border-radius-sm);
		font-size: var(--text-xs);
		font-weight: var(--font-weight-medium);
		text-transform: uppercase;
	}

	/* Recent Loading */
	.recent-loading {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.recent-item-skeleton {
		padding: var(--spacing-lg);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-md);
	}

	.recent-title-skeleton {
		height: 1.25rem;
		width: 70%;
		margin-bottom: var(--spacing-sm);
	}

	.recent-content-skeleton {
		height: 1rem;
		width: 100%;
		margin-bottom: var(--spacing-xs);
	}

	.recent-meta-skeleton {
		height: 0.75rem;
		width: 40%;
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

		.recent-sections {
			grid-template-columns: 1fr;
			gap: var(--spacing-lg);
		}

		.recent-meta {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>