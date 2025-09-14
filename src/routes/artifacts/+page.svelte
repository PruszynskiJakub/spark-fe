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

	let authState = $state(getAuthState());
	let artifacts = $state<Artifact[]>([]);
	let artifactTypes = $state<ArtifactType[]>([]);
	let isLoading = $state(true);
	let isLoadingTypes = $state(true);
	let error = $state('');
	let typesError = $state('');

	// Artifact creation modal
	let showCreateArtifactModal = $state(false);

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

			const response = await authenticatedFetch('http://localhost:3000/api/artifacts');

			if (!response.ok) {
				if (response.status === 401) {
					clearAuth();
					goto('/login');
					return;
				}
				throw new Error(`Failed to load artifacts: ${response.status}`);
			}

			artifacts = await response.json();
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
		{:else if artifacts.length === 0}
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
		{:else}
			<div class="artifacts-header mb-xl">
				<div class="artifacts-actions">
					<button
						onclick={() => showCreateArtifactModal = true}
						class="btn btn-primary"
					>
						🤖 Generate New Artifact
					</button>
				</div>
			</div>

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
	.artifacts-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--spacing-lg);
	}


	.artifacts-actions {
		display: flex;
		align-items: center;
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
		.artifacts-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.artifacts-actions .btn {
			width: 100%;
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