<script lang="ts">
	import { onMount } from 'svelte';
	import { getAuthState, clearAuth, authenticatedFetch } from '$lib/auth';
	import { goto } from '$app/navigation';
	import AppNav from '$lib/components/AppNav.svelte';

	interface Spark {
		id: string;
		title: string;
		content: string;
		initialThoughts?: string;
		backstory?: string;
		createdAt: string;
		updatedAt: string;
	}

	let authState = $state(getAuthState());
	let sparks = $state<Spark[]>([]);
	let isLoading = $state(true);
	let error = $state('');
	let showCreateForm = $state(false);

	// New spark form
	let newSpark = $state({
		title: '',
		initialThoughts: ''
	});

	onMount(() => {
		authState = getAuthState();
		if (!authState.isAuthenticated) {
			goto('/login');
			return;
		}
		loadSparks();
	});

	async function loadSparks() {
		try {
			isLoading = true;
			error = '';
			const response = await authenticatedFetch('http://localhost:3000/api/sparks');

			if (!response.ok) {
				if (response.status === 401) {
					clearAuth();
					goto('/login');
					return;
				}
				throw new Error(`Failed to load sparks: ${response.status}`);
			}

			sparks = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load sparks';
			console.error('Error loading sparks:', err);
		} finally {
			isLoading = false;
		}
	}

	async function createSpark() {
		if (!newSpark.title.trim()) {
			return;
		}

		try {
			const sparkData = {
				title: newSpark.title.trim(),
				initialThoughts: newSpark.initialThoughts.trim() || undefined
			};

			const response = await authenticatedFetch('http://localhost:3000/api/sparks', {
				method: 'POST',
				body: JSON.stringify(sparkData)
			});

			if (!response.ok) {
				throw new Error(`Failed to create spark: ${response.status}`);
			}

			const createdSpark = await response.json();
			sparks = [createdSpark, ...sparks];

			// Reset form
			newSpark = { title: '', initialThoughts: '' };
			showCreateForm = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create spark';
			console.error('Error creating spark:', err);
		}
	}

	function handleDevelop(spark: Spark) {
		goto(`/sparks/${spark.id}`);
	}

	function truncateInitialThoughts(text: string, maxLines: number = 2): string {
		const lines = text.split('\n');
		if (lines.length <= maxLines) {
			return text;
		}
		return lines.slice(0, maxLines).join('\n') + '...';
	}


	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>My Sparks - Spark</title>
</svelte:head>

<AppNav />

<div class="content-container">
	<header class="page-header">
		<h1 class="page-title">✨ My Sparks</h1>
	</header>

	<main class="main-content">
		{#if error}
			<div class="alert alert-error flex justify-between items-center">
				<span>{error}</span>
				<button onclick={loadSparks} class="btn btn-error btn-sm">Retry</button>
			</div>
		{/if}

		<div class="actions-bar">
			<button
				onclick={() => showCreateForm = !showCreateForm}
				class="btn btn-primary"
			>
				{showCreateForm ? 'Cancel' : '+ New Spark'}
			</button>
		</div>

		{#if showCreateForm}
			<div class="card create-form mb-xl">
				<div class="card-header">
					<h2>Create New Spark</h2>
				</div>
				<div class="card-body">
					<div class="form-group">
						<label for="title" class="form-label">Title</label>
						<input
							id="title"
							type="text"
							bind:value={newSpark.title}
							placeholder="Enter spark title..."
							class="form-input"
							required
						/>
					</div>
					<div class="form-group">
						<label for="initialThoughts" class="form-label">Initial Thoughts (optional)</label>
						<textarea
							id="initialThoughts"
							bind:value={newSpark.initialThoughts}
							placeholder="Any initial thoughts, ideas, or directions..."
							rows="3"
							class="form-textarea"
						></textarea>
					</div>
					<div class="form-actions">
						<button onclick={createSpark} class="btn btn-success">Create Spark</button>
						<button onclick={() => showCreateForm = false} class="btn btn-neutral">Cancel</button>
					</div>
				</div>
			</div>
		{/if}

		{#if isLoading}
			<div class="loading">
				<div class="spinner"></div>
				<p>Loading your sparks...</p>
			</div>
		{:else if sparks.length === 0}
			<div class="empty-state">
				<div class="empty-state-icon">💡</div>
				<h2 class="empty-state-title">No sparks yet</h2>
				<p class="empty-state-description">Create your first spark to get started with your content creative workspace.</p>
				<button onclick={() => showCreateForm = true} class="btn btn-primary btn-lg">
					Create Your First Spark
				</button>
			</div>
		{:else}
			<div class="sparks-list">
				{#each sparks as spark (spark.id)}
					<div class="card spark-item">
						<div class="card-body spark-main">
							<div class="spark-info">
								<h3 class="spark-title">{spark.title}</h3>
								<time class="spark-date">{formatDate(spark.createdAt)}</time>
							</div>

							{#if spark.initialThoughts}
								<div class="initial-thoughts">
									<p>{truncateInitialThoughts(spark.initialThoughts)}</p>
								</div>
							{/if}

							<div class="spark-meta">
								<div class="backstory-indicator">
									{#if spark.backstory && spark.backstory.trim()}
										<span class="indicator has-backstory">📝 Backstory Complete</span>
									{:else}
										<span class="indicator no-backstory">📝 No Backstory</span>
									{/if}
								</div>
							</div>

							<div class="spark-actions">
								<button onclick={() => handleDevelop(spark)} class="btn btn-primary">
									Develop
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>

<style>
	.actions-bar {
		display: flex;
		justify-content: flex-end;
		margin-bottom: var(--spacing-2xl);
	}

	.create-form .card-header h2 {
		margin: 0;
		color: var(--text-primary);
		font-size: var(--text-xl);
		font-weight: var(--font-weight-semibold);
	}

	.form-actions {
		display: flex;
		gap: var(--spacing-lg);
		flex-wrap: wrap;
	}

	.sparks-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.spark-item {
		transition: border-color var(--transition-normal), box-shadow var(--transition-normal);
	}

	.spark-item:hover {
		border-color: var(--primary-color);
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
	}

	.spark-main {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.spark-info {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--spacing-lg);
	}

	.spark-title {
		margin: 0;
		color: var(--text-primary);
		font-size: var(--text-xl);
		font-weight: var(--font-weight-semibold);
		line-height: 1.3;
	}

	.spark-date {
		color: var(--text-muted);
		font-size: var(--text-sm);
		white-space: nowrap;
		font-weight: var(--font-weight-medium);
	}

	.initial-thoughts p {
		color: var(--text-tertiary);
		line-height: 1.5;
		margin: 0;
		font-style: italic;
		white-space: pre-line;
	}

	.spark-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-lg);
		flex-wrap: wrap;
	}

	.backstory-indicator {
		display: flex;
		align-items: center;
	}

	.indicator {
		font-size: var(--text-sm);
		font-weight: var(--font-weight-medium);
		padding: var(--spacing-xs) var(--spacing-md);
		border-radius: 16px;
	}

	.indicator.has-backstory {
		background: var(--success-bg);
		color: #065f46;
	}

	.indicator.no-backstory {
		background: var(--warning-bg);
		color: #92400e;
	}

	.spark-actions {
		flex-shrink: 0;
	}

	@media (max-width: 768px) {
		.spark-info {
			flex-direction: column;
			gap: var(--spacing-sm);
			align-items: flex-start;
		}

		.spark-meta {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-md);
		}

		.form-actions {
			flex-direction: column;
		}

		.actions-bar {
			justify-content: stretch;
		}
	}
</style>