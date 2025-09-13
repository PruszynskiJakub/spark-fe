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

<div class="sparks-container">
	<header class="page-header">
		<h1>✨ My Sparks</h1>
	</header>

	<main class="main-content">
		{#if error}
			<div class="error-banner">
				{error}
				<button onclick={loadSparks} class="retry-btn">Retry</button>
			</div>
		{/if}

		<div class="actions-bar">
			<button
				onclick={() => showCreateForm = !showCreateForm}
				class="create-btn"
			>
				{showCreateForm ? 'Cancel' : '+ New Spark'}
			</button>
		</div>

		{#if showCreateForm}
			<div class="create-form">
				<h2>Create New Spark</h2>
				<div class="form-group">
					<label for="title">Title</label>
					<input
						id="title"
						type="text"
						bind:value={newSpark.title}
						placeholder="Enter spark title..."
						required
					/>
				</div>
				<div class="form-group">
					<label for="initialThoughts">Initial Thoughts (optional)</label>
					<textarea
						id="initialThoughts"
						bind:value={newSpark.initialThoughts}
						placeholder="Any initial thoughts, ideas, or directions..."
						rows="3"
					></textarea>
				</div>
				<div class="form-actions">
					<button onclick={createSpark} class="save-btn">Create Spark</button>
					<button onclick={() => showCreateForm = false} class="cancel-btn">Cancel</button>
				</div>
			</div>
		{/if}

		{#if isLoading}
			<div class="loading">
				<div class="loader"></div>
				<p>Loading your sparks...</p>
			</div>
		{:else if sparks.length === 0}
			<div class="empty-state">
				<div class="empty-icon">💡</div>
				<h2>No sparks yet</h2>
				<p>Create your first spark to get started with your content creative workspace.</p>
				<button onclick={() => showCreateForm = true} class="create-first-btn">
					Create Your First Spark
				</button>
			</div>
		{:else}
			<div class="sparks-list">
				{#each sparks as spark (spark.id)}
					<div class="spark-item">
						<div class="spark-main">
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
						</div>

						<div class="spark-actions">
							<button onclick={() => handleDevelop(spark)} class="develop-btn">
								Develop
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>

<style>
	.sparks-container {
		min-height: 100vh;
		background: #f8fafc;
	}

	.page-header {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem 1rem;
	}

	.page-header h1 {
		font-size: 1.75rem;
		font-weight: 700;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin: 0;
	}

	.main-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem 2rem;
	}

	.error-banner {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.retry-btn {
		background: #dc2626;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.actions-bar {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 2rem;
	}

	.create-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 500;
	}

	.create-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
	}

	.create-form {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.create-form h2 {
		margin: 0 0 1.5rem 0;
		color: #1f2937;
	}

	.form-group {
		margin-bottom: 1.25rem;
	}

	.form-group label {
		display: block;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 1rem;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.form-actions {
		display: flex;
		gap: 1rem;
	}

	.save-btn {
		background: #10b981;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
	}

	.cancel-btn {
		background: #6b7280;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		cursor: pointer;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 4rem 0;
		color: #6b7280;
	}

	.loader {
		width: 40px;
		height: 40px;
		border: 4px solid #e2e8f0;
		border-top-color: #667eea;
		border-radius: 50%;
		animation: spin 1s ease-in-out infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.empty-state {
		text-align: center;
		padding: 4rem 0;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-state h2 {
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.empty-state p {
		color: #6b7280;
		margin-bottom: 2rem;
	}

	.create-first-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		padding: 1rem 2rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1.1rem;
		font-weight: 500;
	}

	.sparks-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.spark-item {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.spark-item:hover {
		border-color: #667eea;
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
	}

	.spark-main {
		flex: 1;
	}

	.spark-info {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.75rem;
	}

	.spark-title {
		margin: 0;
		color: #1f2937;
		font-size: 1.25rem;
		font-weight: 600;
		line-height: 1.3;
	}

	.spark-date {
		color: #6b7280;
		font-size: 0.875rem;
		white-space: nowrap;
		margin-left: 1rem;
		font-weight: 500;
	}

	.initial-thoughts {
		margin-bottom: 1rem;
	}

	.initial-thoughts p {
		color: #4b5563;
		line-height: 1.5;
		margin: 0;
		font-style: italic;
		white-space: pre-line;
	}

	.spark-meta {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.backstory-indicator {
		display: flex;
		align-items: center;
	}

	.indicator {
		font-size: 0.875rem;
		font-weight: 500;
		padding: 0.25rem 0.75rem;
		border-radius: 16px;
	}

	.indicator.has-backstory {
		background: #d1fae5;
		color: #065f46;
	}

	.indicator.no-backstory {
		background: #fef3c7;
		color: #92400e;
	}


	.spark-actions {
		margin-left: 1rem;
		flex-shrink: 0;
	}

	.develop-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 500;
		font-size: 0.9rem;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.develop-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
	}

	@media (max-width: 768px) {

		.spark-item {
			flex-direction: column;
			gap: 1rem;
		}

		.spark-info {
			flex-direction: column;
			gap: 0.5rem;
			align-items: flex-start;
		}

		.spark-date {
			margin-left: 0;
		}

		.spark-actions {
			margin-left: 0;
			align-self: flex-end;
		}

		.spark-meta {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}
	}
</style>