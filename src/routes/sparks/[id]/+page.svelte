<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getAuthState, clearAuth, authenticatedFetch } from '$lib/auth';
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
	let spark = $state<Spark | null>(null);
	let isLoading = $state(true);
	let error = $state('');
	let isSaving = $state(false);

	// Editor state
	let isEditing = $state(false);
	let backstoryContent = $state('');

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
			backstoryContent = spark.backstory || '';
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
</script>

<svelte:head>
	<title>{spark ? spark.title : 'Loading...'} - Spark Details</title>
</svelte:head>

<AppNav />

<div class="spark-details-container">
	<header class="header">
		<div class="header-content">
			<button onclick={() => goto('/sparks')} class="back-btn">
				← Back to Sparks
			</button>
			{#if authState.user}
				<span class="user-info">{authState.user.email}</span>
			{/if}
		</div>
	</header>

	<main class="main-content">
		{#if error}
			<div class="error-banner">
				{error}
				<button onclick={loadSpark} class="retry-btn">Retry</button>
			</div>
		{/if}

		{#if isLoading}
			<div class="loading">
				<div class="loader"></div>
				<p>Loading spark details...</p>
			</div>
		{:else if spark}
			<div class="spark-header">
				<h1>{spark.title}</h1>
				<p class="spark-date">Created {formatDate(spark.createdAt)}</p>
			</div>

			{#if spark.initialThoughts}
				<div class="initial-thoughts-section">
					<h2>Initial Thoughts</h2>
					<div class="initial-thoughts-content">
						{spark.initialThoughts}
					</div>
				</div>
			{/if}

			<div class="backstory-section">
				<div class="backstory-header">
					<h2>Backstory</h2>
					<div class="backstory-actions">
						{#if isEditing}
							<button onclick={saveBackstory} disabled={isSaving} class="save-btn">
								{isSaving ? 'Saving...' : 'Save'}
							</button>
							<button onclick={toggleEditMode} class="cancel-btn">Cancel</button>
						{:else}
							<button onclick={toggleEditMode} class="edit-btn">Edit</button>
						{/if}
					</div>
				</div>

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
							<div class="empty-backstory">
								<div class="empty-icon">📝</div>
								<h3>No backstory yet</h3>
								<p>Click "Edit" to start developing your backstory for this spark.</p>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{:else}
			<div class="not-found">
				<h2>Spark not found</h2>
				<p>The spark you're looking for doesn't exist or you don't have access to it.</p>
				<button onclick={() => goto('/sparks')} class="back-btn">Back to Sparks</button>
			</div>
		{/if}
	</main>
</div>

<style>
	.spark-details-container {
		min-height: 100vh;
		background: #f8fafc;
	}

	.header {
		background: white;
		border-bottom: 1px solid #e2e8f0;
		padding: 1rem 0;
	}

	.header-content {
		max-width: 1000px;
		margin: 0 auto;
		padding: 0 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.back-btn {
		background: #6b7280;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
		text-decoration: none;
		display: inline-block;
	}

	.back-btn:hover {
		background: #4b5563;
	}

	.user-info {
		color: #6b7280;
		font-size: 0.9rem;
	}

	.main-content {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem 1rem;
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

	.spark-header {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.spark-header h1 {
		margin: 0 0 0.5rem 0;
		color: #1f2937;
		font-size: 2rem;
		font-weight: 700;
	}

	.spark-date {
		color: #6b7280;
		margin: 0;
		font-size: 0.95rem;
	}

	.initial-thoughts-section {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.initial-thoughts-section h2 {
		margin: 0 0 1rem 0;
		color: #374151;
		font-size: 1.25rem;
	}

	.initial-thoughts-content {
		color: #4b5563;
		line-height: 1.6;
		white-space: pre-line;
		font-style: italic;
	}

	.backstory-section {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.backstory-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.backstory-header h2 {
		margin: 0;
		color: #374151;
		font-size: 1.25rem;
	}

	.backstory-actions {
		display: flex;
		gap: 0.5rem;
	}

	.edit-btn {
		background: #667eea;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.edit-btn:hover {
		background: #5a67d8;
	}

	.save-btn {
		background: #10b981;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.save-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.cancel-btn {
		background: #6b7280;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.editor-container {
		border: 1px solid #d1d5db;
		border-radius: 8px;
		overflow: hidden;
	}

	.editor-header {
		background: #f3f4f6;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #d1d5db;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.editor-label {
		font-weight: 500;
		color: #374151;
		font-size: 0.875rem;
	}

	.editor-hint {
		color: #6b7280;
		font-size: 0.8rem;
	}

	.markdown-editor {
		width: 100%;
		border: none;
		padding: 1rem;
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
		line-height: 1.5;
		resize: vertical;
		min-height: 400px;
	}

	.markdown-editor:focus {
		outline: none;
	}

	.preview-container {
		min-height: 200px;
	}

	.markdown-preview {
		color: #374151;
		line-height: 1.6;
	}

	.markdown-preview :global(h1) {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
		margin: 1.5rem 0 1rem 0;
	}

	.markdown-preview :global(h2) {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin: 1.25rem 0 0.75rem 0;
	}

	.markdown-preview :global(h3) {
		font-size: 1.125rem;
		font-weight: 600;
		color: #374151;
		margin: 1rem 0 0.5rem 0;
	}

	.markdown-preview :global(p) {
		margin: 0.75rem 0;
	}

	.markdown-preview :global(strong) {
		font-weight: 600;
		color: #1f2937;
	}

	.markdown-preview :global(em) {
		font-style: italic;
	}

	.empty-backstory {
		text-align: center;
		padding: 4rem 0;
		color: #6b7280;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.empty-backstory h3 {
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.not-found {
		text-align: center;
		padding: 4rem 0;
	}

	.not-found h2 {
		color: #374151;
		margin-bottom: 1rem;
	}

	.not-found p {
		color: #6b7280;
		margin-bottom: 2rem;
	}

	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			gap: 1rem;
		}

		.backstory-header {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}

		.spark-header,
		.initial-thoughts-section,
		.backstory-section {
			padding: 1.5rem;
		}

		.spark-header h1 {
			font-size: 1.5rem;
		}
	}
</style>