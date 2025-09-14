<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getAuthState } from '$lib/auth';

	onMount(() => {
		const authState = getAuthState();
		if (authState.isAuthenticated) {
			goto('/dashboard');
		}
	});
</script>

<div class="hero">
	<h1 class="page-title">✨ Welcome to Spark</h1>
	<p class="page-subtitle">Your Content Creative Workspace</p>
	<p class="description">
		Transform your ideas into compelling content with AI-powered insights from your backstory.
		Create LinkedIn posts, articles, and more from your creative sparks.
	</p>

	<div class="nav-buttons">
		<a href="/login" class="btn btn-primary">Login</a>
		<a href="/auth-test" class="btn btn-secondary">Test Auth</a>
	</div>
</div>

<style>
	.hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 80vh;
		text-align: center;
		padding: var(--spacing-2xl);
	}

	.description {
		max-width: 600px;
		color: var(--text-tertiary);
		line-height: 1.6;
		margin-bottom: var(--spacing-2xl);
		font-size: var(--text-lg);
	}

	.nav-buttons {
		display: flex;
		gap: var(--spacing-lg);
		flex-wrap: wrap;
		justify-content: center;
	}

	@media (max-width: 640px) {
		.nav-buttons {
			flex-direction: column;
			align-items: center;
		}

		.btn {
			width: 200px;
		}
	}
</style>
