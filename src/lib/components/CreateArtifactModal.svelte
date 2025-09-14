<script lang="ts">
	import { authenticatedFetch } from '$lib/auth';

	interface ArtifactType {
		id: string;
		name: string;
		description?: string;
	}

	interface Spark {
		id: string;
		title: string;
		createdAt: string;
	}

	interface CreateArtifactModalProps {
		isOpen: boolean;
		sparkId?: string; // Optional - if provided, spark selection is hidden
		onClose: () => void;
		onSuccess: (artifact: any) => void;
		onError: (error: string) => void;
	}

	let { isOpen, sparkId, onClose, onSuccess, onError }: CreateArtifactModalProps = $props();

	let artifactTypes = $state<ArtifactType[]>([]);
	let sparks = $state<Spark[]>([]);
	let isLoadingTypes = $state(true);
	let isLoadingSparks = $state(false);
	let isGenerating = $state(false);

	// Form state
	let selectedSparkId = $state(sparkId || '');
	let selectedArtifactTypeId = $state('');
	let generationRemarks = $state('');

	// Load artifact types when modal opens
	$effect(() => {
		if (isOpen) {
			loadArtifactTypes();
			if (!sparkId) {
				loadSparks();
			}
		}
	});

	// Reset form when modal opens/closes
	$effect(() => {
		if (isOpen) {
			selectedSparkId = sparkId || '';
			selectedArtifactTypeId = '';
			generationRemarks = '';
		}
	});

	async function loadArtifactTypes() {
		try {
			isLoadingTypes = true;
			const response = await authenticatedFetch('http://localhost:3000/api/artifacts/types/list');

			if (!response.ok) {
				throw new Error(`Failed to load artifact types: ${response.status}`);
			}

			artifactTypes = await response.json();
		} catch (err) {
			console.error('Error loading artifact types:', err);
			onError(err instanceof Error ? err.message : 'Failed to load artifact types');
		} finally {
			isLoadingTypes = false;
		}
	}

	async function loadSparks() {
		try {
			isLoadingSparks = true;
			const response = await authenticatedFetch('http://localhost:3000/api/sparks?limit=100&sortBy=createdAt&sortOrder=desc');

			if (!response.ok) {
				throw new Error(`Failed to load sparks: ${response.status}`);
			}

			const result = await response.json();
			sparks = result.data || result; // Handle both paginated and direct array responses
		} catch (err) {
			console.error('Error loading sparks:', err);
			onError(err instanceof Error ? err.message : 'Failed to load sparks');
		} finally {
			isLoadingSparks = false;
		}
	}


	async function handleGenerate() {
		if (!selectedSparkId || !selectedArtifactTypeId) {
			onError('Please select a spark and artifact type');
			return;
		}

		try {
			isGenerating = true;

			const response = await authenticatedFetch('http://localhost:3000/api/artifacts/generate', {
				method: 'POST',
				body: JSON.stringify({
					sparkId: selectedSparkId,
					artifactTypeId: selectedArtifactTypeId,
					remarks: generationRemarks.trim() || undefined
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || `Failed to generate artifact: ${response.status}`);
			}

			const artifact = await response.json();
			onSuccess(artifact);
			onClose();
		} catch (err) {
			console.error('Error generating artifact:', err);
			onError(err instanceof Error ? err.message : 'Failed to generate artifact');
		} finally {
			isGenerating = false;
		}
	}

	function handleModalClick(event: Event) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	function getSelectedSparkTitle(): string {
		if (sparkId) {
			return 'Current Spark';
		}
		const spark = sparks.find(s => s.id === selectedSparkId);
		return spark?.title || 'Select a spark...';
	}
</script>

{#if isOpen}
	<!-- Modal backdrop -->
	<div class="modal-backdrop" onclick={handleModalClick}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2 class="modal-title">Generate Artifact</h2>
				<button onclick={onClose} class="modal-close-btn" aria-label="Close modal">
					×
				</button>
			</div>

			<div class="modal-body">

				<!-- Spark Selection (only if sparkId not provided) -->
				{#if !sparkId}
					<div class="form-group">
						<label for="sparkSelect" class="form-label">Select Spark *</label>
						{#if isLoadingSparks}
							<div class="form-input loading-placeholder">Loading sparks...</div>
						{:else}
							<select
								id="sparkSelect"
								bind:value={selectedSparkId}
								class="form-input"
								required
							>
								<option value="">Choose a spark...</option>
								{#each sparks as spark}
									<option value={spark.id}>{spark.title}</option>
								{/each}
							</select>
						{/if}
					</div>
				{:else}
					<div class="form-group">
						<label class="form-label">Source Spark</label>
						<div class="selected-spark">
							<span class="spark-indicator">✨ {getSelectedSparkTitle()}</span>
						</div>
					</div>
				{/if}

				<!-- Artifact Type Selection -->
				<div class="form-group">
					<label for="typeSelect" class="form-label">Artifact Type *</label>
					{#if isLoadingTypes}
						<div class="form-input loading-placeholder">Loading types...</div>
					{:else}
						<select
							id="typeSelect"
							bind:value={selectedArtifactTypeId}
							class="form-input"
							required
						>
							<option value="">Choose artifact type...</option>
							{#each artifactTypes as type}
								<option value={type.id}>
									{type.name}{type.description ? ` - ${type.description}` : ''}
								</option>
							{/each}
						</select>
					{/if}
				</div>

				<!-- AI Generation Options -->
				<div class="form-group">
					<label for="generationRemarks" class="form-label">Generation Instructions (optional)</label>
					<textarea
						id="generationRemarks"
						bind:value={generationRemarks}
						placeholder="Any specific instructions for the AI generation..."
						rows="4"
						class="form-textarea"
					></textarea>
					<span class="field-hint">Provide specific guidance for content generation</span>
				</div>
			</div>

			<div class="modal-footer">
				<button onclick={onClose} class="btn btn-neutral">
					Cancel
				</button>
				<button
					onclick={handleGenerate}
					disabled={isGenerating || !selectedSparkId || !selectedArtifactTypeId}
					class="btn btn-success"
				>
					{isGenerating ? 'Generating...' : 'Generate Artifact'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
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
		background: var(--surface-color);
		border-radius: var(--border-radius-lg);
		box-shadow: var(--shadow-xl);
		width: 100%;
		max-width: 600px;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-xl);
		border-bottom: 1px solid var(--border-color);
		flex-shrink: 0;
	}

	.modal-title {
		margin: 0;
		color: var(--text-primary);
		font-size: var(--text-2xl);
		font-weight: var(--font-weight-semibold);
	}

	.modal-close-btn {
		background: none;
		border: none;
		font-size: var(--text-2xl);
		color: var(--text-muted);
		cursor: pointer;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--border-radius-md);
		transition: all var(--transition-normal);
	}

	.modal-close-btn:hover {
		background: var(--surface-hover);
		color: var(--text-secondary);
	}

	.modal-body {
		padding: var(--spacing-xl);
		overflow-y: auto;
		flex: 1;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-lg);
		padding: var(--spacing-xl);
		border-top: 1px solid var(--border-color);
		flex-shrink: 0;
	}


	.selected-spark {
		padding: var(--spacing-md);
		background: var(--surface-hover);
		border-radius: var(--border-radius-md);
		border-left: 4px solid var(--primary-color);
	}

	.spark-indicator {
		color: var(--text-secondary);
		font-weight: var(--font-weight-medium);
	}

	.loading-placeholder {
		color: var(--text-muted);
		font-style: italic;
		cursor: not-allowed;
	}

	.field-hint {
		display: block;
		margin-top: var(--spacing-xs);
		font-size: var(--text-xs);
		color: var(--text-muted);
	}

	@media (max-width: 640px) {
		.modal-backdrop {
			padding: var(--spacing-md);
		}

		.modal-header,
		.modal-body,
		.modal-footer {
			padding: var(--spacing-lg);
		}

		.modal-title {
			font-size: var(--text-xl);
		}

		.modal-footer {
			flex-direction: column;
		}
	}
</style>