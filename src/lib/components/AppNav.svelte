<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getAuthState, clearAuth } from '$lib/auth';

	let authState = $state(getAuthState());

	function handleLogout() {
		clearAuth();
		goto('/login');
	}

	function isCurrentPage(path: string): boolean {
		return $page.url.pathname === path;
	}
</script>

<header class="header">
	<div class="header-content">
		<div class="nav-left">
			<a href="/sparks" class="logo">✨ Spark</a>
			<nav class="nav-links">
				<a href="/sparks" class="nav-link" class:active={isCurrentPage('/sparks')}>Sparks</a>
				<a href="/profile" class="nav-link" class:active={isCurrentPage('/profile')}>Profile</a>
			</nav>
		</div>
		<div class="header-actions">
			{#if authState.user}
				<span class="user-info">
					{authState.user.name || authState.user.email}
				</span>
			{/if}
			<button onclick={handleLogout} class="logout-btn">Logout</button>
		</div>
	</div>
</header>

<style>
	.header {
		background: white;
		border-bottom: 1px solid #e2e8f0;
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.header-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 4rem;
	}

	.nav-left {
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.logo {
		font-size: 1.5rem;
		font-weight: 700;
		text-decoration: none;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.nav-links {
		display: flex;
		gap: 1.5rem;
	}

	.nav-link {
		color: #6b7280;
		text-decoration: none;
		font-weight: 500;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		transition: all 0.2s;
	}

	.nav-link:hover {
		color: #374151;
		background: #f3f4f6;
	}

	.nav-link.active {
		color: #3b82f6;
		background: #eff6ff;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.user-info {
		color: #6b7280;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.logout-btn {
		background: #ef4444;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		cursor: pointer;
		font-weight: 500;
		font-size: 0.875rem;
		transition: background 0.2s;
	}

	.logout-btn:hover {
		background: #dc2626;
	}

	@media (max-width: 768px) {
		.header-content {
			padding: 0 0.75rem;
		}

		.nav-left {
			gap: 1rem;
		}

		.nav-links {
			gap: 0.75rem;
		}

		.nav-link {
			padding: 0.375rem 0.5rem;
			font-size: 0.875rem;
		}

		.user-info {
			display: none;
		}
	}

	@media (max-width: 640px) {
		.nav-links {
			display: none;
		}

		.logo {
			font-size: 1.25rem;
		}
	}
</style>