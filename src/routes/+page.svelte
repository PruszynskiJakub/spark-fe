<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getAuthState } from '$lib/auth';

	onMount(() => {
		const authState = getAuthState();
		if (authState.isAuthenticated) {
			goto('/sparks');
		}
	});
</script>

<div class="hero">
	<h1>✨ Welcome to Spark</h1>
	<p class="tagline">Your Content Creative Workspace</p>
	<p class="description">
		Transform your ideas into compelling content with AI-powered insights from your backstory.
		Create LinkedIn posts, articles, and more from your creative sparks.
	</p>

	<div class="nav-buttons">
		<a href="/login" class="btn primary">Login</a>
		<a href="/auth-test" class="btn secondary">Test Auth</a>
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
		padding: 2rem;
	}

	h1 {
		font-size: 3rem;
		font-weight: 700;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin: 0 0 1rem 0;
	}

	.tagline {
		font-size: 1.25rem;
		color: #6b7280;
		margin: 0 0 1.5rem 0;
		font-weight: 500;
	}

	.description {
		max-width: 600px;
		color: #4b5563;
		line-height: 1.6;
		margin-bottom: 2rem;
		font-size: 1.1rem;
	}

	.nav-buttons {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.btn {
		padding: 0.875rem 1.5rem;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 500;
		transition: all 0.2s;
		border: 2px solid transparent;
	}

	.btn.primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.btn.primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 25px -5px rgba(102, 126, 234, 0.25);
	}

	.btn.secondary {
		background: transparent;
		color: #667eea;
		border-color: #667eea;
	}

	.btn.secondary:hover {
		background: #667eea;
		color: white;
	}

	@media (max-width: 640px) {
		h1 {
			font-size: 2rem;
		}

		.nav-buttons {
			flex-direction: column;
			align-items: center;
		}

		.btn {
			width: 200px;
		}
	}
</style>
