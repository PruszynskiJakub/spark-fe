<script lang="ts">
	import { onMount } from 'svelte';
	import { getAuthState, clearAuth, authenticatedFetch } from '$lib/auth';
	import { goto } from '$app/navigation';
	import AppNav from '$lib/components/AppNav.svelte';
	import CreateArtifactModal from '$lib/components/CreateArtifactModal.svelte';

	interface Artifact {
		id: string;
		sparkId: string;
		userId: string;
		artifactTypeId: string;
		status: 'draft' | 'final';
		content: {
			text: string;
			hashtags?: string[];
		};
		createdAt: string;
		updatedAt: string;
		sparkTitle?: string; // From by-spark endpoint
	}

	interface ArtifactType {
		id: string;
		name: string;
		description?: string;
	}

	interface PaginatedArtifactsResponse {
		data: Artifact[];
		pagination: {
			currentPage: number;
			totalPages: number;
			totalItems: number;
			itemsPerPage: number;
			hasNextPage: boolean;
			hasPreviousPage: boolean;
		};
	}

	type SortBy = 'createdAt' | 'updatedAt' | 'status';
	type SortOrder = 'asc' | 'desc';
	type StatusFilter = 'draft' | 'final' | '';

	interface ArtifactFilters {
		status: StatusFilter;
		artifactTypeId: string;
		sparkId: string;
		contentText: string;
		createdAfter: string;
		createdBefore: string;
		updatedAfter: string;
		updatedBefore: string;
	}

	let authState = $state(getAuthState());
	let artifacts = $state<Artifact[]>([]);
	let artifactTypes = $state<ArtifactType[]>([]);
	let isLoading = $state(true);
	let isLoadingTypes = $state(true);
	let error = $state('');
	let typesError = $state('');

	// Pagination state
	let pagination = $state({
		currentPage: 1,
		totalPages: 1,
		totalItems: 0,
		itemsPerPage: 10,
		hasNextPage: false,
		hasPreviousPage: false
	});

	// Sorting state
	let sortBy = $state<SortBy>('createdAt');
	let sortOrder = $state<SortOrder>('desc');

	// Filtering state
	let filters = $state<ArtifactFilters>({
		status: '',
		artifactTypeId: '',
		sparkId: '',
		contentText: '',
		createdAfter: '',
		createdBefore: '',
		updatedAfter: '',
		updatedBefore: ''
	});

	// UI state
	let showCreateArtifactModal = $state(false);
	let showFilters = $state(false);

	onMount(() => {
		authState = getAuthState();
		if (!authState.isAuthenticated) {
			goto('/login');
			return;
		}
		loadArtifacts();
		loadArtifactTypes();
	});

	async function loadArtifacts() {
		try {
			isLoading = true;
			error = '';

			// Build query parameters
			const params = new URLSearchParams();
			params.set('page', pagination.currentPage.toString());
			params.set('limit', pagination.itemsPerPage.toString());
			params.set('sortBy', sortBy);
			params.set('sortOrder', sortOrder);

			// Add filters if they have values
			if (filters.status) params.set('status', filters.status);
			if (filters.artifactTypeId) params.set('artifactTypeId', filters.artifactTypeId);
			if (filters.sparkId) params.set('sparkId', filters.sparkId);
			if (filters.contentText) params.set('contentText', filters.contentText);
			if (filters.createdAfter) params.set('createdAfter', filters.createdAfter);
			if (filters.createdBefore) params.set('createdBefore', filters.createdBefore);
			if (filters.updatedAfter) params.set('updatedAfter', filters.updatedAfter);
			if (filters.updatedBefore) params.set('updatedBefore', filters.updatedBefore);

			const response = await authenticatedFetch(`http://localhost:3000/api/artifacts?${params.toString()}`);

			if (!response.ok) {
				if (response.status === 401) {
					clearAuth();
					goto('/login');
					return;
				}
				throw new Error(`Failed to load artifacts: ${response.status}`);
			}

			const result: PaginatedArtifactsResponse = await response.json();
			artifacts = result.data;
			pagination = result.pagination;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load artifacts';
			console.error('Error loading artifacts:', err);
		} finally {
			isLoading = false;
		}
	}

	async function loadArtifactTypes() {
		try {
			isLoadingTypes = true;
			typesError = '';

			const response = await authenticatedFetch('http://localhost:3000/api/artifacts/types/list');

			if (!response.ok) {
				throw new Error(`Failed to load artifact types: ${response.status}`);
			}

			artifactTypes = await response.json();
		} catch (err) {
			typesError = err instanceof Error ? err.message : 'Failed to load artifact types';
			console.error('Error loading artifact types:', err);
		} finally {
			isLoadingTypes = false;
		}
	}

	function getArtifactTypeName(typeId: string): string {
		const type = artifactTypes.find(t => t.id === typeId);
		return type?.name || 'Unknown Type';
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

	function truncateText(text: string, maxLength: number = 150): string {
		if (text.length <= maxLength) {
			return text;
		}
		return text.substring(0, maxLength).trim() + '...';
	}

	function handleViewSpark(sparkId: string) {
		goto(`/sparks/${sparkId}`);
	}

	async function handleDeleteArtifact(artifactId: string) {
		if (!confirm('Are you sure you want to delete this artifact?')) {
			return;
		}

		try {
			const response = await authenticatedFetch(`http://localhost:3000/api/artifacts/${artifactId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error(`Failed to delete artifact: ${response.status}`);
			}

			// Refresh the artifacts list
			await loadArtifacts();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete artifact';
			console.error('Error deleting artifact:', err);
		}
	}

	function handleCreateArtifactSuccess(artifact: any) {
		// Refresh the artifacts list to show the new artifact
		loadArtifacts();
		showCreateArtifactModal = false;
	}

	function handleCreateArtifactError(errorMessage: string) {
		error = errorMessage;
	}

	// Pagination handlers
	function goToPage(page: number) {
		if (page >= 1 && page <= pagination.totalPages && page !== pagination.currentPage) {
			pagination.currentPage = page;
			loadArtifacts();
		}
	}

	function changePage(delta: number) {
		goToPage(pagination.currentPage + delta);
	}

	// Sorting handlers
	function handleSortChange(newSortBy: SortBy) {
		if (sortBy === newSortBy) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = newSortBy;
			sortOrder = 'desc';
		}
		pagination.currentPage = 1;
		loadArtifacts();
	}

	// Filter handlers
	function handleFilterChange() {
		pagination.currentPage = 1;
		loadArtifacts();
	}

	// Debounced search for content text
	let searchTimeout: ReturnType<typeof setTimeout>;
	function handleSearchInput() {
		if (searchTimeout) clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			pagination.currentPage = 1;
			loadArtifacts();
		}, 300);
	}

	function resetFilters() {
		filters = {
			status: '',
			artifactTypeId: '',
			sparkId: '',
			contentText: '',
			createdAfter: '',
			createdBefore: '',
			updatedAfter: '',
			updatedBefore: ''
		};
		pagination.currentPage = 1;
		loadArtifacts();
	}

	function hasActiveFilters(): boolean {
		return (
			filters.status !== '' ||
			filters.artifactTypeId !== '' ||
			filters.sparkId !== '' ||
			filters.contentText !== '' ||
			filters.createdAfter !== '' ||
			filters.createdBefore !== '' ||
			filters.updatedAfter !== '' ||
			filters.updatedBefore !== ''
		);
	}
</script>

<svelte:head>
	<title>My Artifacts - Spark</title>
</svelte:head>

<AppNav />

<div class="content-container">
	<header class="page-header">
		<h1 class="page-title">🎨 My Artifacts</h1>
		<p class="page-subtitle">AI-generated content based on your sparks</p>
	</header>

	<main class="main-content">
		{#if error}
			<div class="alert alert-error flex justify-between items-center mb-xl">
				<span>{error}</span>
				<button onclick={loadArtifacts} class="btn btn-error btn-sm">Retry</button>
			</div>
		{/if}

		{#if typesError}
			<div class="alert alert-warning flex justify-between items-center mb-xl">
				<span>Types: {typesError}</span>
				<button onclick={loadArtifactTypes} class="btn btn-warning btn-sm">Retry</button>
			</div>
		{/if}

		{#if isLoading}
			<div class="loading">
				<div class="spinner"></div>
				<p>Loading your artifacts...</p>
			</div>
		{:else}
		<!-- Always show actions bar if there are artifacts OR if filters are applied -->
		{#if artifacts.length > 0 || hasActiveFilters()}
			<div class="actions-bar mb-xl">
				<div class="actions-left">
					<button
						onclick={() => showFilters = !showFilters}
						class="btn btn-neutral"
					>
						{showFilters ? 'Hide Filters' : 'Show Filters'}
					</button>
					{#if pagination.totalItems > 0}
						<span class="results-count">
							{pagination.totalItems} artifact{pagination.totalItems !== 1 ? 's' : ''}
						</span>
					{/if}
				</div>
				<button
					onclick={() => showCreateArtifactModal = true}
					class="btn btn-primary"
				>
					🤖 Generate New Artifact
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
								<label class="form-label">Search content:</label>
								<input
									type="text"
									bind:value={filters.contentText}
									oninput={handleSearchInput}
									placeholder="Search in artifact content..."
									class="form-input"
									onkeydown={(e) => e.key === 'Enter' && handleFilterChange()}
								/>
							</div>

							<div class="form-group">
								<label class="form-label">Status:</label>
								<select
									bind:value={filters.status}
									onchange={handleFilterChange}
									class="form-input"
								>
									<option value="">All statuses</option>
									<option value="draft">Draft</option>
									<option value="final">Final</option>
								</select>
							</div>

							<div class="form-group">
								<label class="form-label">Type:</label>
								<select
									bind:value={filters.artifactTypeId}
									onchange={handleFilterChange}
									class="form-input"
									disabled={isLoadingTypes}
								>
									<option value="">All types</option>
									{#each artifactTypes as type}
										<option value={type.id}>{type.name}</option>
									{/each}
								</select>
							</div>

							<div class="form-group">
								<label class="form-label">Sort by:</label>
								<select
									bind:value={sortBy}
									onchange={() => handleSortChange(sortBy)}
									class="form-input"
								>
									<option value="createdAt">Created Date</option>
									<option value="updatedAt">Updated Date</option>
									<option value="status">Status</option>
								</select>
							</div>

							<div class="form-group">
								<label class="form-label">Sort order:</label>
								<select
									bind:value={sortOrder}
									onchange={() => handleSortChange(sortBy)}
									class="form-input"
								>
									<option value="desc">Newest First</option>
									<option value="asc">Oldest First</option>
								</select>
							</div>

							<div class="form-group">
								<label class="form-label">Created after:</label>
								<input
									type="datetime-local"
									bind:value={filters.createdAfter}
									onchange={handleFilterChange}
									class="form-input"
								/>
							</div>

							<div class="form-group">
								<label class="form-label">Created before:</label>
								<input
									type="datetime-local"
									bind:value={filters.createdBefore}
									onchange={handleFilterChange}
									class="form-input"
								/>
							</div>
						</div>

						<div class="filters-actions">
							<button onclick={resetFilters} class="btn btn-neutral">
								Clear All Filters
							</button>
						</div>
					</div>
				</div>
			{/if}

			<!-- Show artifacts if they exist, otherwise show filtered empty state -->
			{#if artifacts.length > 0}
				<div class="artifacts-list">
					{#each artifacts as artifact (artifact.id)}
						<div class="card artifact-item">
							<div class="card-body artifact-main">
								<div class="artifact-header">
									<div class="artifact-info">
										<div class="artifact-type">
											{#if isLoadingTypes}
												<span class="type-badge loading">Loading...</span>
											{:else}
												<span class="type-badge">{getArtifactTypeName(artifact.artifactTypeId)}</span>
											{/if}
										</div>
										<div class="artifact-status">
											<span class="status-badge" class:draft={artifact.status === 'draft'} class:final={artifact.status === 'final'}>
												{artifact.status}
											</span>
										</div>
									</div>
									<time class="artifact-date">{formatDate(artifact.createdAt)}</time>
								</div>

								{#if artifact.sparkTitle}
									<div class="spark-reference">
										<span class="spark-label">From spark:</span>
										<button onclick={() => handleViewSpark(artifact.sparkId)} class="spark-link">
							✨ {artifact.sparkTitle}
										</button>
									</div>
								{/if}

								<div class="artifact-content">
									<p class="content-text">{truncateText(artifact.content.text)}</p>
									{#if artifact.content.hashtags && artifact.content.hashtags.length > 0}
										<div class="hashtags">
											{#each artifact.content.hashtags as hashtag}
												<span class="hashtag">#{hashtag}</span>
											{/each}
										</div>
									{/if}
								</div>

								<div class="artifact-actions">
									<button
										onclick={() => handleDeleteArtifact(artifact.id)}
										class="btn btn-error btn-sm"
									>
										Delete
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<!-- Empty state for filtered results -->
				<div class="empty-state">
					<div class="empty-state-icon">🔍</div>
					<h2 class="empty-state-title">No artifacts found</h2>
					<p class="empty-state-description">
						{#if hasActiveFilters()}
							No artifacts match your current search criteria. Try adjusting your filters or clearing them to see all artifacts.
						{:else}
							You don't have any artifacts yet. Generate AI-powered content from your sparks.
						{/if}
					</p>
					<div class="empty-state-actions">
						{#if hasActiveFilters()}
							<button onclick={resetFilters} class="btn btn-neutral btn-lg">
								Clear All Filters
							</button>
						{/if}
						<button
							onclick={() => showCreateArtifactModal = true}
							class="btn btn-primary btn-lg"
						>
							🤖 Generate New Artifact
						</button>
						{#if !hasActiveFilters()}
							<a href="/sparks" class="btn btn-neutral btn-lg">
								Go to My Sparks
							</a>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Pagination Controls -->
			{#if pagination.totalPages > 1}
				<div class="pagination-section mt-xl">
					<div class="pagination-controls">
						<button
							onclick={() => changePage(-1)}
							disabled={!pagination.hasPreviousPage}
							class="btn btn-neutral btn-sm"
						>
							← Previous
						</button>

						<div class="pagination-info">
							<span class="pagination-text">
								Page {pagination.currentPage} of {pagination.totalPages}
							</span>
							<div class="pagination-numbers">
								{#each Array.from({length: Math.min(5, pagination.totalPages)}, (_, i) => {
									const startPage = Math.max(1, pagination.currentPage - 2);
									const endPage = Math.min(pagination.totalPages, startPage + 4);
									const adjustedStart = Math.max(1, endPage - 4);
									return adjustedStart + i;
								}) as pageNum}
									{#if pageNum <= pagination.totalPages}
										<button
											onclick={() => goToPage(pageNum)}
											class="btn btn-sm pagination-number"
											class:btn-primary={pageNum === pagination.currentPage}
											class:btn-neutral={pageNum !== pagination.currentPage}
										>
											{pageNum}
										</button>
									{/if}
								{/each}
							</div>
						</div>

						<button
							onclick={() => changePage(1)}
							disabled={!pagination.hasNextPage}
							class="btn btn-neutral btn-sm"
						>
							Next →
						</button>
					</div>
				</div>
			{/if}
			{:else}
				<!-- Original empty state for users with no artifacts and no filters -->
				<div class="empty-state">
					<div class="empty-state-icon">🎨</div>
					<h2 class="empty-state-title">No artifacts yet</h2>
					<p class="empty-state-description">
						Generate AI-powered content from your sparks. Choose any spark and create LinkedIn posts, articles, and more.
					</p>
					<div class="empty-state-actions">
						<button
							onclick={() => showCreateArtifactModal = true}
							class="btn btn-primary btn-lg"
						>
							🤖 Generate First Artifact
						</button>
						<a href="/sparks" class="btn btn-neutral btn-lg">
							Go to My Sparks
						</a>
					</div>
				</div>
			{/if}
		{/if}
	</main>
</div>

<!-- Create Artifact Modal -->
<CreateArtifactModal
	isOpen={showCreateArtifactModal}
	onClose={() => showCreateArtifactModal = false}
	onSuccess={handleCreateArtifactSuccess}
	onError={handleCreateArtifactError}
/>

<style>
	/* Actions Bar */
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
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--spacing-lg);
		margin-bottom: var(--spacing-lg);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.filters-actions {
		display: flex;
		justify-content: flex-end;
		padding-top: var(--spacing-md);
		border-top: 1px solid var(--border-color);
	}

	/* Pagination */
	.pagination-section {
		border-top: 1px solid var(--border-color);
		padding-top: var(--spacing-xl);
	}

	.pagination-controls {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--spacing-lg);
		flex-wrap: wrap;
	}

	.pagination-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.pagination-text {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		white-space: nowrap;
	}

	.pagination-numbers {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.pagination-number {
		min-width: 40px;
	}


	.artifacts-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.artifact-item {
		transition: border-color var(--transition-normal), box-shadow var(--transition-normal);
	}

	.artifact-item:hover {
		border-color: var(--primary-color);
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
	}

	.artifact-main {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.artifact-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--spacing-lg);
		flex-wrap: wrap;
	}

	.artifact-info {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		flex-wrap: wrap;
	}

	.type-badge {
		background: var(--info-bg);
		color: var(--primary-color);
		padding: var(--spacing-xs) var(--spacing-md);
		border-radius: var(--border-radius-full);
		font-size: var(--text-sm);
		font-weight: var(--font-weight-medium);
	}

	.type-badge.loading {
		background: var(--bg-secondary);
		color: var(--text-muted);
	}

	.status-badge {
		padding: var(--spacing-xs) var(--spacing-md);
		border-radius: var(--border-radius-full);
		font-size: var(--text-xs);
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.status-badge.draft {
		background: var(--warning-bg);
		color: #92400e;
	}

	.status-badge.final {
		background: var(--success-bg);
		color: #065f46;
	}

	.artifact-date {
		color: var(--text-muted);
		font-size: var(--text-sm);
		white-space: nowrap;
		font-weight: var(--font-weight-medium);
	}

	.spark-reference {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
		padding: var(--spacing-md);
		background: var(--surface-hover);
		border-radius: var(--border-radius-md);
		border-left: 4px solid var(--primary-color);
	}

	.spark-label {
		color: var(--text-muted);
		font-size: var(--text-sm);
		font-weight: var(--font-weight-medium);
	}

	.spark-link {
		background: none;
		border: none;
		color: var(--primary-color);
		text-decoration: none;
		font-weight: var(--font-weight-semibold);
		cursor: pointer;
		transition: color var(--transition-normal);
		font-size: var(--text-sm);
	}

	.spark-link:hover {
		color: var(--primary-hover);
		text-decoration: underline;
	}

	.artifact-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.content-text {
		color: var(--text-secondary);
		line-height: 1.6;
		margin: 0;
		white-space: pre-line;
	}

	.hashtags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
	}

	.hashtag {
		background: var(--surface-hover);
		color: var(--text-secondary);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--border-radius-md);
		font-size: var(--text-sm);
		font-weight: var(--font-weight-medium);
	}

	.artifact-actions {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: var(--spacing-md);
		padding-top: var(--spacing-md);
		border-top: 1px solid var(--border-color);
	}

	.empty-state-actions {
		display: flex;
		gap: var(--spacing-lg);
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		margin-top: var(--spacing-xl);
	}

	@media (max-width: 768px) {
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

		.filters-actions {
			justify-content: center;
		}

		.pagination-controls {
			flex-direction: column;
			gap: var(--spacing-md);
		}

		.pagination-numbers {
			justify-content: center;
		}

		.artifact-header {
			flex-direction: column;
			gap: var(--spacing-sm);
			align-items: flex-start;
		}

		.artifact-info {
			width: 100%;
			justify-content: space-between;
		}

		.spark-reference {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-xs);
		}

		.artifact-actions {
			justify-content: stretch;
		}

		.artifact-actions .btn {
			flex: 1;
		}

		.empty-state-actions {
			flex-direction: column;
			align-items: stretch;
		}

		.empty-state-actions .btn {
			width: 100%;
		}
	}
</style>