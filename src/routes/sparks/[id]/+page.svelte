<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getAuthState, clearAuth, authenticatedFetch } from '$lib/auth';
	import AppNav from '$lib/components/AppNav.svelte';
	import CreateArtifactModal from '$lib/components/CreateArtifactModal.svelte';

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
	let spark = $state<Spark | null>(null);
	let isLoading = $state(true);
	let error = $state('');
	let isSaving = $state(false);

	// Editor state
	let isEditing = $state(false);
	let backstoryContent = $state('');

	// Artifact creation
	let showCreateArtifactModal = $state(false);
	let artifactError = $state('');

	$effect(() => {
		// Set default view mode based on backstory content
		if (spark && !isEditing) {
			isEditing = !spark.backstory || spark.backstory.trim() === '';
		}
	});

	onMount(() => {
		authState = getAuthState();
		if (!authState.isAuthenticated) {
			goto('/login');
			return;
		}
		loadSpark();
	});

	async function loadSpark() {
		try {
			isLoading = true;
			error = '';
			const sparkId = $page.params.id;

			const response = await authenticatedFetch(`http://localhost:3000/api/sparks/${sparkId}`);

			if (!response.ok) {
				if (response.status === 401) {
					clearAuth();
					goto('/login');
					return;
				}
				if (response.status === 404) {
					throw new Error('Spark not found');
				}
				throw new Error(`Failed to load spark: ${response.status}`);
			}

			spark = await response.json();
			backstoryContent = spark?.backstory || '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load spark';
			console.error('Error loading spark:', err);
		} finally {
			isLoading = false;
		}
	}

	async function saveBackstory() {
		if (!spark) return;

		try {
			isSaving = true;
			error = '';

			const response = await authenticatedFetch(`http://localhost:3000/api/sparks/${spark.id}`, {
				method: 'PUT',
				body: JSON.stringify({
					backstory: backstoryContent.trim() || null
				})
			});

			if (!response.ok) {
				throw new Error(`Failed to save backstory: ${response.status}`);
			}

			const updatedSpark = await response.json();
			spark = updatedSpark;
			isEditing = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save backstory';
			console.error('Error saving backstory:', err);
		} finally {
			isSaving = false;
		}
	}

	function toggleEditMode() {
		if (isEditing) {
			// Cancel editing - revert to original content
			backstoryContent = spark?.backstory || '';
		}
		isEditing = !isEditing;
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

	// Simple markdown to HTML converter for preview
	function markdownToHtml(markdown: string): string {
		if (!markdown) return '';

		return markdown
			// Headers
			.replace(/^### (.*$)/gim, '<h3>$1</h3>')
			.replace(/^## (.*$)/gim, '<h2>$1</h2>')
			.replace(/^# (.*$)/gim, '<h1>$1</h1>')
			// Bold
			.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
			// Italic
			.replace(/\*(.*)\*/gim, '<em>$1</em>')
			// Line breaks
			.replace(/\n\n/gim, '</p><p>')
			.replace(/\n/gim, '<br>')
			// Wrap in paragraphs
			.replace(/^(.*)$/gim, '<p>$1</p>')
			// Clean up empty paragraphs
			.replace(/<p><\/p>/gim, '')
			.replace(/<p>(<h[1-6]>.*<\/h[1-6]>)<\/p>/gim, '$1');
	}

	function handleArtifactSuccess(artifact: any) {
		// Navigate to artifacts page to see the created artifact
		goto('/artifacts');
	}

	function handleArtifactError(errorMessage: string) {
		artifactError = errorMessage;
	}

	function clearArtifactError() {
		artifactError = '';
	}
</script>

<svelte:head>
	<title>{spark ? spark.title : 'Loading...'} - Spark Details</title>
</svelte:head>

<AppNav />

<div class="spark-details-container">
	<header class="header">
		<div class="header-content container">
			<button onclick={() => goto('/sparks')} class="btn btn-neutral btn-sm">
				← Back to Sparks
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
				<button onclick={loadSpark} class="btn btn-error btn-sm">Retry</button>
			</div>
		{/if}

		{#if artifactError}
			<div class="alert alert-error flex justify-between items-center">
				<span>Artifact: {artifactError}</span>
				<button onclick={clearArtifactError} class="btn btn-error btn-sm">Dismiss</button>
			</div>
		{/if}

		{#if isLoading}
			<div class="loading">
				<div class="spinner"></div>
				<p>Loading spark details...</p>
			</div>
		{:else if spark}
			<div class="card spark-header mb-xl">
				<div class="card-body">
					<div class="spark-header-content">
						<div class="spark-title-section">
							<h1 class="page-title">{spark.title}</h1>
							<p class="page-subtitle">Created {formatDate(spark.createdAt)}</p>
						</div>
						<div class="spark-actions">
							<button
								onclick={() => showCreateArtifactModal = true}
								class="btn btn-success"
							>
								🤖 Generate Artifact
							</button>
						</div>
					</div>
				</div>
			</div>

			{#if spark.initialThoughts}
				<div class="card initial-thoughts-section mb-xl">
					<div class="card-header">
						<h2>Initial Thoughts</h2>
					</div>
					<div class="card-body">
						<div class="initial-thoughts-content">
							{spark.initialThoughts}
						</div>
					</div>
				</div>
			{/if}

			<div class="card backstory-section">
				<div class="card-header flex justify-between items-center">
					<h2>Backstory</h2>
					<div class="backstory-actions">
						{#if isEditing}
							<button onclick={saveBackstory} disabled={isSaving} class="btn btn-success btn-sm">
								{isSaving ? 'Saving...' : 'Save'}
							</button>
							<button onclick={toggleEditMode} class="btn btn-neutral btn-sm">Cancel</button>
						{:else}
							<button onclick={toggleEditMode} class="btn btn-primary btn-sm">Edit</button>
						{/if}
					</div>
				</div>

				<div class="card-body">
					{#if isEditing}
						<div class="editor-container">
							<div class="editor-header">
								<span class="editor-label">Markdown Editor</span>
								<span class="editor-hint">Use markdown syntax for formatting</span>
							</div>
							<textarea
								bind:value={backstoryContent}
								placeholder="Write your backstory in markdown...

# Example Heading
## Subheading

**Bold text** and *italic text*

- Bullet points
- More details"
								class="markdown-editor"
								rows="20"
							></textarea>
						</div>
					{:else}
						<div class="preview-container">
							{#if spark.backstory}
								<div class="markdown-preview">
									{@html markdownToHtml(spark.backstory)}
								</div>
							{:else}
								<div class="empty-state">
									<div class="empty-state-icon">📝</div>
									<h3 class="empty-state-title">No backstory yet</h3>
									<p class="empty-state-description">Click "Edit" to start developing your backstory for this spark.</p>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<div class="empty-state">
				<h2 class="empty-state-title">Spark not found</h2>
				<p class="empty-state-description">The spark you're looking for doesn't exist or you don't have access to it.</p>
				<button onclick={() => goto('/sparks')} class="btn btn-neutral">Back to Sparks</button>
			</div>
		{/if}
	</main>
</div>

<!-- Create Artifact Modal -->
{#if spark}
	<CreateArtifactModal
		isOpen={showCreateArtifactModal}
		sparkId={spark.id}
		onClose={() => showCreateArtifactModal = false}
		onSuccess={handleArtifactSuccess}
		onError={handleArtifactError}
	/>
{/if}

<style>
	.spark-details-container {
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

	.spark-header-content {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--spacing-lg);
	}

	.spark-title-section {
		flex: 1;
	}

	.spark-actions {
		flex-shrink: 0;
	}

	.initial-thoughts-content {
		color: var(--text-tertiary);
		line-height: 1.6;
		white-space: pre-line;
		font-style: italic;
	}

	.card-header h2 {
		margin: 0;
		color: var(--text-secondary);
		font-size: var(--text-xl);
		font-weight: var(--font-weight-semibold);
	}

	.backstory-actions {
		display: flex;
		gap: var(--spacing-sm);
	}

	.editor-container {
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.editor-header {
		background: var(--surface-hover);
		padding: var(--spacing-md) var(--spacing-lg);
		border-bottom: 1px solid var(--border-color);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.editor-label {
		font-weight: var(--font-weight-medium);
		color: var(--text-secondary);
		font-size: var(--text-sm);
	}

	.editor-hint {
		color: var(--text-muted);
		font-size: var(--text-xs);
	}

	.markdown-editor {
		width: 100%;
		border: none;
		padding: var(--spacing-lg);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		line-height: 1.5;
		resize: vertical;
		min-height: 400px;
		background: var(--surface-color);
	}

	.markdown-editor:focus {
		outline: none;
	}

	.preview-container {
		min-height: 200px;
	}

	.markdown-preview {
		color: var(--text-secondary);
		line-height: 1.6;
	}

	.markdown-preview :global(h1) {
		font-size: var(--text-2xl);
		font-weight: var(--font-weight-bold);
		color: var(--text-primary);
		margin: var(--spacing-xl) 0 var(--spacing-lg) 0;
	}

	.markdown-preview :global(h2) {
		font-size: var(--text-xl);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
		margin: var(--spacing-xl) 0 var(--spacing-md) 0;
	}

	.markdown-preview :global(h3) {
		font-size: var(--text-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--text-secondary);
		margin: var(--spacing-lg) 0 var(--spacing-sm) 0;
	}

	.markdown-preview :global(p) {
		margin: var(--spacing-md) 0;
	}

	.markdown-preview :global(strong) {
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
	}

	.markdown-preview :global(em) {
		font-style: italic;
	}

	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			gap: var(--spacing-lg);
		}

		.card-header {
			flex-direction: column;
			gap: var(--spacing-lg);
			align-items: flex-start !important;
		}

		.spark-header-content {
			flex-direction: column;
			align-items: stretch;
		}

		.spark-actions {
			align-self: stretch;
		}

		.spark-actions .btn {
			width: 100%;
		}
	}
</style>