<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getAuthState, clearAuth, authenticatedFetch } from '$lib/auth';
	import AppNav from '$lib/components/AppNav.svelte';

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
		sparkTitle?: string;
		artifactTypeName?: string;
	}

	interface ArtifactType {
		id: string;
		name: string;
		description?: string;
	}

	let authState = $state(getAuthState());
	let artifact = $state<Artifact | null>(null);
	let artifactType = $state<ArtifactType | null>(null);
	let isLoading = $state(true);
	let error = $state('');
	let isUpdating = $state(false);

	// Editor state
	let isEditing = $state(false);
	let editedContent = $state('');
	let editedHashtags = $state('');
	let editedStatus = $state<'draft' | 'final'>('draft');

	onMount(() => {
		authState = getAuthState();
		if (!authState.isAuthenticated) {
			goto('/login');
			return;
		}
		loadArtifact();
	});

	async function loadArtifact() {
		try {
			isLoading = true;
			error = '';
			const artifactId = $page.params.id;

			const response = await authenticatedFetch(`http://localhost:3000/api/artifacts/${artifactId}`);

			if (!response.ok) {
				if (response.status === 401) {
					clearAuth();
					goto('/login');
					return;
				}
				if (response.status === 404) {
					throw new Error('Artifact not found');
				}
				throw new Error(`Failed to load artifact: ${response.status}`);
			}

			artifact = await response.json();

			// Load artifact type details
			if (artifact) {
				await loadArtifactType(artifact.artifactTypeId);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load artifact';
			console.error('Error loading artifact:', err);
		} finally {
			isLoading = false;
		}
	}

	async function loadArtifactType(typeId: string) {
		try {
			const response = await authenticatedFetch('http://localhost:3000/api/artifacts/types/list');
			if (response.ok) {
				const types: ArtifactType[] = await response.json();
				artifactType = types.find(t => t.id === typeId) || null;
			}
		} catch (err) {
			console.error('Error loading artifact type:', err);
		}
	}

	async function updateArtifact() {
		if (!artifact) return;

		try {
			isUpdating = true;
			error = '';

			const hashtags = editedHashtags
				.split(',')
				.map(tag => tag.trim())
				.filter(tag => tag.length > 0);

			const response = await authenticatedFetch(`http://localhost:3000/api/artifacts/${artifact.id}`, {
				method: 'PUT',
				body: JSON.stringify({
					content: {
						text: editedContent.trim(),
						hashtags: hashtags.length > 0 ? hashtags : undefined
					},
					status: editedStatus
				})
			});

			if (!response.ok) {
				throw new Error(`Failed to update artifact: ${response.status}`);
			}

			const updatedArtifact = await response.json();
			artifact = updatedArtifact;
			isEditing = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update artifact';
			console.error('Error updating artifact:', err);
		} finally {
			isUpdating = false;
		}
	}

	function startEditing() {
		if (!artifact) return;

		editedContent = artifact.content.text;
		editedHashtags = artifact.content.hashtags?.join(', ') || '';
		editedStatus = artifact.status;
		isEditing = true;
	}

	function cancelEditing() {
		isEditing = false;
		editedContent = '';
		editedHashtags = '';
		editedStatus = 'draft';
	}

	async function deleteArtifact() {
		if (!artifact) return;

		if (!confirm('Are you sure you want to delete this artifact? This action cannot be undone.')) {
			return;
		}

		try {
			const response = await authenticatedFetch(`http://localhost:3000/api/artifacts/${artifact.id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error(`Failed to delete artifact: ${response.status}`);
			}

			// Redirect to artifacts list after successful deletion
			goto('/artifacts');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete artifact';
			console.error('Error deleting artifact:', err);
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function handleViewSpark() {
		if (artifact?.sparkId) {
			goto(`/sparks/${artifact.sparkId}`);
		}
	}

	function copyToClipboard() {
		if (artifact?.content.text) {
			navigator.clipboard.writeText(artifact.content.text);
		}
	}
</script>

<svelte:head>
	<title>{artifact ? `Artifact - ${artifactType?.name || 'Unknown Type'}` : 'Loading...'} - Spark</title>
</svelte:head>

<AppNav />

<div class="artifact-details-container">
	<header class="header">
		<div class="header-content container">
			<button onclick={() => goto('/artifacts')} class="btn btn-neutral btn-sm">
				← Back to Artifacts
			</button>
			{#if authState.user}
				<span class="user-info">{authState.user.email}</span>
			{/if}
		</div>
	</header>

	<main class="content-container">
		{#if error}
			<div class="alert alert-error flex justify-between items-center">
				<span>{error}</span>
				<button onclick={loadArtifact} class="btn btn-error btn-sm">Retry</button>
			</div>
		{/if}

		{#if isLoading}
			<div class="loading">
				<div class="spinner"></div>
				<p>Loading artifact details...</p>
			</div>
		{:else if artifact}
			<div class="card artifact-header mb-xl">
				<div class="card-body">
					<div class="artifact-header-content">
						<div class="artifact-title-section">
							<div class="type-and-status">
								<h1 class="page-title">{artifactType?.name || 'Unknown Type'}</h1>
								<span class="status-badge" class:draft={artifact.status === 'draft'} class:final={artifact.status === 'final'}>
									{artifact.status}
								</span>
							</div>
							<div class="artifact-meta">
								<p class="page-subtitle">
									Created {formatDate(artifact.createdAt)}
									{#if artifact.updatedAt !== artifact.createdAt}
										• Updated {formatDate(artifact.updatedAt)}
									{/if}
								</p>
								{#if artifactType?.description}
									<p class="type-description">{artifactType.description}</p>
								{/if}
							</div>
						</div>
						<div class="artifact-actions">
							{#if !isEditing}
								<button onclick={startEditing} class="btn btn-primary">
									✏️ Edit
								</button>
								<button onclick={copyToClipboard} class="btn btn-neutral">
									📋 Copy
								</button>
								<button onclick={deleteArtifact} class="btn btn-error">
									🗑️ Delete
								</button>
							{/if}
						</div>
					</div>
				</div>
			</div>

			{#if artifact.sparkTitle}
				<div class="card spark-reference mb-xl">
					<div class="card-body">
						<div class="spark-reference-content">
							<span class="spark-label">Generated from spark:</span>
							<button onclick={handleViewSpark} class="spark-link">
								✨ {artifact.sparkTitle}
							</button>
						</div>
					</div>
				</div>
			{/if}

			<div class="card content-section">
				<div class="card-header flex justify-between items-center">
					<h2>Content</h2>
					{#if isEditing}
						<div class="editing-actions">
							<button onclick={updateArtifact} disabled={isUpdating} class="btn btn-success btn-sm">
								{isUpdating ? 'Saving...' : 'Save Changes'}
							</button>
							<button onclick={cancelEditing} class="btn btn-neutral btn-sm">Cancel</button>
						</div>
					{/if}
				</div>

				<div class="card-body">
					{#if isEditing}
						<div class="editing-container">
							<div class="form-group">
								<label class="form-label">Status:</label>
								<select bind:value={editedStatus} class="form-input">
									<option value="draft">Draft</option>
									<option value="final">Final</option>
								</select>
							</div>

							<div class="form-group">
								<label class="form-label">Content:</label>
								<textarea
									bind:value={editedContent}
									placeholder="Enter artifact content..."
									class="content-editor"
									rows="15"
								></textarea>
							</div>

							<div class="form-group">
								<label class="form-label">Hashtags (comma-separated):</label>
								<input
									type="text"
									bind:value={editedHashtags}
									placeholder="hashtag1, hashtag2, hashtag3"
									class="form-input"
								/>
								<span class="field-hint">Separate hashtags with commas</span>
							</div>
						</div>
					{:else}
						<div class="content-display">
							<div class="content-text">
								{artifact.content.text}
							</div>

							{#if artifact.content.hashtags && artifact.content.hashtags.length > 0}
								<div class="hashtags">
									{#each artifact.content.hashtags as hashtag}
										<span class="hashtag">#{hashtag}</span>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<div class="empty-state">
				<h2 class="empty-state-title">Artifact not found</h2>
				<p class="empty-state-description">The artifact you're looking for doesn't exist or you don't have access to it.</p>
				<button onclick={() => goto('/artifacts')} class="btn btn-neutral">Back to Artifacts</button>
			</div>
		{/if}
	</main>
</div>

<style>
	.artifact-details-container {
		min-height: 100vh;
	}

	.header {
		background: var(--surface-color);
		border-bottom: 1px solid var(--border-color);
		padding: var(--spacing-lg) 0;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.user-info {
		color: var(--text-muted);
		font-size: var(--text-sm);
	}

	.artifact-header-content {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--spacing-lg);
	}

	.artifact-title-section {
		flex: 1;
	}

	.type-and-status {
		display: flex;
		align-items: center;
		gap: var(--spacing-lg);
		margin-bottom: var(--spacing-sm);
	}

	.artifact-meta {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.type-description {
		color: var(--text-tertiary);
		font-style: italic;
		margin: 0;
	}

	.status-badge {
		padding: var(--spacing-xs) var(--spacing-md);
		border-radius: var(--border-radius-full);
		font-size: var(--text-xs);
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		flex-shrink: 0;
	}

	.status-badge.draft {
		background: var(--warning-bg);
		color: #92400e;
	}

	.status-badge.final {
		background: var(--success-bg);
		color: #065f46;
	}

	.artifact-actions {
		display: flex;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
		flex-shrink: 0;
	}

	.spark-reference-content {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
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

	.card-header h2 {
		margin: 0;
		color: var(--text-secondary);
		font-size: var(--text-xl);
		font-weight: var(--font-weight-semibold);
	}

	.editing-actions {
		display: flex;
		gap: var(--spacing-sm);
	}

	.editing-container {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.content-editor {
		width: 100%;
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-md);
		padding: var(--spacing-lg);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		line-height: 1.5;
		resize: vertical;
		min-height: 300px;
		background: var(--surface-color);
	}

	.content-editor:focus {
		outline: none;
		border-color: var(--primary-color);
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.content-display {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.content-text {
		color: var(--text-secondary);
		line-height: 1.6;
		white-space: pre-line;
		font-size: var(--text-base);
		background: var(--surface-hover);
		padding: var(--spacing-lg);
		border-radius: var(--border-radius-md);
		border-left: 4px solid var(--primary-color);
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
		border: 1px solid var(--border-color);
	}

	.field-hint {
		display: block;
		margin-top: var(--spacing-xs);
		font-size: var(--text-xs);
		color: var(--text-muted);
	}

	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			gap: var(--spacing-lg);
		}

		.artifact-header-content {
			flex-direction: column;
			align-items: stretch;
			gap: var(--spacing-lg);
		}

		.type-and-status {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-sm);
		}

		.artifact-actions {
			justify-content: stretch;
		}

		.artifact-actions .btn {
			flex: 1;
		}

		.spark-reference-content {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-xs);
		}

		.card-header {
			flex-direction: column;
			gap: var(--spacing-lg);
			align-items: flex-start !important;
		}

		.editing-actions {
			align-self: stretch;
		}

		.editing-actions .btn {
			flex: 1;
		}
	}
</style>