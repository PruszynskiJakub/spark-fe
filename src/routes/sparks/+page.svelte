<script lang="ts">
	import { onMount } from 'svelte';
	import { getAuthState, clearAuth, authenticatedFetch, deleteSpark } from '$lib/auth';
	import { goto } from '$app/navigation';
	import AppNav from '$lib/components/AppNav.svelte';

	interface Spark {
		id: string;
		title: string;
		initialThoughts?: string;
		backstory?: string;
		userId: string;
		createdAt: string;
		artifactsCount: number;
	}

	interface PaginatedSparkResponse {
		data: Spark[];
		pagination: {
			currentPage: number;
			totalPages: number;
			totalItems: number;
			itemsPerPage: number;
			hasNextPage: boolean;
			hasPreviousPage: boolean;
		};
	}

	interface SparkFilters {
		page: number;
		limit: number;
		sortBy: 'title' | 'createdAt' | 'initialThoughts' | 'backstory';
		sortOrder: 'asc' | 'desc';
		title?: string;
		initialThoughts?: string;
		backstory?: string;
		createdAfter?: string;
		createdBefore?: string;
		hasInitialThoughts?: boolean;
		hasBackstory?: boolean;
	}

	let authState = $state(getAuthState());
	let sparks = $state<Spark[]>([]);
	let pagination = $state<PaginatedSparkResponse['pagination'] | null>(null);
	let isLoading = $state(true);
	let error = $state('');
	let showCreateForm = $state(false);

	// Filters and search
	let filters = $state<SparkFilters>({
		page: 1,
		limit: 10,
		sortBy: 'createdAt',
		sortOrder: 'desc'
	});
	let searchTitle = $state('');
	let searchInitialThoughts = $state('');
	let showFilters = $state(false);

	// Deletion state
	let deletingSparkId = $state<string | null>(null);
	let showDeleteConfirm = $state<string | null>(null);

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

			// Build query parameters
			const params = new URLSearchParams();
			params.append('page', filters.page.toString());
			params.append('limit', filters.limit.toString());
			params.append('sortBy', filters.sortBy);
			params.append('sortOrder', filters.sortOrder);

			if (searchTitle.trim()) params.append('title', searchTitle.trim());
			if (searchInitialThoughts.trim()) params.append('initialThoughts', searchInitialThoughts.trim());
			if (filters.createdAfter) params.append('createdAfter', filters.createdAfter);
			if (filters.createdBefore) params.append('createdBefore', filters.createdBefore);
			if (filters.hasInitialThoughts !== undefined) params.append('hasInitialThoughts', filters.hasInitialThoughts.toString());
			if (filters.hasBackstory !== undefined) params.append('hasBackstory', filters.hasBackstory.toString());

			const response = await authenticatedFetch(`http://localhost:3000/api/sparks?${params.toString()}`);

			if (!response.ok) {
				if (response.status === 401) {
					clearAuth();
					goto('/login');
					return;
				}
				throw new Error(`Failed to load sparks: ${response.status}`);
			}

			const result: PaginatedSparkResponse = await response.json();
			sparks = result.data;
			pagination = result.pagination;
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

			// Refresh the spark list after creating
			await loadSparks();

			// Reset form
			newSpark = { title: '', initialThoughts: '' };
			showCreateForm = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create spark';
			console.error('Error creating spark:', err);
		}
	}

	// Pagination functions
	function goToPage(page: number) {
		filters.page = page;
		loadSparks();
	}

	function nextPage() {
		if (pagination?.hasNextPage) {
			goToPage(filters.page + 1);
		}
	}

	function previousPage() {
		if (pagination?.hasPreviousPage) {
			goToPage(filters.page - 1);
		}
	}

	// Search and filter functions
	function applyFilters() {
		filters.page = 1; // Reset to first page when filtering
		loadSparks();
	}

	function resetFilters() {
		filters = {
			page: 1,
			limit: 10,
			sortBy: 'createdAt',
			sortOrder: 'desc'
		};
		searchTitle = '';
		searchInitialThoughts = '';
		loadSparks();
	}

	function changeSortBy(newSortBy: SparkFilters['sortBy']) {
		if (filters.sortBy === newSortBy) {
			filters.sortOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			filters.sortBy = newSortBy;
			filters.sortOrder = 'desc';
		}
		filters.page = 1;
		loadSparks();
	}

	function handleDevelop(spark: Spark) {
		goto(`/sparks/${spark.id}`);
	}

	function confirmDelete(sparkId: string) {
		showDeleteConfirm = sparkId;
	}

	function cancelDelete() {
		showDeleteConfirm = null;
	}

	async function handleDeleteSpark(sparkId: string) {
		try {
			deletingSparkId = sparkId;
			error = '';

			await deleteSpark(sparkId);

			// Refresh the spark list after deletion
			await loadSparks();

			// Close confirmation dialog
			showDeleteConfirm = null;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete spark';
			console.error('Error deleting spark:', err);
		} finally {
			deletingSparkId = null;
		}
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
			<div class="actions-left">
				<button
					onclick={() => showFilters = !showFilters}
					class="btn btn-neutral"
				>
					{showFilters ? 'Hide Filters' : 'Show Filters'}
				</button>
				{#if pagination}
					<span class="results-count">
						{pagination.totalItems} spark{pagination.totalItems !== 1 ? 's' : ''}
					</span>
				{/if}
			</div>
			<button
				onclick={() => showCreateForm = !showCreateForm}
				class="btn btn-primary"
			>
				{showCreateForm ? 'Cancel' : '+ New Spark'}
			</button>
		</div>

		{#if showFilters}
			<div class="card filters-panel mb-xl">
				<div class="card-header">
					<h2>Search & Filters</h2>
				</div>
				<div class="card-body">
					<div class="filters-grid">
						<div class="form-group">
							<label for="searchTitle" class="form-label">Search Title</label>
							<input
								id="searchTitle"
								type="text"
								bind:value={searchTitle}
								placeholder="Search by title..."
								class="form-input"
								onkeydown={(e) => e.key === 'Enter' && applyFilters()}
							/>
						</div>
						<div class="form-group">
							<label for="searchThoughts" class="form-label">Search Initial Thoughts</label>
							<input
								id="searchThoughts"
								type="text"
								bind:value={searchInitialThoughts}
								placeholder="Search initial thoughts..."
								class="form-input"
								onkeydown={(e) => e.key === 'Enter' && applyFilters()}
							/>
						</div>
						<div class="form-group">
							<label for="sortBy" class="form-label">Sort By</label>
							<select
								id="sortBy"
								bind:value={filters.sortBy}
								onchange={applyFilters}
								class="form-input"
							>
								<option value="createdAt">Created Date</option>
								<option value="title">Title</option>
								<option value="initialThoughts">Initial Thoughts</option>
								<option value="backstory">Backstory</option>
							</select>
						</div>
						<div class="form-group">
							<label for="sortOrder" class="form-label">Sort Order</label>
							<select
								id="sortOrder"
								bind:value={filters.sortOrder}
								onchange={applyFilters}
								class="form-input"
							>
								<option value="desc">Newest First</option>
								<option value="asc">Oldest First</option>
							</select>
						</div>
						<div class="form-group">
							<label for="hasInitialThoughts" class="form-label">Has Initial Thoughts</label>
							<select
								id="hasInitialThoughts"
								bind:value={filters.hasInitialThoughts}
								onchange={applyFilters}
								class="form-input"
							>
								<option value={undefined}>Any</option>
								<option value={true}>Yes</option>
								<option value={false}>No</option>
							</select>
						</div>
						<div class="form-group">
							<label for="hasBackstory" class="form-label">Has Backstory</label>
							<select
								id="hasBackstory"
								bind:value={filters.hasBackstory}
								onchange={applyFilters}
								class="form-input"
							>
								<option value={undefined}>Any</option>
								<option value={true}>Yes</option>
								<option value={false}>No</option>
							</select>
						</div>
					</div>
					<div class="form-actions">
						<button onclick={applyFilters} class="btn btn-primary">Apply Filters</button>
						<button onclick={resetFilters} class="btn btn-neutral">Reset All</button>
					</div>
				</div>
			</div>
		{/if}

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
								<div class="artifacts-count">
									<span class="indicator artifacts-indicator">
										🧩 {spark.artifactsCount} artifact{spark.artifactsCount !== 1 ? 's' : ''}
									</span>
								</div>
							</div>

							<div class="spark-actions">
								<button onclick={() => handleDevelop(spark)} class="btn btn-primary">
									Develop
								</button>
								<button onclick={() => confirmDelete(spark.id)} class="btn btn-error btn-sm">
									Delete
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>

			{#if pagination && pagination.totalPages > 1}
				<div class="pagination">
					<button
						onclick={previousPage}
						disabled={!pagination.hasPreviousPage}
						class="btn btn-neutral btn-sm pagination-btn"
					>
						← Previous
					</button>

					<div class="pagination-info">
						<span class="current-page">
							Page {pagination.currentPage} of {pagination.totalPages}
						</span>
						<span class="items-info">
							({pagination.itemsPerPage} per page)
						</span>
					</div>

					<button
						onclick={nextPage}
						disabled={!pagination.hasNextPage}
						class="btn btn-neutral btn-sm pagination-btn"
					>
						Next →
					</button>
				</div>
			{/if}
		{/if}
	</main>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
	<div class="modal-overlay" onclick={cancelDelete}>
		<div class="modal-content card" onclick={(e) => e.stopPropagation()}>
			<div class="card-header">
				<h2>Delete Spark</h2>
			</div>
			<div class="card-body">
				<p>Are you sure you want to delete this spark? This action cannot be undone.</p>
				<p class="warning-text">All artifacts associated with this spark will also be deleted.</p>
			</div>
			<div class="card-footer">
				<div class="modal-actions">
					<button onclick={cancelDelete} class="btn btn-neutral">Cancel</button>
					<button
						onclick={() => handleDeleteSpark(showDeleteConfirm!)}
						disabled={deletingSparkId === showDeleteConfirm}
						class="btn btn-error"
					>
						{deletingSparkId === showDeleteConfirm ? 'Deleting...' : 'Delete Spark'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.actions-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-2xl);
		flex-wrap: wrap;
		gap: var(--spacing-lg);
	}

	.actions-left {
		display: flex;
		align-items: center;
		gap: var(--spacing-lg);
		flex-wrap: wrap;
	}

	.results-count {
		color: var(--text-muted);
		font-size: var(--text-sm);
		font-weight: var(--font-weight-medium);
	}

	/* Filters Panel */
	.filters-panel .card-header h2 {
		margin: 0;
		color: var(--text-primary);
		font-size: var(--text-lg);
		font-weight: var(--font-weight-semibold);
	}

	.filters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: var(--spacing-lg);
		margin-bottom: var(--spacing-xl);
	}

	/* Pagination */
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--spacing-lg);
		margin-top: var(--spacing-2xl);
		padding: var(--spacing-lg);
		border-top: 1px solid var(--border-color);
	}

	.pagination-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-xs);
		min-width: 140px;
	}

	.current-page {
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
		font-size: var(--text-sm);
	}

	.items-info {
		font-size: var(--text-xs);
		color: var(--text-muted);
	}

	.pagination-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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

	.indicator.artifacts-indicator {
		background: var(--info-bg);
		color: #1e40af;
	}

	.spark-actions {
		flex-shrink: 0;
		display: flex;
		gap: var(--spacing-sm);
		align-items: center;
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: var(--spacing-lg);
	}

	.modal-content {
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		animation: modalSlideIn 0.3s ease-out;
	}

	@keyframes modalSlideIn {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.modal-content .card-header h2 {
		margin: 0;
		color: var(--text-primary);
		font-size: var(--text-xl);
		font-weight: var(--font-weight-semibold);
	}

	.modal-actions {
		display: flex;
		gap: var(--spacing-lg);
		justify-content: flex-end;
	}

	.warning-text {
		color: var(--warning-color);
		font-weight: var(--font-weight-medium);
		font-size: var(--text-sm);
		margin-top: var(--spacing-sm);
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
			flex-direction: column;
			align-items: stretch;
		}

		.actions-left {
			justify-content: space-between;
		}

		.filters-grid {
			grid-template-columns: 1fr;
		}

		.pagination {
			flex-direction: column;
			gap: var(--spacing-md);
		}

		.pagination-info {
			order: -1;
		}

		.spark-actions {
			flex-direction: column;
			align-items: stretch;
		}

		.modal-actions {
			flex-direction: column;
		}

		.modal-overlay {
			padding: var(--spacing-md);
		}
	}
</style>