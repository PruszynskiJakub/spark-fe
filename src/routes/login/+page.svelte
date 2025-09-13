<script lang="ts">
	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let errorMessage = $state('');

	const handleLogin = async (event: Event) => {
		event.preventDefault();
		isLoading = true;
		errorMessage = '';

		try {
			const response = await fetch('http://localhost:3000/api/tokens', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email,
					password
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || `Authentication failed: ${response.status}`);
			}

			const data = await response.json();

			// Store JWT token and user data
			localStorage.setItem('token', data.token);
			localStorage.setItem('user', JSON.stringify(data.user));

			console.log('Login successful:', { user: data.user });

			// Redirect to sparks page on success
			window.location.href = '/sparks';
		} catch (error) {
			console.error('Login failed:', error);
			errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
		} finally {
			isLoading = false;
		}
	};
</script>

<svelte:head>
	<title>Login - Spark</title>
	<meta name="description" content="Login to your Spark content creative workspace" />
</svelte:head>

<div class="login-container">
	<div class="card login-card">
		<div class="card-header text-center">
			<h1 class="page-title">✨ Spark</h1>
			<p class="page-subtitle">Your Content Creative Workspace</p>
		</div>

		<div class="card-body">
			<form on:submit={handleLogin} class="login-form">
				{#if errorMessage}
					<div class="alert alert-error">
						{errorMessage}
					</div>
				{/if}

				<div class="form-group">
					<label for="email" class="form-label">Email</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						placeholder="Enter your email"
						class="form-input"
						required
					/>
				</div>

				<div class="form-group">
					<label for="password" class="form-label">Password</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						placeholder="Enter your password"
						class="form-input"
						required
					/>
				</div>

				<button type="submit" class="btn btn-primary btn-lg" disabled={isLoading}>
					{isLoading ? 'Signing in...' : 'Sign in'}
				</button>
			</form>
		</div>

		<div class="card-footer text-center">
			<p>Don't have an account? <a href="/signup" class="link">Sign up</a></p>

			<div class="feature-highlight">
				<p class="feature-text">
					Transform your ideas into compelling content with AI-powered insights from your backstory
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	.login-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--primary-gradient);
		padding: var(--spacing-lg);
	}

	.login-card {
		width: 100%;
		max-width: 420px;
	}

	.feature-highlight {
		background: var(--surface-hover);
		border-radius: var(--radius-md);
		padding: var(--spacing-lg);
		margin-top: var(--spacing-lg);
	}

	.feature-text {
		color: var(--text-tertiary);
		font-size: var(--text-sm);
		line-height: 1.4;
		margin: 0;
	}

	@media (max-width: 480px) {
		.login-container {
			padding: var(--spacing-lg);
		}
	}
</style>