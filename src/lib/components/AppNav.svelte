<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getAuthState, clearAuth } from '$lib/auth';

	let authState = $state(getAuthState());
	let isMobileMenuOpen = $state(false);

	function handleLogout() {
		clearAuth();
		goto('/login');
	}

	function isCurrentPage(path: string): boolean {
		return $page.url.pathname === path;
	}

	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}

	function closeMobileMenu() {
		isMobileMenuOpen = false;
	}

	function handleNavClick(path: string) {
		closeMobileMenu();
		goto(path);
	}
</script>

<header class="header">
	<div class="header-content">
		<div class="nav-left">
			<a href="/dashboard" class="logo">✨ Spark</a>
			<nav class="nav-links desktop-nav">
				<a href="/dashboard" class="nav-link" class:active={isCurrentPage('/dashboard')}>Dashboard</a>
				<a href="/sparks" class="nav-link" class:active={isCurrentPage('/sparks')}>Sparks</a>
				<a href="/artifacts" class="nav-link" class:active={isCurrentPage('/artifacts')}>Artifacts</a>
				<a href="/profile" class="nav-link" class:active={isCurrentPage('/profile')}>Profile</a>
			</nav>
		</div>
		<div class="header-actions">
			{#if authState.user}
				<span class="user-info">
					{authState.user.name || authState.user.email}
				</span>
			{/if}
			<button onclick={handleLogout} class="logout-btn desktop-logout">Logout</button>

			<!-- Mobile hamburger button -->
			<button
				onclick={toggleMobileMenu}
				class="hamburger-btn"
				class:open={isMobileMenuOpen}
				aria-label="Toggle mobile menu"
			>
				<span class="hamburger-line"></span>
				<span class="hamburger-line"></span>
				<span class="hamburger-line"></span>
			</button>
		</div>
	</div>

	<!-- Mobile menu dropdown -->
	{#if isMobileMenuOpen}
		<div class="mobile-menu" class:open={isMobileMenuOpen}>
			<nav class="mobile-nav">
				<button
					onclick={() => handleNavClick('/dashboard')}
					class="mobile-nav-link"
					class:active={isCurrentPage('/dashboard')}
				>
					Dashboard
				</button>
				<button
					onclick={() => handleNavClick('/sparks')}
					class="mobile-nav-link"
					class:active={isCurrentPage('/sparks')}
				>
					Sparks
				</button>
				<button
					onclick={() => handleNavClick('/artifacts')}
					class="mobile-nav-link"
					class:active={isCurrentPage('/artifacts')}
				>
					Artifacts
				</button>
				<button
					onclick={() => handleNavClick('/profile')}
					class="mobile-nav-link"
					class:active={isCurrentPage('/profile')}
				>
					Profile
				</button>
				{#if authState.user}
					<div class="mobile-user-info">
						{authState.user.name || authState.user.email}
					</div>
				{/if}
				<button onclick={handleLogout} class="mobile-logout-btn">Logout</button>
			</nav>
		</div>
		<!-- Backdrop to close menu when clicking outside -->
		<div class="mobile-menu-backdrop" onclick={closeMobileMenu}></div>
	{/if}
</header>

<style>
	.header {
		background: var(--surface-color);
		border-bottom: 1px solid var(--border-color);
		position: sticky;
		top: 0;
		z-index: 100;
		box-shadow: var(--shadow-sm);
	}

	.header-content {
		max-width: var(--container-max-width);
		margin: 0 auto;
		padding: 0 var(--spacing-lg);
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 4rem;
		min-height: 4rem;
	}

	.nav-left {
		display: flex;
		align-items: center;
		gap: var(--spacing-2xl);
		min-width: 0; /* Allow shrinking */
	}

	.logo {
		font-size: var(--text-2xl);
		font-weight: var(--font-weight-bold);
		text-decoration: none;
		background: var(--primary-gradient);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.nav-links {
		display: flex;
		gap: var(--spacing-xl);
		min-width: 0; /* Allow shrinking */
	}

	.desktop-nav {
		display: flex;
	}

	.nav-link {
		color: var(--text-muted);
		text-decoration: none;
		font-weight: var(--font-weight-medium);
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-md);
		transition: all var(--transition-normal);
		white-space: nowrap;
		font-size: var(--text-sm);
	}

	.nav-link:hover {
		color: var(--text-secondary);
		background: var(--surface-hover);
	}

	.nav-link.active {
		color: var(--primary-color);
		background: var(--info-bg);
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--spacing-lg);
		min-width: 0; /* Allow shrinking */
		flex-shrink: 0;
	}

	.user-info {
		color: var(--text-muted);
		font-size: var(--text-sm);
		font-weight: var(--font-weight-medium);
		max-width: 150px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.logout-btn {
		background: var(--error-color);
		color: white;
		border: none;
		padding: var(--spacing-sm) var(--spacing-lg);
		border-radius: var(--radius-md);
		cursor: pointer;
		font-weight: var(--font-weight-medium);
		font-size: var(--text-sm);
		transition: all var(--transition-normal);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.logout-btn:hover {
		background: #b91c1c;
		transform: translateY(-1px);
	}

	/* Hamburger Menu Button */
	.hamburger-btn {
		display: none;
		flex-direction: column;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		background: none;
		border: none;
		cursor: pointer;
		padding: var(--spacing-xs);
		border-radius: var(--radius-md);
		transition: background-color var(--transition-normal);
	}

	.hamburger-btn:hover {
		background: var(--surface-hover);
	}

	.hamburger-line {
		width: 100%;
		height: 2px;
		background: var(--text-primary);
		border-radius: 1px;
		transition: all var(--transition-normal);
		transform-origin: center;
	}

	.hamburger-line:not(:last-child) {
		margin-bottom: 4px;
	}

	/* Hamburger animation */
	.hamburger-btn.open .hamburger-line:nth-child(1) {
		transform: rotate(45deg) translate(3px, 3px);
	}

	.hamburger-btn.open .hamburger-line:nth-child(2) {
		opacity: 0;
	}

	.hamburger-btn.open .hamburger-line:nth-child(3) {
		transform: rotate(-45deg) translate(3px, -3px);
	}

	/* Mobile Menu */
	.mobile-menu {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: var(--surface-color);
		border-bottom: 1px solid var(--border-color);
		box-shadow: var(--shadow-lg);
		z-index: 50;
		opacity: 0;
		transform: translateY(-10px);
		animation: slideDown var(--transition-normal) ease-out forwards;
	}

	.mobile-menu.open {
		opacity: 1;
		transform: translateY(0);
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.mobile-nav {
		display: flex;
		flex-direction: column;
		padding: var(--spacing-lg) 0;
		max-width: var(--container-max-width);
		margin: 0 auto;
	}

	.mobile-nav-link {
		display: block;
		width: 100%;
		padding: var(--spacing-lg) var(--spacing-lg);
		color: var(--text-secondary);
		text-decoration: none;
		font-weight: var(--font-weight-medium);
		transition: all var(--transition-normal);
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		font-size: var(--text-base);
	}

	.mobile-nav-link:hover {
		background: var(--surface-hover);
		color: var(--text-primary);
	}

	.mobile-nav-link.active {
		color: var(--primary-color);
		background: var(--info-bg);
		border-left: 4px solid var(--primary-color);
	}

	.mobile-user-info {
		padding: var(--spacing-lg) var(--spacing-lg);
		color: var(--text-muted);
		font-size: var(--text-sm);
		font-weight: var(--font-weight-medium);
		border-top: 1px solid var(--border-light);
		border-bottom: 1px solid var(--border-light);
		background: var(--surface-hover);
		margin: var(--spacing-sm) 0;
	}

	.mobile-logout-btn {
		margin: var(--spacing-sm) var(--spacing-lg);
		padding: var(--spacing-md) var(--spacing-lg);
		background: var(--error-color);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-weight: var(--font-weight-medium);
		cursor: pointer;
		transition: all var(--transition-normal);
		font-size: var(--text-base);
	}

	.mobile-logout-btn:hover {
		background: #b91c1c;
		transform: translateY(-1px);
	}

	.mobile-menu-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.1);
		z-index: 40;
		animation: fadeIn var(--transition-normal) ease-out forwards;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	/* Tablet breakpoint */
	@media (max-width: 768px) {
		.header-content {
			padding: 0 var(--spacing-md);
		}

		.nav-left {
			gap: var(--spacing-lg);
		}

		.nav-links {
			gap: var(--spacing-md);
		}

		.nav-link {
			padding: var(--spacing-xs) var(--spacing-sm);
			font-size: var(--text-xs);
		}

		.user-info {
			max-width: 100px;
		}

		.header-actions {
			gap: var(--spacing-md);
		}
	}

	/* Mobile breakpoint */
	@media (max-width: 640px) {
		.header-content {
			padding: 0 var(--spacing-md);
		}

		.nav-left {
			gap: var(--spacing-md);
			overflow: hidden;
		}

		.desktop-nav {
			display: none;
		}

		.logo {
			font-size: var(--text-xl);
		}

		.user-info {
			display: none;
		}

		.desktop-logout {
			display: none;
		}

		.hamburger-btn {
			display: flex;
		}

		.header-actions {
			gap: var(--spacing-sm);
		}
	}

	/* Very small screens */
	@media (max-width: 480px) {
		.header-content {
			padding: 0 var(--spacing-sm);
			height: 3.5rem;
			min-height: 3.5rem;
		}

		.logo {
			font-size: var(--text-lg);
		}

		.hamburger-btn {
			width: 1.75rem;
			height: 1.75rem;
		}
	}
</style>